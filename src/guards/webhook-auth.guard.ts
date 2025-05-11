import { CanActivate, ExecutionContext, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

export class WebhookAuthGuard implements CanActivate {
  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const { headers } = context.switchToHttp().getRequest<Request>();

    if (!headers.authorization) return false;
    const [, token] = headers.authorization.split('Bearer ');

    const { webhook } = jwt.verify(token, process.env.JWT_ACCESS_SECRET) as {
      webhook: boolean;
    };

    return webhook;
  }
}

export function WebhookAuth() {
  return UseGuards(WebhookAuthGuard);
}
