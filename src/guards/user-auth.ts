import {
  applyDecorators,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from '../types/request';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JWT_LABEL } from '../constants';

@Injectable()
class UserAuthGuard extends AuthGuard('jwt') {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    let parentCanActivate = false;

    try {
      parentCanActivate = (await super.canActivate(ctx)) as boolean;
    } catch (error: any) {
      const isHttpException = error instanceof HttpException;
      if (isHttpException) {
        // If it's a default 'Unauthorized' error, give it a more descriptive message
        if (error.message === 'Unauthorized' && error.getStatus() === 401) {
          throw new UnauthorizedException('Authorization invalid or expired');
        }
      }
      throw error;
    }

    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user) return false;

    return parentCanActivate;
  }
}

export function UserAuth() {
  return applyDecorators(UseGuards(UserAuthGuard), ApiBearerAuth(JWT_LABEL));
}
