import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SecurityConfig } from '../config/config.interface';
import { UsersService } from '../users/users.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { PrivyService } from '../third-party/privy/privy.service';
import { PaymentService } from '../payment/payment.service';
import { SphereService } from '../third-party/sphere/sphere.service';
import { WebhookService } from '../indexer/webhook/webhook.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      //eslint-disable-next-line @typescript-eslint/require-await
      useFactory: async (configService: ConfigService) => {
        const securityConfig = configService.get<SecurityConfig>('security');
        return {
          secret: configService.get<string>('JWT_ACCESS_SECRET'),
          signOptions: { expiresIn: securityConfig.expiresIn },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    JwtStrategy,
    PrivyService,
    PaymentService,
    SphereService,
    WebhookService,
  ],
})
export class AuthModule {}
