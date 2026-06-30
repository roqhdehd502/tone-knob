import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientProxy } from "@nestjs/microservices";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import {
  ConfirmBillingKeyPaymentDto,
  ConfirmPaymentDto,
  CreatePaymentDto,
} from "@tone-knob/shared";
import { firstValueFrom } from "rxjs";

import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RpcToHttpExceptionFilter } from "../common/rpc-exception.filter";

@ApiTags("Payments")
@Controller("api/payments")
@UseFilters(RpcToHttpExceptionFilter)
export class PaymentProxyController {
  constructor(
    @Inject("MARKETPLACE_SERVICE") private readonly marketplaceClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  // ─── 클라이언트 설정 조회 (프론트엔드 SDK 초기화용) ───────────────

  @Get("config")
  @ApiOperation({
    summary: "PortOne 결제 설정 조회",
    description: "프론트엔드 PortOne SDK 초기화에 필요한 공개 설정값을 반환합니다.",
  })
  @ApiResponse({ status: 200, description: "storeId, channelKey 반환" })
  getPaymentConfig() {
    return {
      storeId: this.configService.get<string>("PORTONE_STORE_ID") ?? "",
      channelKey: this.configService.get<string>("PORTONE_CHANNEL_KEY") ?? "",
    };
  }

  // ─── 결제 생성 ────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "결제 생성 (PENDING)",
    description:
      "PG사 결제창을 띄우기 전, 대기(pending) 상태의 결제 레코드를 먼저 생성합니다. " +
      "반환된 결제 ID와 externalOrderId를 PortOne SDK requestPayment 호출에 사용하세요.",
  })
  @ApiResponse({ status: 201, description: "생성된 결제(pending) 반환" })
  async createPayment(@CurrentUser() user: RequestUser, @Body() body: CreatePaymentDto) {
    return firstValueFrom(
      this.marketplaceClient.send("payment.create", { userId: user.id, ...body }),
    );
  }

  // ─── 내 결제 내역 ─────────────────────────────────────────────────

  @Get("my")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "내 결제 내역 조회",
    description: "로그인한 사용자의 결제 내역을 최신순으로 조회합니다.",
  })
  @ApiQuery({ name: "page", required: false, description: "페이지 번호 (기본값 1)" })
  @ApiQuery({ name: "limit", required: false, description: "페이지당 항목 수 (기본값 20)" })
  @ApiResponse({ status: 200, description: "결제 내역 목록 반환" })
  async getMyPayments(
    @CurrentUser() user: RequestUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send("payment.getMyPayments", {
        userId: user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  // ─── 일반 결제 확정 ───────────────────────────────────────────────

  @Post(":id/confirm")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "결제 승인 확정 (일반 결제)",
    description:
      "PortOne SDK requestPayment 완료 후 호출. " +
      "서버가 PortOne V2 API로 금액/상태를 재검증한 뒤 completed로 확정합니다.",
  })
  @ApiParam({ name: "id", description: "결제 ID (내부 UUID)" })
  @ApiResponse({ status: 200, description: "승인 완료된 결제 반환" })
  @ApiResponse({ status: 400, description: "PG사 검증 실패 또는 금액 불일치" })
  @ApiResponse({ status: 403, description: "본인의 결제가 아님" })
  @ApiResponse({ status: 404, description: "결제 내역을 찾을 수 없음" })
  async confirmPayment(
    @Param("id") id: string,
    @CurrentUser() user: RequestUser,
    @Body() body: ConfirmPaymentDto,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send("payment.confirm", {
        paymentId: id,
        userId: user.id,
        externalPaymentId: body.externalPaymentId,
      }),
    );
  }

  // ─── 정기결제 빌링키 확정 ─────────────────────────────────────────

  @Post(":id/confirm-billing-key")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "빌링키 결제 확정 (정기결제/구독)",
    description:
      "PortOne SDK requestIssueBillingKeyAndPay 완료 후 호출. " +
      "서버가 PortOne V2 API로 재검증 후 billingKey를 저장하고 completed 처리합니다. " +
      "이후 구독 갱신 시 저장된 billingKey로 서버 주도 청구가 가능합니다.",
  })
  @ApiParam({ name: "id", description: "결제 ID (내부 UUID)" })
  @ApiResponse({ status: 200, description: "빌링키 결제 확정 완료" })
  @ApiResponse({ status: 400, description: "PG사 검증 실패 또는 금액 불일치" })
  @ApiResponse({ status: 403, description: "본인의 결제가 아님" })
  async confirmBillingKeyPayment(
    @Param("id") id: string,
    @CurrentUser() user: RequestUser,
    @Body() body: ConfirmBillingKeyPaymentDto,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send("payment.confirmBillingKey", {
        paymentId: id,
        userId: user.id,
        externalPaymentId: body.externalPaymentId,
        billingKey: body.billingKey,
      }),
    );
  }

  // ─── 환불 ─────────────────────────────────────────────────────────

  @Post(":id/refund")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "결제 환불 처리",
    description: "완료(completed) 상태의 본인 결제만 환불할 수 있습니다.",
  })
  @ApiParam({ name: "id", description: "결제 ID" })
  @ApiResponse({ status: 200, description: "환불 완료된 결제 반환" })
  @ApiResponse({ status: 400, description: "완료 상태가 아닌 결제는 환불 불가" })
  @ApiResponse({ status: 403, description: "본인의 결제가 아님" })
  async refundPayment(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.marketplaceClient.send("payment.refund", { paymentId: id, userId: user.id }),
    );
  }

  // ─── 결제 상세 조회 ───────────────────────────────────────────────

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "결제 상세 조회",
    description:
      "결제 ID로 단건 결제 정보(상태, 금액, PG사 승인 키 등)를 조회합니다. 본인의 결제만 조회할 수 있습니다.",
  })
  @ApiParam({ name: "id", description: "결제 ID" })
  @ApiResponse({ status: 200, description: "결제 상세 정보 반환" })
  @ApiResponse({ status: 403, description: "본인의 결제가 아님" })
  @ApiResponse({ status: 404, description: "결제 내역을 찾을 수 없음" })
  async getPayment(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.marketplaceClient.send("payment.getById", { paymentId: id, userId: user.id }),
    );
  }

  // ─── PortOne 웹훅 수신 (공개 엔드포인트, 인증 불필요) ─────────────

  @Post("webhook/portone")
  @HttpCode(200)
  @ApiOperation({
    summary: "PortOne 웹훅 수신",
    description:
      "PortOne V2가 결제 상태 변경 시 자동으로 호출하는 엔드포인트입니다. " +
      "PortOne 콘솔 → 결제 연동 → 웹훅 URL에 이 주소를 등록하세요: POST /api/payments/webhook/portone",
  })
  @ApiResponse({ status: 200, description: "웹훅 처리 완료" })
  async handlePortoneWebhook(
    @Body() body: { payment_id?: string; cancellation_id?: string; type?: string },
  ) {
    const portonePaymentId = body.payment_id;
    if (!portonePaymentId) return { ok: true };

    return firstValueFrom(this.marketplaceClient.send("payment.webhook", { portonePaymentId }));
  }
}
