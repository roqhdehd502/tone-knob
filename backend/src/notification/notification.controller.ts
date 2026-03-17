import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { NotificationService } from './notification.service';

@ApiTags('notifications')
@Controller('api/notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '알림 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getNotifications(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationService.getByUser(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: '읽지 않은 알림 수 조회' })
  async getUnreadCount(@Request() req: { user: { id: string } }) {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { unreadCount: count };
  }

  @Post(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.notificationService.markAsRead(id, req.user.id);
    return { message: '알림을 읽음 처리했습니다.' };
  }

  @Post('read-all')
  @ApiOperation({ summary: '모든 알림 읽음 처리' })
  async markAllAsRead(@Request() req: { user: { id: string } }) {
    await this.notificationService.markAllAsRead(req.user.id);
    return { message: '모든 알림을 읽음 처리했습니다.' };
  }

  @Delete(':id')
  @ApiOperation({ summary: '알림 삭제' })
  async deleteNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.notificationService.delete(id, req.user.id);
    return { message: '알림이 삭제되었습니다.' };
  }
}
