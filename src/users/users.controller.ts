import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserPayload } from 'src/auth/dto/authorization.dto';
import { UserEntity } from 'src/decorators/user.decorator';
import { UsersService } from './users.service';
import { UserAuth } from '../guards/user-auth';
import { toUserDto } from './dto/user.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role } from '@prisma/client';
import { toWalletBalanceDto, WalletBalanceDto } from './dto/wallet-balance.dto';
import {
  RoyaltyEarnedDto,
  toRoyaltyEarnedDtoArray,
} from 'src/shop/dto/royalty-earned.dto';

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

  @UserAuth()
  @Patch('/verify-email')
  async verifyEmail(@UserEntity() user: UserPayload) {
    await this.userService.verifyEmail(user.id);
  }

  @RolesGuard([Role.Admin])
  @Patch('/register/member/:username')
  async registerMember(@Param('username') username: string) {
    await this.userService.registerMember(username);
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

  @UserAuth()
  @Get('/get/royalty-earned')
  async getRoyaltyEarned(
    @UserEntity() user: UserPayload,
  ): Promise<RoyaltyEarnedDto[]> {
    const data = await this.userService.findRoyaltyEarned(user.id);
    return toRoyaltyEarnedDtoArray(data);
  }
}
