import { Body, Controller, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { RegisterDto } from 'src/users/dto/register.dto';
import { Authorization } from './dto/authorization.dto';
import { AuthService } from './auth.service';
import { LoginDto } from 'src/users/dto/login.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('/register')
  async register(@Body() body: RegisterDto): Promise<Authorization> {
    const user = await this.userService.register(body);
    return this.authService.authorizeUser(user);
  }

  @Patch('/login')
  async login(@Body() body: LoginDto): Promise<Authorization> {
    const user = await this.userService.login(body);
    return this.authService.authorizeUser(user);
  }

  // @Post('user/register-with-google')
  // async registerGoogleUser(
  //   @Body() body: GoogleRegisterDto,
  //   @GoogleUserEntity() { email }: GoogleUserPayload,
  // ): Promise<Authorization> {
  //   const user = await this.userService.register({
  //     ...body,
  //     email,
  //     password: '',
  //   });

  //   return this.authService.authorizeUser(user);
  // }

  // @GoogleUserAuth()
  // @Patch('/login-with-google')
  // async loginGoogleUser(@GoogleUserEntity() user: GoogleUserPayload) {
  //   return await this.userService.handleLoginWithGoogle(user);
  // }
}
