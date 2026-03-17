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

@Controller('api/reviews')
export class ReviewProxyController {
  constructor(
    @Inject('COMMUNITY_SERVICE') private readonly communityClient: ClientProxy,
  ) {}

  @Post('tabs/:tabId')
  async createReview(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Body() dto: { rating: number; content?: string },
    @Request() req: { user: { id: string } },
  ) {
    return firstValueFrom(
      this.communityClient.send('review.create', { tabId, userId: req.user.id, dto }),
    );
  }

  @Get('tabs/:tabId')
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
  async updateReview(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() dto: { rating?: number; content?: string },
    @Request() req: { user: { id: string } },
  ) {
    return firstValueFrom(
      this.communityClient.send('review.update', { reviewId, userId: req.user.id, dto }),
    );
  }

  @Delete(':reviewId')
  async removeReview(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Request() req: { user: { id: string } },
  ) {
    await firstValueFrom(
      this.communityClient.send('review.remove', { reviewId, userId: req.user.id }),
    );
    return { message: '리뷰가 삭제되었습니다.' };
  }

  @Get('tabs/:tabId/my')
  async getMyReview(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Request() req: { user: { id: string } },
  ) {
    return firstValueFrom(
      this.communityClient.send('review.getMyReview', { tabId, userId: req.user.id }),
    );
  }
}
