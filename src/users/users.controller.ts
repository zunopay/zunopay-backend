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
import { StartKycDto } from './dto/start-kyc.dto';

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
  async verify(
    @UserEntity() user: UserPayload,
    @Body() body: VerifyUserDto,
  ) {
    await this.userService.verify(user, body);
  }

  @Post('/start-kyc')
  async startKyc(@UserEntity() user: UserPayload, @Body() body: StartKycDto){
    await this.userService.startKyc(user.id, body.vpa);
  }

  @RolesGuard([Role.Admin])
  @Patch('register/verifier/:username')
  async registerVerifier(@Param('username') username: string) {
    await this.userService.registerVerifier(username);
  }

  @UserAuth()
  @Get('get/balance')
  async getBalance(@UserEntity() user: UserPayload): Promise<string> {
    return await this.userService.getBalance(user.id);
  }
}
