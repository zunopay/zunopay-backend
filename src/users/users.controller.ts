import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserPayload } from 'src/auth/dto/authorization.dto';
import { UserEntity } from 'src/decorators/user.decorator';
import { UsersService } from './users.service';
import { UserAuth } from '../guards/user-auth';
import { toUserDto } from './dto/user.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role } from '@prisma/client';

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

  @RolesGuard([Role.Admin])
  @Patch('register/verifier/:username')
  async registerVerifier(@Param('username') username: string) {
    await this.userService.registerVerifier(username);
  }
}
