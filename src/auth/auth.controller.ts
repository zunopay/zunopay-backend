import { Body, Controller, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { GoogleRegisterDto, RegisterDto } from 'src/users/dto/register.dto';
import {
  Authorization,
  GoogleUserPayload,
  UserPayload,
} from './dto/authorization.dto';
import { GoogleUserEntity, UserEntity } from '../decorators/user.decorator';
import { GoogleUserAuth } from '../guards/google-user-auth';
import { AuthService } from './auth.service';
import { LoginDto } from 'src/users/dto/login.dto';
import { MerchantService } from 'src/merchant/merchant.service';
import { RegisterMerchantDto } from 'src/merchant/dto/register-merchant.dto';
import { UserAuth } from 'src/guards/user-auth';
import { MerchantDto, toMerchantDto } from 'src/merchant/dto/merchant.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly userService: UsersService,
    private readonly merchantService: MerchantService,
    private readonly authService: AuthService,
  ) {}

  @UserAuth()
  @Post('merchant/register')
  async registerMerchant(
    @UserEntity() user: UserPayload,
    @Body() body: RegisterMerchantDto,
  ): Promise<MerchantDto> {
    const merchant = await this.merchantService.register(user.id, body);
    return toMerchantDto(merchant);
  }

  @Post('user/register')
  async register(@Body() body: RegisterDto): Promise<Authorization> {
    const user = await this.userService.register(body);
    return this.authService.authorizeUser(user);
  }

  @Patch('/login')
  async login(@Body() body: LoginDto): Promise<Authorization> {
    const user = await this.userService.login(body);
    return this.authService.authorizeUser(user);
  }

  @Post('user/register-with-google')
  async registerGoogleUser(
    @Body() body: GoogleRegisterDto,
    @GoogleUserEntity() { email }: GoogleUserPayload,
  ): Promise<Authorization> {
    const user = await this.userService.register({
      ...body,
      email,
      password: '',
    });

    return this.authService.authorizeUser(user);
  }

  @GoogleUserAuth()
  @Patch('/login-with-google')
  async loginGoogleUser(@GoogleUserEntity() user: GoogleUserPayload) {
    return await this.userService.handleLoginWithGoogle(user);
  }
}
