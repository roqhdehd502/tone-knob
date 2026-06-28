import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";

import { SetTabPriceDto } from "@tone-knob/shared";
import { firstValueFrom } from "rxjs";

import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RpcToHttpExceptionFilter } from "../common/rpc-exception.filter";

@ApiTags("Marketplace")
@Controller("api/marketplace")
@UseFilters(RpcToHttpExceptionFilter)
export class MarketplaceProxyController {
  constructor(
    @Inject("MARKETPLACE_SERVICE")
    private readonly marketplaceClient: ClientProxy,
  ) {}

  @Get("tabs")
  @ApiOperation({ summary: "유료 타브 목록 조회", description: "가격이 설정된(price > 0) 타브를 인기순/최신순/등록순으로 정렬해 조회합니다." })
  @ApiQuery({ name: "page", required: false, description: "페이지 번호 (기본값 1)" })
  @ApiQuery({ name: "limit", required: false, description: "페이지당 항목 수 (기본값 20)" })
  @ApiQuery({ name: "sort", required: false, enum: ["popular", "oldest", "newest"], description: "정렬 기준 (기본값 newest)" })
  @ApiResponse({ status: 200, description: "유료 타브 목록 반환" })
  async listPaidTabs(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("sort") sort?: "popular" | "oldest" | "newest",
  ) {
    return firstValueFrom(
      this.marketplaceClient.send("marketplace.listPaidTabs", {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        sort: sort ?? "newest",
      }),
    );
  }

  @Post("tabs/:tabId/price")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "타브 판매가 설정", description: "타브 작성자만 가격을 설정할 수 있습니다. 0으로 설정하면 무료로 전환되어 마켓플레이스 유료 목록에서 빠집니다." })
  @ApiParam({ name: "tabId", description: "타브 ID" })
  @ApiResponse({ status: 200, description: "가격이 설정된 타브 반환" })
  @ApiResponse({ status: 403, description: "작성자가 아님" })
  async setPrice(
    @Param("tabId", ParseUUIDPipe) tabId: string,
    @CurrentUser() user: RequestUser,
    @Body() body: SetTabPriceDto,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send("marketplace.setPrice", {
        tabId,
        userId: user.id,
        price: body.price,
      }),
    );
  }

  @Post("tabs/:tabId/purchase")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "타브 구매",
    description: "보유 Knob으로 유료 타브를 구매합니다. Knob 잔액이 부족하면 실패합니다. 구매 완료 시 판매자에게 Knob이 정산되고 구매 알림이 발송됩니다.",
  })
  @ApiParam({ name: "tabId", description: "구매할 타브 ID" })
  @ApiResponse({ status: 201, description: "구매 완료 — 구매 내역 반환" })
  @ApiResponse({ status: 400, description: "Knob 잔액 부족 또는 이미 구매함" })
  async purchase(
    @Param("tabId", ParseUUIDPipe) tabId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send("marketplace.purchase", {
        tabId,
        buyerId: user.id,
      }),
    );
  }

  @Get("tabs/:tabId/purchased")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "내 구매 여부 조회", description: "로그인한 사용자가 해당 타브를 이미 구매했는지 조회합니다(유료 타브 본문 접근 제어에 사용)." })
  @ApiParam({ name: "tabId", description: "타브 ID" })
  @ApiResponse({ status: 200, description: "{ purchased: boolean } 반환" })
  async hasPurchased(
    @Param("tabId", ParseUUIDPipe) tabId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const purchased = await firstValueFrom(
      this.marketplaceClient.send("marketplace.hasPurchased", {
        tabId,
        userId: user.id,
      }),
    );
    return { purchased };
  }

  @Get("my/purchases")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "내 구매 내역 조회", description: "로그인한 사용자가 구매한 유료 타브 목록을 최신순으로 조회합니다." })
  @ApiQuery({ name: "page", required: false, description: "페이지 번호 (기본값 1)" })
  @ApiQuery({ name: "limit", required: false, description: "페이지당 항목 수 (기본값 20)" })
  @ApiResponse({ status: 200, description: "구매 내역 목록 반환" })
  async getMyPurchases(
    @CurrentUser() user: RequestUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send("marketplace.getMyPurchases", {
        userId: user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Get("my/sales")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "내 판매 내역 조회", description: "로그인한 사용자가 판매자로서 거둔 타브 판매 내역과 누적 수익을 조회합니다(정산 신청은 /api/settlements 참고)." })
  @ApiQuery({ name: "page", required: false, description: "페이지 번호 (기본값 1)" })
  @ApiQuery({ name: "limit", required: false, description: "페이지당 항목 수 (기본값 20)" })
  @ApiResponse({ status: 200, description: "판매 내역 및 누적 매출 반환" })
  async getMySales(
    @CurrentUser() user: RequestUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send("marketplace.getMySales", {
        userId: user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }
}
