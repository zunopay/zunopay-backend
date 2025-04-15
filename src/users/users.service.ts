import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RegisterDto } from './dto/register.dto';
import { validateEmail } from 'src/utils/user';
import { GoogleUserPayload } from 'src/auth/dto/authorization.dto';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async findOne(username: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async register(body: RegisterDto): Promise<User> {
    const { email, password, username, region } = body;

    validateEmail(email);

    /* TODO: Hash password, not required yet start with google login */

    const user = await this.prisma.user.create({
      data: { email, username, password, region, role: 'Indiviual' },
    });

    return user;
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
