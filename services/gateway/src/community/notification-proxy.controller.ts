import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { firstValueFrom } from 'rxjs';

import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RpcToHttpExceptionFilter } from '../common/rpc-exception.filter';

@ApiTags('Notifications')
@Controller('api/notifications')
@UseFilters(RpcToHttpExceptionFilter)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationProxyController {
  constructor(
    @Inject('COMMUNITY_SERVICE') private readonly communityClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({
    summary: '내 알림 목록 조회',
    description: '좋아요/댓글/팔로우/뱃지 수여/구매/AI 작업 완료 등 서비스 전반에서 발생하는 알림을 최신순으로 조회합니다.',
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (기본값 1)' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수 (기본값 20)' })
  @ApiResponse({ status: 200, description: '알림 목록 및 안 읽은 개수 반환' })
  async getNotifications(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.communityClient.send('notification.getByUser', {
        userId: user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: '안 읽은 알림 개수 조회', description: '헤더의 알림 뱃지 표시 등에 사용합니다.' })
  @ApiResponse({ status: 200, description: '{ unreadCount: number } 반환' })
  async getUnreadCount(@CurrentUser() user: RequestUser) {
    const count = await firstValueFrom(
      this.communityClient.send('notification.unreadCount', { userId: user.id }),
    );
    return { unreadCount: count };
  }

  @Post(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리', description: '특정 알림 하나를 읽음 상태로 변경합니다.' })
  @ApiParam({ name: 'id', description: '알림 ID' })
  @ApiResponse({ status: 201, description: '읽음 처리 완료' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    await firstValueFrom(
      this.communityClient.send('notification.markAsRead', { notificationId: id, userId: user.id }),
    );
    return { message: '알림을 읽음 처리했습니다.' };
  }

  @Post('read-all')
  @ApiOperation({ summary: '모든 알림 읽음 처리', description: '로그인한 사용자의 안 읽은 알림을 전부 읽음 상태로 변경합니다.' })
  @ApiResponse({ status: 201, description: '전체 읽음 처리 완료' })
  async markAllAsRead(@CurrentUser() user: RequestUser) {
    await firstValueFrom(
      this.communityClient.send('notification.markAllAsRead', { userId: user.id }),
    );
    return { message: '모든 알림을 읽음 처리했습니다.' };
  }

  @Delete(':id')
  @ApiOperation({ summary: '알림 삭제', description: '본인의 알림만 삭제할 수 있습니다.' })
  @ApiParam({ name: 'id', description: '알림 ID' })
  @ApiResponse({ status: 200, description: '삭제 완료' })
  async deleteNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    await firstValueFrom(
      this.communityClient.send('notification.delete', { notificationId: id, userId: user.id }),
    );
    return { message: '알림이 삭제되었습니다.' };
  }
}
