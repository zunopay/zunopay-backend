import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RegisterDto } from './dto/register.dto';
import { validateEmail } from '../utils/user';
import { GoogleUserPayload } from '../auth/dto/authorization.dto';
import { AuthService } from '../auth/auth.service';
import { hashPassword } from '../utils/hash';
import { LoginDto } from './dto/login.dto';
import { isEmail } from 'class-validator';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async findOneById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findOne(username: string): Promise<User> {
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
    const { email, password, username, region, role } = body;

    validateEmail(email);

    const hashedPassword = await hashPassword(password);
    const emailVerifiedAt = !password ? new Date() : undefined;

    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
        region,
        role,
        emailVerifiedAt,
      },
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
}
