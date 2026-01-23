import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    const u = this.userService.findById(user.userId);
    return {
      id: u?.id ?? user.userId,
      email: u?.email ?? user.email,
      nickname: u?.nickname,
      instrument: u?.instrument,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    const updated = this.userService.updateProfile(user.userId, dto);
    return {
      id: updated.id,
      email: updated.email,
      nickname: updated.nickname,
      instrument: updated.instrument,
    };
  }
}
