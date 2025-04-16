import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './payment/payment.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from './config/config';
import { loggingMiddleware, PrismaModule } from 'nestjs-prisma';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { SecurityConfig } from './config/config.interface';
import { MerchantModule } from './merchant/merchant.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
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
    PrismaModule.forRoot({
      isGlobal: true,

      prismaServiceOptions: {
        middlewares: [loggingMiddleware()],
        prismaOptions: { errorFormat: 'pretty' },
      },
    }),
    UsersModule,
    AuthModule,
    PaymentModule,
    MerchantModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
