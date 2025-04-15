import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { JwtDto, JwtPayload } from './dto/authorization.dto';
import { pick } from 'lodash';
import { PrismaService } from 'nestjs-prisma';

const sanitizePayload = (payload: JwtPayload) => {
  return pick(payload, 'type', 'id', 'email', 'name', 'role');
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  authorizeUser(user: User) {
    return {
      accessToken: this.generateAccessToken(user),
      // refereshToken: this.generateRefreshToken()
    };
  }

  async validateJwt(jwt: JwtDto) {
    const user = await this.prisma.user.findUnique({ where: { id: jwt.id } });
    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  private generateAccessToken(payload: JwtPayload): string {
    const sanitizedPayload = sanitizePayload(payload);
    const accessToken = `Bearer ${this.jwtService.sign(sanitizedPayload)}`;
    return accessToken;
  }

  /* TODO */
  private generateRefreshToken() {}
}
