import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RewardPointTask, Role, TransferStatus, User } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RegisterDto } from './dto/register.dto';
import { validateEmail } from '../utils/user';
import { GoogleUserPayload } from '../auth/dto/authorization.dto';
import { AuthService } from '../auth/auth.service';
import { hashPassword } from '../utils/hash';
import { LoginDto } from './dto/login.dto';
import { isEmail } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { PaymentService } from '../payment/payment.service';
import { PrivyService } from '../third-party/privy/privy.service';
import { WalletBalanceInput } from './dto/wallet-balance.dto';
import { UserInput } from './dto/user.dto';
import { WebhookService } from '../indexer/webhook/webhook.service';
import { Currency } from '../types/payment';
import { appendTimestamp } from 'src/utils/general';
import { ShopInput } from '../shop/dto/shop.dto';
import { EARLY_USER_POINTS, USER_REFERRAL_POINTS } from '../constants';

@Injectable()
export class UsersService {
  /**
   * Onboarding flow:
   *
   * 1. Perform checks
   * 2. Create wallet
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
    private readonly webhookService: WebhookService,
  ) {}

  async getBalance(userId: number): Promise<WalletBalanceInput> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { wallet: { select: { address: true } } },
    });

    if (!user.wallet) {
      throw new BadRequestException("User doesn't have any wallet registered");
    }

    const balance = await this.paymentService.getWalletBalance(
      user.wallet.address,
    );

    // TODO: Convert usdc balance to correct currency
    return { balance, currency: Currency.USD };
  }

  async findOneById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async fetchMe(id: number): Promise<UserInput> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { wallet: { select: { address: true } } },
    });

    if (!user) throw new Error('User not found');

    return {
      ...user,
      walletAddress: user?.wallet?.address,
    };
  }

  async findOneByUsername(username: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findRoyaltyEarned(userId: number) {
    const referredShops = await this.prisma.shop.findMany({
      where: { user: { referredBy: { referrerId: userId } } },
      include: { user: { select: { wallet: { select: { address: true } } } } },
    });

    const royalties: { fee: number; shop: ShopInput }[] = [];
    for (const shop of referredShops) {
      const data = await this.prisma.transfer.aggregate({
        where: {
          receiverWalletAddress: shop.user.wallet.address,
          status: TransferStatus.Success,
        },
        _sum: { royaltyFee: true },
      });

      royalties.push({ fee: data._sum.royaltyFee, shop });
    }

    return royalties;
  }

  async registerMember(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });

    if (user.role == Role.Member) {
      throw new BadRequestException('User is already a member');
    }

    await this.prisma.user.update({
      where: { username },
      data: { role: Role.Member },
    });
  }

  async register(body: RegisterDto): Promise<User> {
    const { email, password, username, referralCode } = body;

    validateEmail(email);
    await this.checkIfUsernameTaken(username);
    await this.checkIfEmailTaken(email);

    const hashedPassword = await hashPassword(password);
    const emailVerifiedAt = !password ? new Date() : undefined;

    const user = await this.prisma.$transaction(async (tx) => {
      const refCode = await tx.referralCode.findUnique({
        where: { code: referralCode },
      });

      const isReferralCodeAvailable = refCode && !refCode.refereeId;
      if (!isReferralCodeAvailable) {
        throw new BadRequestException('Referral code is not available');
      }

      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          password: hashedPassword,
          emailVerifiedAt,
          referredBy: { connect: { code: referralCode } },
          s3BucketSlug: appendTimestamp(username.toLowerCase()),
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
      throw new UnauthorizedException('Email is already verified');
    }

    const { isAuthenticated, wallet } =
      await this.privyService.authenticateUser(user.email);

    if (!isAuthenticated) {
      throw new UnauthorizedException('User has not authenticated their email');
    }

    let walletAddress: string = wallet;

    if (!wallet) {
      const walletUser = await this.privyService.generateWallet(user.email);
      walletAddress = walletUser.wallet?.address;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        wallet: {
          connectOrCreate: {
            where: { address: walletAddress },
            create: { address: walletAddress, lastInteractedAt: new Date() },
          },
        },
      },
      include: { referredBy: true },
    });

    this.rewardUser(
      updatedUser.id,
      RewardPointTask.EarlyUser,
      EARLY_USER_POINTS,
    );
    this.rewardUser(
      updatedUser.referredBy.referrerId,
      RewardPointTask.UserReferred,
      USER_REFERRAL_POINTS,
    );
    this.webhookService.subscribeTo(walletAddress);
  }

  async rewardUser(
    userId: number,
    task: RewardPointTask,
    value: number,
    targetId?: number,
  ) {
    await this.prisma.userRewardPoint.create({
      data: {
        user: { connect: { id: userId } },
        task,
        value,
        targetId,
      },
    });
  }

  async getUserPoints(userId: number) {
    const rewards = await this.prisma.userRewardPoint.aggregate({
      where: { userId },
      _sum: { value: true },
    });

    return rewards._sum.value;
  }

  async getRefCodes() {
    const refCodes = await this.prisma.referralCode.findMany({
      where: { refereeId: null },
    });
    return refCodes;
  }

  async checkIfUsernameTaken(username: string) {
    const isUserExists = await this.prisma.user.findUnique({
      where: { username },
    });
    if (isUserExists) {
      throw new BadRequestException(`username ${username} is already taken`);
    }
  }

  async checkIfEmailTaken(email: string) {
    const isUserExists = await this.prisma.user.findUnique({
      where: { email },
    });
    if (isUserExists) {
      throw new BadRequestException(`email ${email} is already in use`);
    }
  }
}
