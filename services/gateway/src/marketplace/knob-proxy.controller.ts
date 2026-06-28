import {
  Controller,
  Get,
  Inject,
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

@ApiTags("Knob")
@Controller("api/knob")
@UseGuards(JwtAuthGuard)
@UseFilters(RpcToHttpExceptionFilter)
@ApiBearerAuth()
export class KnobProxyController {
  constructor(
    @Inject("MARKETPLACE_SERVICE")
    private readonly marketplaceClient: ClientProxy,
  ) {}

  @Get("balance")
  @ApiOperation({ summary: "Knob 잔액 조회", description: "Knob은 타브 제작/합주 참여/일일 로그인 등 활동 기반으로 적립되며 마켓플레이스 구매에 사용되는 내부 재화입니다." })
  @ApiResponse({ status: 200, description: "{ balance: number } 반환" })
  async getBalance(@Request() req: { user: { id: string } }) {
    return firstValueFrom(
      this.marketplaceClient.send("knob.getBalance", { userId: req.user.id }),
    );
  }

  @Get("history")
  @ApiOperation({ summary: "Knob 거래 내역 조회", description: "적립(earn_*)/차감(스펜딩) 내역을 최신순으로 조회합니다. 각 항목에는 거래 사유(description)와 거래 후 잔액(balanceAfter)이 포함됩니다." })
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
  @ApiResponse({ status: 200, description: "거래 내역 반환" })
  async getHistory(
    @Request() req: { user: { id: string } },
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send("knob.getHistory", {
        userId: req.user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }
}
