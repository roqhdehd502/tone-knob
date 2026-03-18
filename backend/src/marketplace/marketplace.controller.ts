import {
  Body,
  Controller,
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { SetPriceDto } from './dto/set-price.dto';
import { MarketplaceService } from './marketplace.service';

@ApiTags('marketplace')
@Controller('api/marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('tabs')
  @ApiOperation({ summary: '유료 타브 목록 조회' })
  @ApiResponse({ status: 200, description: '유료 타브 목록 반환' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수',
  })
  listPaidTabs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.marketplaceService.listPaidTabs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('tabs/:tabId/price')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 가격 설정' })
  @ApiResponse({ status: 201, description: '가격 설정 성공' })
  @ApiResponse({ status: 403, description: '타브 소유자만 가격 설정 가능' })
  setPrice(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Request() req: { user: { id: string } },
    @Body() dto: SetPriceDto,
  ) {
    return this.marketplaceService.setPrice(tabId, req.user.id, dto.price);
  }

  @Post('tabs/:tabId/purchase')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 구매' })
  @ApiResponse({ status: 201, description: '구매 성공' })
  @ApiResponse({ status: 400, description: '이미 구매한 타브 / 잔액 부족' })
  purchase(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.marketplaceService.purchase(tabId, req.user.id);
  }

  @Get('tabs/:tabId/purchased')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 구매 여부 확인' })
  @ApiResponse({ status: 200, description: '구매 여부 반환' })
  async hasPurchased(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Request() req: { user: { id: string } },
  ) {
    const purchased = await this.marketplaceService.hasPurchased(
      tabId,
      req.user.id,
    );
    return { purchased };
  }

  @Get('my/purchases')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 구매 내역' })
  @ApiResponse({ status: 200, description: '구매 내역 반환' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수',
  })
  getMyPurchases(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.getMyPurchases(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('my/sales')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 판매 내역 및 수익' })
  @ApiResponse({ status: 200, description: '판매 내역 반환' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수',
  })
  getMySales(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.getMySales(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
