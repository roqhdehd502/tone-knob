import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('api/community')
export class CommunityProxyController {
  constructor(
    @Inject('COMMUNITY_SERVICE') private readonly communityClient: ClientProxy,
  ) {}

  // ─── 좋아요 ───

  @Post('tabs/:tabId/like')
  async toggleLike(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Request() req: { user: { id: string } },
  ) {
    return firstValueFrom(
      this.communityClient.send('community.toggleLike', { tabId, userId: req.user.id }),
    );
  }

  @Get('tabs/:tabId/like')
  async isLiked(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Request() req: { user: { id: string } },
  ) {
    const liked = await firstValueFrom(
      this.communityClient.send('community.isLiked', { tabId, userId: req.user.id }),
    );
    return { liked };
  }

  // ─── 댓글 ───

  @Post('tabs/:tabId/comments')
  async createComment(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Body() dto: { content: string; parentId?: string },
    @Request() req: { user: { id: string } },
  ) {
    return firstValueFrom(
      this.communityClient.send('community.createComment', { tabId, userId: req.user.id, dto }),
    );
  }

  @Get('tabs/:tabId/comments')
  async getComments(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.communityClient.send('community.getComments', {
        tabId,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Get('comments/:commentId/replies')
  async getReplies(@Param('commentId', ParseUUIDPipe) commentId: string) {
    return firstValueFrom(
      this.communityClient.send('community.getReplies', { commentId }),
    );
  }

  @Put('comments/:commentId')
  async updateComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: { content: string },
    @Request() req: { user: { id: string } },
  ) {
    return firstValueFrom(
      this.communityClient.send('community.updateComment', { commentId, userId: req.user.id, dto }),
    );
  }

  @Delete('comments/:commentId')
  async deleteComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Request() req: { user: { id: string } },
  ) {
    await firstValueFrom(
      this.communityClient.send('community.deleteComment', { commentId, userId: req.user.id }),
    );
    return { message: '댓글이 삭제되었습니다.' };
  }

  // ─── 팔로우 ───

  @Post('users/:userId/follow')
  async toggleFollow(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req: { user: { id: string } },
  ) {
    return firstValueFrom(
      this.communityClient.send('community.toggleFollow', { followerId: req.user.id, followingId: userId }),
    );
  }

  @Get('users/:userId/follow')
  async isFollowing(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req: { user: { id: string } },
  ) {
    const following = await firstValueFrom(
      this.communityClient.send('community.isFollowing', { followerId: req.user.id, followingId: userId }),
    );
    return { following };
  }

  @Get('users/:userId/followers')
  async getFollowers(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.communityClient.send('community.getFollowers', {
        userId,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Get('users/:userId/following')
  async getFollowing(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.communityClient.send('community.getFollowing', {
        userId,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Get('users/:userId/stats')
  async getUserStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return firstValueFrom(
      this.communityClient.send('community.getUserStats', { userId }),
    );
  }
}
