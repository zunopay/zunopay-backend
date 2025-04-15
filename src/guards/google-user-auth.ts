import {
  applyDecorators,
  BadRequestException,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { GoogleUserRequest } from '../types/request';
import { Request } from 'express';
import { GoogleAuthService } from '../third-party/google-login/google-login.service';

export class GoogleUserGuard implements CanActivate {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<GoogleUserRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const isValidGoogleToken =
        await this.googleAuthService.isValidGoogleToken(token);
      if (!isValidGoogleToken) {
        throw new BadRequestException('Malformed or expired token');
      }

      const user = await this.googleAuthService.extractUserFromToken(token);
      request['user'] = user;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Google' ? token : undefined;
  }
}

export function GoogleUserAuth() {
  // Apply guard to controller context with UseGuard
  return applyDecorators(UseGuards(GoogleAuthService));
}
