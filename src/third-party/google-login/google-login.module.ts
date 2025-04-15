import { Module } from '@nestjs/common';
import { GoogleAuthService } from './google-login.service';

@Module({
  providers: [GoogleAuthService],
})
export default class GoogleLoginModule {}
