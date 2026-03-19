import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Request,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { firstValueFrom } from "rxjs";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RpcToHttpExceptionFilter } from "../common/rpc-exception.filter";

@ApiTags("Subscription")
@Controller("api/subscriptions")
@UseFilters(RpcToHttpExceptionFilter)
export class SubscriptionProxyController {
  constructor(
    @Inject("SUBSCRIPTION_SERVICE")
    private readonly subscriptionClient: ClientProxy,
  ) {}

  @Get("plans")
  @ApiOperation({ summary: "구독 플랜 목록 조회" })
  @ApiResponse({ status: 200, description: "플랜 목록 반환" })
  async getPlans() {
    return firstValueFrom(
      this.subscriptionClient.send("subscription.getPlans", {}),
    );
  }

  @Get("current")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "현재 구독 정보 조회" })
  @ApiResponse({ status: 200, description: "현재 구독 반환" })
  async getCurrent(@Request() req: { user: { id: string } }) {
    return firstValueFrom(
      this.subscriptionClient.send("subscription.getCurrent", {
        userId: req.user.id,
      }),
    );
  }

  @Post("subscribe")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "구독 신청" })
  @ApiResponse({ status: 201, description: "구독 생성됨" })
  @ApiResponse({ status: 409, description: "이미 동일 플랜 구독 중" })
  async subscribe(
    @Request() req: { user: { id: string } },
    @Body() body: { plan: string; externalPaymentId?: string },
  ) {
    return firstValueFrom(
      this.subscriptionClient.send("subscription.subscribe", {
        userId: req.user.id,
        plan: body.plan,
        externalPaymentId: body.externalPaymentId,
      }),
    );
  }

  @Post("cancel")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "구독 취소" })
  @ApiResponse({ status: 200, description: "구독 취소됨" })
  @ApiResponse({ status: 404, description: "활성 구독 없음" })
  async cancel(@Request() req: { user: { id: string } }) {
    return firstValueFrom(
      this.subscriptionClient.send("subscription.cancel", {
        userId: req.user.id,
      }),
    );
  }

  @Get("history")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "구독 히스토리 조회" })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "페이지 번호",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "페이지 크기",
  })
  @ApiResponse({ status: 200, description: "구독 이력 반환" })
  async getHistory(
    @Request() req: { user: { id: string } },
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return firstValueFrom(
      this.subscriptionClient.send("subscription.getHistory", {
        userId: req.user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Get("tab-limit")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "타브 생성 제한 확인 (무료 플랜 월 3회)" })
  @ApiResponse({ status: 200, description: "제한 정보 반환" })
  async canCreateTab(@Request() req: { user: { id: string } }) {
    return firstValueFrom(
      this.subscriptionClient.send("subscription.canCreateTab", {
        userId: req.user.id,
      }),
    );
  }
}
