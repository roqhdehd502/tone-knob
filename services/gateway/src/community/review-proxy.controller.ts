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

import { CreateReviewDto, UpdateReviewDto } from '@tone-knob/shared';
import { firstValueFrom } from 'rxjs';

import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RpcToHttpExceptionFilter } from '../common/rpc-exception.filter';

@ApiTags('Reviews')
@Controller('api/reviews')
@UseFilters(RpcToHttpExceptionFilter)
export class ReviewProxyController {
  constructor(
    @Inject('COMMUNITY_SERVICE') private readonly communityClient: ClientProxy,
  ) {}

  @Post('tabs/:tabId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 리뷰 작성', description: '사용자당 타브 하나에 리뷰 1개만 작성할 수 있습니다(이미 작성한 경우 409).' })
  @ApiParam({ name: 'tabId', description: '타브 ID' })
  @ApiResponse({ status: 201, description: '생성된 리뷰 반환' })
  @ApiResponse({ status: 409, description: '이미 해당 타브에 리뷰를 작성함' })
  async createReview(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: RequestUser,
  ) {
    return firstValueFrom(
      this.communityClient.send('review.create', { tabId, userId: user.id, dto }),
    );
  }

  @Get('tabs/:tabId')
  @ApiOperation({ summary: '타브 리뷰 목록 조회', description: '인증 없이 누구나 조회 가능합니다.' })
  @ApiParam({ name: 'tabId', description: '타브 ID' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (기본값 1)' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수 (기본값 20)' })
  @ApiResponse({ status: 200, description: '리뷰 목록 반환' })
  async getReviewsByTab(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.communityClient.send('review.getByTab', {
        tabId,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Put(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '리뷰 수정', description: '작성자 본인만 수정할 수 있습니다.' })
  @ApiParam({ name: 'reviewId', description: '리뷰 ID' })
  @ApiResponse({ status: 200, description: '수정된 리뷰 반환' })
  @ApiResponse({ status: 403, description: '작성자가 아님' })
  async updateReview(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() user: RequestUser,
  ) {
    return firstValueFrom(
      this.communityClient.send('review.update', { reviewId, userId: user.id, dto }),
    );
  }

  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '리뷰 삭제', description: '작성자 본인만 삭제할 수 있습니다.' })
  @ApiParam({ name: 'reviewId', description: '리뷰 ID' })
  @ApiResponse({ status: 200, description: '삭제 완료' })
  @ApiResponse({ status: 403, description: '작성자가 아님' })
  async removeReview(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @CurrentUser() user: RequestUser,
  ) {
    await firstValueFrom(
      this.communityClient.send('review.remove', { reviewId, userId: user.id }),
    );
    return { message: '리뷰가 삭제되었습니다.' };
  }

  @Get('tabs/:tabId/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 리뷰 조회', description: '로그인한 사용자가 해당 타브에 작성한 본인 리뷰를 조회합니다(없으면 null).' })
  @ApiParam({ name: 'tabId', description: '타브 ID' })
  @ApiResponse({ status: 200, description: '내 리뷰 반환 (없으면 null)' })
  async getMyReview(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return firstValueFrom(
      this.communityClient.send('review.getMyReview', { tabId, userId: user.id }),
    );
  }
}
