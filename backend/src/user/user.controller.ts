import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@ApiTags('Users')
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @ApiOperation({ summary: '사용자 프로필 조회' })
  async getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로필 수정' })
  async updateUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (currentUser.id !== id) {
      throw new Error('자신의 프로필만 수정할 수 있습니다');
    }
    return this.userService.update(id, updateUserDto);
  }
}
