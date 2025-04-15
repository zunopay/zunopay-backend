import {
  applyDecorators,
  CanActivate,
  CustomDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { Request } from '../types/request';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JWT_LABEL } from '../constants';
import { UserAuth } from './user-auth';

const RoleMetadataKey = 'roles';

export function ApplyRoles(roles: Role[]): CustomDecorator<string> {
  return SetMetadata(RoleMetadataKey, roles);
}

@Injectable()
class RolesAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const handler = ctx.getHandler();
    const requiredRoles = this.reflector.get<Role[]>(RoleMetadataKey, handler);
    if (!requiredRoles) return true;

    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) return false;

    if (requiredRoles.includes(user.role)) {
      return true;
    } else {
      throw new ForbiddenException('You do not have the required role');
    }
  }
}

export function RolesGuard(roles: Role[]) {
  return applyDecorators(
    UserAuth(),
    UseGuards(RolesAuthGuard),
    ApplyRoles(roles),
    ApiBearerAuth(JWT_LABEL),
  );
}
