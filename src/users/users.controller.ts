import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserPayload } from 'src/auth/dto/authorization.dto';
import { UserEntity } from 'src/decorators/user.decorator';
import { UsersService } from './users.service';
import { UserAuth } from '../guards/user-auth';
import { toUserDto } from './dto/user.dto';

@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UsersService) {}

  @UserAuth()
  @Get('get/me')
  async fetchMe(@UserEntity() user: UserPayload) {
    const me = await this.userService.findOneById(user.id);
    return toUserDto(me);
  }
}
