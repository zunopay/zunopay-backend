import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RewardPointTask, Role, User } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RegisterDto } from './dto/register.dto';
import { validateEmail } from '../utils/user';
import { GoogleUserPayload, UserPayload } from '../auth/dto/authorization.dto';
import { AuthService } from '../auth/auth.service';
import { generateCommitment, hashPassword } from '../utils/hash';
import { LoginDto } from './dto/login.dto';
import { isEmail } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { PaymentService } from '../payment/payment.service';
import { VerifyUserDto } from './dto/verifiy-user.dto';
import { PrivyService } from '../third-party/privy/privy.service';

@Injectable()
export class UsersService {
  /**
   * Onboarding flow:
   *
   * 1. Perform checks
   * 2. Create wallet and vpa commitment
   * 3. Register
   *
   * -- Only when offramping.
   * 1. Create customer
   * 2. Generate TOS
   * 3. KYB
   * 4. Create Offramp provider wallet account
   * 5. Create Offramp provider bank account
   * */

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly paymentService: PaymentService,
    private readonly privyService: PrivyService,
  ) {}

  async getBalance(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user.walletAddress) {
      throw new BadRequestException(
        " User doesn't have any wallet registered ",
      );
    }

    const balance = await this.paymentService.getWalletBalance(
      user.walletAddress,
    );
    return balance;
  }

  async findOneById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async fetchMe(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { registry: { select: { verification: true } } },
    });

    if (!user) throw new Error('User not found');

    const { registry, ...rest } = user;
    return { ...rest, verification: !!registry?.verification };
  }

  async findOneByUsername(username: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async registerVerifier(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { verifier: true },
    });

    if (user.verifier) {
      throw new BadRequestException(' User is already a verifier ');
    }

    await this.prisma.user.update({
      where: { username },
      data: {
        role: Role.KycVerifier,
        verifier: { create: { createdAt: new Date() } },
      },
    });
  }

  async register(body: RegisterDto): Promise<User> {
    const { email, password, username, region, role, referralCode } = body;

    validateEmail(email);

    const hashedPassword = await hashPassword(password);
    const emailVerifiedAt = !password ? new Date() : undefined;

    const user = await this.prisma.$transaction(async (tx) => {
      const refCode = await tx.referralCode.findUnique({
        where: { code: referralCode },
      });

      const isReferralCodeAvailable = refCode && !refCode.refereeId;
      if (!isReferralCodeAvailable) {
        throw new BadRequestException(' Referral code is not available ');
      }

      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          password: hashedPassword,
          region,
          role: Role[role],
          emailVerifiedAt,
          referredBy: { connect: { code: referralCode } },
        },
      });

      return user;
    });

    return user;
  }

  async login(body: LoginDto) {
    const { usernameOrEmail, password } = body;
    const lowerCaseValue = usernameOrEmail.toLowerCase();

    let user: User;
    if (isEmail(usernameOrEmail)) {
      user = await this.prisma.user.findUnique({
        where: { email: lowerCaseValue },
      });
    } else {
      user = await this.prisma.user.findUnique({
        where: { username: lowerCaseValue },
      });
    }

    if (!user) {
      throw new NotFoundException(`User with id ${usernameOrEmail} not found`);
    }

    if (!user.password.length) {
      throw new BadRequestException(
        'This user is linked to a Google Account. Please use google sign in.',
      );
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      throw new UnauthorizedException("Password doesn't match");
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
  }

  async handleLoginWithGoogle(googleUser: GoogleUserPayload) {
    const { email } = googleUser;

    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user.emailVerifiedAt) {
        await this.prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            emailVerifiedAt: new Date(),
          },
        });
      }
      return this.authService.authorizeUser(user);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      return false;
    }
  }

  async verifyEmail(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (user.emailVerifiedAt) {
      throw new UnauthorizedException(' Email is already verified ');
    }

    const { isAuthenticated, wallet } =
      await this.privyService.authenticateUser(user.email);

    if (!isAuthenticated) {
      throw new UnauthorizedException(
        ' User has not authenticated their email ',
      );
    }

    let walletAddress: string = wallet;

    if (!wallet) {
      const walletUser = await this.privyService.generateWallet(user.email);
      walletAddress = walletUser.wallet?.address;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        walletAddress,
      },
    });
  }

  async startKyc(userId: number, vpa: string) {
    const commitment = generateCommitment(vpa);

    // check if verified vpa already exists
    const registry = await this.prisma.keyWalletRegistry.findFirst({
      where: { commitment, verification: { isNot: null } },
    });

    const isCommitmentExists = !!registry;
    if (isCommitmentExists) {
      throw new BadRequestException(
        ' Payment address already exists, use different payment address for this account. Contact us if not you ',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        registry: { create: { commitment } },
      },
    });
  }

  async verifyVpa(kycVerifier: UserPayload, body: VerifyUserDto) {
    const { vpa, username } = body;

    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { registry: true },
    });

    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    if (!user.emailVerifiedAt) {
      throw new BadRequestException('User email is not verified');
    }

    const verifierData = await this.prisma.kycVerifier.findUnique({
      where: { userId: kycVerifier.id },
    });

    if (!verifierData || verifierData?.deletedAt) {
      throw new UnauthorizedException();
    }

    const commitment = generateCommitment(vpa);

    if (!user.registry || user.registry.commitment !== commitment) {
      throw new BadRequestException("Virtual private address doesn't match");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        registry: {
          update: {
            verification: {
              create: {
                verifier: { connect: { id: verifierData.id } },
              },
            },
          },
        },
      },
    });

    await this.rewardUser(kycVerifier.id, RewardPointTask.MerchantOnboarding);
  }

  async rewardUser(userId: number, task: RewardPointTask) {
    await this.prisma.userRewardPoints.create({
      data: {
        user: { connect: { id: userId } },
        reward: { connect: { task } },
      },
    });
  }

  async getUserPoints(userId: number) {
    const rewards = await this.prisma.userRewardPoints.findMany({
      where: { userId },
      select: { reward: { select: { points: true } } },
    });
    let totalPoints = 0;

    rewards.forEach((data) => (totalPoints += data.reward.points));
    return totalPoints;
  }
}
