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
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateCommentDto, UpdateCommentDto } from '@tone-knob/shared';
import { firstValueFrom } from 'rxjs';

import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RpcToHttpExceptionFilter } from '../common/rpc-exception.filter';

@ApiTags('Community')
@Controller('api/community')
@UseFilters(RpcToHttpExceptionFilter)
export class CommunityProxyController {
  constructor(
    @Inject('COMMUNITY_SERVICE') private readonly communityClient: ClientProxy,
  ) {}

  // ─── 좋아요 ───

  @Post('tabs/:tabId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 좋아요 토글', description: '이미 좋아요를 눌렀으면 취소되고, 누르지 않았으면 추가됩니다(토글 방식).' })
  @ApiParam({ name: 'tabId', description: '타브 ID' })
  @ApiResponse({ status: 200, description: '토글 후 좋아요 상태 및 총 좋아요 수 반환' })
  async toggleLike(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return firstValueFrom(
      this.communityClient.send('community.toggleLike', { tabId, userId: user.id }),
    );
  }

  @Get('tabs/:tabId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 좋아요 여부 조회', description: '로그인한 사용자가 해당 타브에 좋아요를 눌렀는지 조회합니다.' })
  @ApiParam({ name: 'tabId', description: '타브 ID' })
  @ApiResponse({ status: 200, description: '{ liked: boolean } 반환' })
  async isLiked(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const liked = await firstValueFrom(
      this.communityClient.send('community.isLiked', { tabId, userId: user.id }),
    );
    return { liked };
  }

  // ─── 댓글 ───

  @Post('tabs/:tabId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '댓글 작성', description: 'parentId를 전달하면 해당 댓글의 대댓글로 등록됩니다.' })
  @ApiParam({ name: 'tabId', description: '타브 ID' })
  @ApiResponse({ status: 201, description: '생성된 댓글 반환' })
  async createComment(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return firstValueFrom(
      this.communityClient.send('community.createComment', { tabId, userId: user.id, dto }),
    );
  }

  @Get('tabs/:tabId/comments')
  @ApiOperation({ summary: '댓글 목록 조회', description: '해당 타브의 최상위 댓글 목록을 조회합니다(대댓글은 /comments/:commentId/replies로 별도 조회).' })
  @ApiParam({ name: 'tabId', description: '타브 ID' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (기본값 1)' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수 (기본값 20)' })
  @ApiResponse({ status: 200, description: '댓글 목록 반환' })
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
  @ApiOperation({ summary: '대댓글 목록 조회', description: '특정 댓글에 달린 대댓글 목록을 조회합니다.' })
  @ApiParam({ name: 'commentId', description: '부모 댓글 ID' })
  @ApiResponse({ status: 200, description: '대댓글 목록 반환' })
  async getReplies(@Param('commentId', ParseUUIDPipe) commentId: string) {
    return firstValueFrom(
      this.communityClient.send('community.getReplies', { commentId }),
    );
  }

  @Put('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '댓글 수정', description: '작성자 본인만 수정할 수 있습니다.' })
  @ApiParam({ name: 'commentId', description: '댓글 ID' })
  @ApiResponse({ status: 200, description: '수정된 댓글 반환' })
  @ApiResponse({ status: 403, description: '작성자가 아님' })
  async updateComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return firstValueFrom(
      this.communityClient.send('community.updateComment', { commentId, userId: user.id, dto }),
    );
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '댓글 삭제', description: '작성자 본인만 삭제할 수 있습니다. 대댓글이 있는 댓글을 삭제하면 대댓글도 함께 삭제됩니다.' })
  @ApiParam({ name: 'commentId', description: '댓글 ID' })
  @ApiResponse({ status: 200, description: '삭제 완료' })
  @ApiResponse({ status: 403, description: '작성자가 아님' })
  async deleteComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: RequestUser,
  ) {
    await firstValueFrom(
      this.communityClient.send('community.deleteComment', { commentId, userId: user.id }),
    );
    return { message: '댓글이 삭제되었습니다.' };
  }

  // ─── 팔로우 ───

  @Post('users/:userId/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '팔로우 토글', description: '이미 팔로우 중이면 취소되고, 아니면 팔로우됩니다(토글 방식). 본인을 팔로우할 수 없습니다.' })
  @ApiParam({ name: 'userId', description: '팔로우할 사용자 ID' })
  @ApiResponse({ status: 200, description: '토글 후 팔로우 상태 반환' })
  async toggleFollow(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return firstValueFrom(
      this.communityClient.send('community.toggleFollow', { followerId: user.id, followingId: userId }),
    );
  }

  @Get('users/:userId/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 팔로우 여부 조회', description: '로그인한 사용자가 해당 사용자를 팔로우 중인지 조회합니다.' })
  @ApiParam({ name: 'userId', description: '대상 사용자 ID' })
  @ApiResponse({ status: 200, description: '{ following: boolean } 반환' })
  async isFollowing(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const following = await firstValueFrom(
      this.communityClient.send('community.isFollowing', { followerId: user.id, followingId: userId }),
    );
    return { following };
  }

  @Get('users/:userId/followers')
  @ApiOperation({ summary: '팔로워 목록 조회', description: '해당 사용자를 팔로우하는 사용자 목록을 조회합니다.' })
  @ApiParam({ name: 'userId', description: '대상 사용자 ID' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (기본값 1)' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수 (기본값 20)' })
  @ApiResponse({ status: 200, description: '팔로워 목록 반환' })
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
  @ApiOperation({ summary: '팔로잉 목록 조회', description: '해당 사용자가 팔로우하는 사용자 목록을 조회합니다.' })
  @ApiParam({ name: 'userId', description: '대상 사용자 ID' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (기본값 1)' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수 (기본값 20)' })
  @ApiResponse({ status: 200, description: '팔로잉 목록 반환' })
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
  @ApiOperation({ summary: '사용자 활동 통계 조회', description: '팔로워 수, 팔로잉 수, 받은 뱃지 수 등 프로필에 표시되는 통계를 조회합니다.' })
  @ApiParam({ name: 'userId', description: '대상 사용자 ID' })
  @ApiResponse({ status: 200, description: '통계 정보 반환' })
  async getUserStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return firstValueFrom(
      this.communityClient.send('community.getUserStats', { userId }),
    );
  }
}
