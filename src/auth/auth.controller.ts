import { Body, Controller, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { GoogleRegisterDto } from 'src/users/dto/register.dto';
import { GoogleUserPayload } from './dto/authorization.dto';
import { GoogleUserEntity } from '../decorators/user.decorator';
import { GoogleUserAuth } from '../guards/google-user-auth';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly userService: UsersService) {}

  @Post('user/register-with-google')
  async registerGoogleUser(
    @Body() body: GoogleRegisterDto,
    @GoogleUserEntity() { email }: GoogleUserPayload,
  ) {
    return await this.userService.register({
      ...body,
      email,
      password: '',
    });
  }

  @GoogleUserAuth()
  @Patch('user/login-with-google')
  async loginGoogleUser(@GoogleUserEntity() user: GoogleUserPayload) {
    return await this.userService.handleLoginWithGoogle(user);
  }
}
