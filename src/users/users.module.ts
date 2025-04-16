import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserController } from './users.controller';

@Module({
  controllers: [UserController],
  providers: [UsersService, AuthService, JwtService],
  exports: [UsersService],
})
export class UsersModule {}
