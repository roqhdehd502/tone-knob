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

import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';

@ApiTags('reviews')
@Controller('api/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('tabs/:tabId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '리뷰 작성' })
  create(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Request() req: { user: { id: string } },
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.create(tabId, req.user.id, dto);
  }

  @Get('tabs/:tabId')
  @ApiOperation({ summary: '타브 리뷰 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getByTab(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewService.getByTab(
      tabId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('tabs/:tabId/my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 리뷰 조회' })
  getMyReview(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.reviewService.getMyReview(tabId, req.user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '리뷰 수정' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '리뷰 삭제' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.reviewService.remove(id, req.user.id);
    return { message: '리뷰가 삭제되었습니다.' };
  }
}
