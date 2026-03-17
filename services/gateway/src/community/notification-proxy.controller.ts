import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('api/notifications')
export class NotificationProxyController {
  constructor(
    @Inject('COMMUNITY_SERVICE') private readonly communityClient: ClientProxy,
  ) {}

  @Get()
  async getNotifications(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.communityClient.send('notification.getByUser', {
        userId: req.user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: { user: { id: string } }) {
    const count = await firstValueFrom(
      this.communityClient.send('notification.unreadCount', { userId: req.user.id }),
    );
    return { unreadCount: count };
  }

  @Post(':id/read')
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    await firstValueFrom(
      this.communityClient.send('notification.markAsRead', { notificationId: id, userId: req.user.id }),
    );
    return { message: '알림을 읽음 처리했습니다.' };
  }

  @Post('read-all')
  async markAllAsRead(@Request() req: { user: { id: string } }) {
    await firstValueFrom(
      this.communityClient.send('notification.markAllAsRead', { userId: req.user.id }),
    );
    return { message: '모든 알림을 읽음 처리했습니다.' };
  }

  @Delete(':id')
  async deleteNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    await firstValueFrom(
      this.communityClient.send('notification.delete', { notificationId: id, userId: req.user.id }),
    );
    return { message: '알림이 삭제되었습니다.' };
  }
}
