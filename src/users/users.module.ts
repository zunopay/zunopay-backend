import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserController } from './users.controller';
import { PaymentService } from '../payment/payment.service';
import { SphereService } from '../third-party/sphere/sphere.service';
import { PrivyService } from '../third-party/privy/privy.service';
import { WebhookService } from '../indexer/webhook/webhook.service';
import { IndexerService } from '../indexer/indexer.service';

@Module({
  controllers: [UserController],
  providers: [
    UsersService,
    AuthService,
    JwtService,
    PaymentService,
    SphereService,
    PrivyService,
    WebhookService,
    IndexerService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
