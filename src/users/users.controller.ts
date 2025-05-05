import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserPayload } from 'src/auth/dto/authorization.dto';
import { UserEntity } from 'src/decorators/user.decorator';
import { UsersService } from './users.service';
import { UserAuth } from '../guards/user-auth';
import { toUserDto } from './dto/user.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role } from '@prisma/client';
import { VerifyUserDto } from './dto/verifiy-user.dto';
import { toWalletBalanceDto, WalletBalanceDto } from './dto/wallet-balance.dto';
import { ConnectBankDto, toConnectBankDto } from './dto/connect-bank.dto';

@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UsersService) {}

  @UserAuth()
  @Get('get/me')
  async fetchMe(@UserEntity() user: UserPayload) {
    const me = await this.userService.fetchMe(user.id);
    return toUserDto(me);
  }

  @RolesGuard([Role.KycVerifier])
  @Patch('/verify')
  async verify(@UserEntity() user: UserPayload, @Body() body: VerifyUserDto) {
    await this.userService.verifyVpa(user, body);
  }

  @UserAuth()
  @Patch('/verify-email')
  async verifyEmail(@UserEntity() user: UserPayload) {
    await this.userService.verifyEmail(user.id);
  }

  @UserAuth()
  @Get('/get/vpa')
  async getConnectedVpa(@UserEntity() user: UserPayload){
    const data = await this.userService.getConnectedVpa(user.id);
    return toConnectBankDto(data);
  }

  @UserAuth()
  @Patch('/connect-bank')
  async connectBank(@UserEntity() user: UserPayload, @Body() body: ConnectBankDto) {
    const data = await this.userService.connectBank(user.id, body.vpa);
    return toConnectBankDto(data);
  }

  @RolesGuard([Role.Admin])
  @Patch('/register/verifier/:username')
  async registerVerifier(@Param('username') username: string) {
    await this.userService.registerVerifier(username);
  }

  @UserAuth()
  @Get('/get/balance')
  async getBalance(@UserEntity() user: UserPayload): Promise<WalletBalanceDto> {
    const balance = await this.userService.getBalance(user.id);
    return toWalletBalanceDto(balance);
  }

  @UserAuth()
  @Get('/get/reward-points')
  async getRewardPoints(@UserEntity() user: UserPayload): Promise<number> {
    return await this.userService.getUserPoints(user.id);
  }
}
