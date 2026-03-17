import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
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

import { CommunityService } from './community.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('community')
@Controller('api/community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // ─── 좋아요 ───

  @Post('tabs/:tabId/like')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 좋아요 토글' })
  async toggleLike(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.communityService.toggleLike(tabId, req.user.id);
  }

  @Get('tabs/:tabId/like')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 좋아요 여부 확인' })
  async isLiked(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Request() req: { user: { id: string } },
  ) {
    const liked = await this.communityService.isLiked(tabId, req.user.id);
    return { liked };
  }

  // ─── 댓글 ───

  @Post('tabs/:tabId/comments')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '댓글 작성' })
  async createComment(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Body() dto: CreateCommentDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.communityService.createComment(tabId, req.user.id, dto);
  }

  @Get('tabs/:tabId/comments')
  @ApiOperation({ summary: '댓글 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getComments(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communityService.getComments(
      tabId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('comments/:commentId/replies')
  @ApiOperation({ summary: '대댓글 조회' })
  async getReplies(@Param('commentId', ParseUUIDPipe) commentId: string) {
    return this.communityService.getReplies(commentId);
  }

  @Put('comments/:commentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '댓글 수정' })
  async updateComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.communityService.updateComment(commentId, req.user.id, dto);
  }

  @Delete('comments/:commentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '댓글 삭제' })
  async deleteComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.communityService.deleteComment(commentId, req.user.id);
    return { message: '댓글이 삭제되었습니다.' };
  }

  // ─── 팔로우 ───

  @Post('users/:userId/follow')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 팔로우 토글' })
  async toggleFollow(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.communityService.toggleFollow(req.user.id, userId);
  }

  @Get('users/:userId/follow')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '팔로우 여부 확인' })
  async isFollowing(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req: { user: { id: string } },
  ) {
    const following = await this.communityService.isFollowing(
      req.user.id,
      userId,
    );
    return { following };
  }

  @Get('users/:userId/followers')
  @ApiOperation({ summary: '팔로워 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFollowers(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communityService.getFollowers(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('users/:userId/following')
  @ApiOperation({ summary: '팔로잉 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFollowing(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communityService.getFollowing(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('users/:userId/stats')
  @ApiOperation({ summary: '사용자 팔로워/팔로잉 수 조회' })
  async getUserStats(@Param('userId', ParseUUIDPipe) userId: string) {
    const [followerCount, followingCount] = await Promise.all([
      this.communityService.getFollowerCount(userId),
      this.communityService.getFollowingCount(userId),
    ]);
    return { followerCount, followingCount };
  }
}
