import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GoogleUserRequest, Request } from '../types/request';

export const GoogleUserEntity = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<GoogleUserRequest>();
    return request.user;
  },
);

export const UserEntity = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user;
  },
);
