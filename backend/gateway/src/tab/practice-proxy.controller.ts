import { Body, Controller, Get, Inject, Post, Query, UseFilters, UseGuards } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RecordPracticeSessionDto } from "@tone-knob/shared";
import { catchError, firstValueFrom, throwError } from "rxjs";

import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RpcToHttpExceptionFilter } from "../common/rpc-exception.filter";

@ApiTags("Practice")
@Controller("api/practice")
@UseFilters(RpcToHttpExceptionFilter)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PracticeProxyController {
  constructor(@Inject("TAB_SERVICE") private readonly tabClient: ClientProxy) {}

  @Post("sessions")
  @ApiOperation({
    summary: "연습 세션 기록",
    description:
      "타브 연습 에디터/플레이어에서 한 번의 연습 세션이 끝날 때마다 호출해 기록을 저장합니다. 연습 통계 및 뱃지 적립에 사용됩니다.",
  })
  @ApiResponse({ status: 201, description: "기록된 연습 세션 반환" })
  async recordSession(@CurrentUser() user: RequestUser, @Body() dto: RecordPracticeSessionDto) {
    return firstValueFrom(
      this.tabClient
        .send("practice.record", { userId: user.id, dto })
        .pipe(catchError((err) => throwError(() => err))),
    );
  }

  @Get("stats")
  @ApiOperation({
    summary: "연습 통계 조회",
    description: "로그인한 사용자의 총 연습 시간, 연습 횟수 등 누적 통계를 조회합니다.",
  })
  @ApiResponse({ status: 200, description: "연습 통계 반환" })
  async getStats(@CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.tabClient
        .send("practice.stats", { userId: user.id })
        .pipe(catchError((err) => throwError(() => err))),
    );
  }

  @Get("sessions")
  @ApiOperation({
    summary: "최근 연습 세션 목록",
    description: "로그인한 사용자의 연습 세션 기록을 최신순으로 조회합니다.",
  })
  @ApiQuery({ name: "page", required: false, type: Number, description: "페이지 번호 (기본값 1)" })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "페이지당 항목 수 (기본값 20)",
  })
  @ApiResponse({ status: 200, description: "연습 세션 목록 반환 (페이지네이션)" })
  async getRecentSessions(
    @CurrentUser() user: RequestUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return firstValueFrom(
      this.tabClient
        .send("practice.recent", {
          userId: user.id,
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20,
        })
        .pipe(catchError((err) => throwError(() => err))),
    );
  }
}
