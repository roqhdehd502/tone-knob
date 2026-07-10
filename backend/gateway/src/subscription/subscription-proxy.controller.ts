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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SubscribeDto } from "@tone-knob/shared";
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
  @ApiOperation({
    summary: "구독 플랜 목록 조회",
    description:
      "free/premium/pro 플랜별 월 가격과 제공 기능을 조회합니다. 인증이 필요하지 않습니다.",
  })
  @ApiResponse({ status: 200, description: "플랜 목록 반환" })
  async getPlans() {
    return firstValueFrom(this.subscriptionClient.send("subscription.getPlans", {}));
  }

  @Get("current")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "현재 구독 정보 조회",
    description:
      "로그인한 사용자의 현재 활성 구독(플랜, 시작/만료일)을 조회합니다. 구독 중이 아니면 null을 반환합니다.",
  })
  @ApiResponse({ status: 200, description: "현재 구독 반환 (없으면 null)" })
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
  @ApiOperation({
    summary: "구독 신청",
    description:
      "premium/pro 플랜을 신규 구독하거나 변경합니다. PG사 결제가 선행되어야 하며 externalPaymentId로 결제 승인 키를 전달합니다.",
  })
  @ApiResponse({ status: 201, description: "구독 생성됨" })
  @ApiResponse({ status: 409, description: "이미 동일 플랜 구독 중" })
  async subscribe(@Request() req: { user: { id: string } }, @Body() body: SubscribeDto) {
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
  @ApiOperation({
    summary: "구독 취소",
    description:
      "현재 활성 구독을 즉시 취소합니다. 환불은 별도로 처리되지 않으며(/api/payments/:id/refund 사용), 다음 결제 주기부터 free 플랜으로 전환됩니다.",
  })
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
  @ApiOperation({
    summary: "구독 히스토리 조회",
    description: "과거 구독(취소/만료 포함)을 포함한 전체 구독 이력을 최신순으로 조회합니다.",
  })
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
  @ApiOperation({
    summary: "타브 생성 제한 확인 (무료 플랜 월 3회)",
    description:
      "free 플랜은 월 3회까지 타브를 생성할 수 있습니다. premium/pro는 무제한입니다. 타브 생성 폼 진입 시 사전 확인용으로 사용합니다.",
  })
  @ApiResponse({ status: 200, description: "제한 정보 반환" })
  async canCreateTab(@Request() req: { user: { id: string } }) {
    return firstValueFrom(
      this.subscriptionClient.send("subscription.canCreateTab", {
        userId: req.user.id,
      }),
    );
  }
}
