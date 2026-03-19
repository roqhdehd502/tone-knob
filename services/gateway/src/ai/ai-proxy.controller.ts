import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
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

@ApiTags("AI Generation")
@Controller("api/ai-gen")
@UseGuards(JwtAuthGuard)
@UseFilters(RpcToHttpExceptionFilter)
@ApiBearerAuth()
export class AiProxyController {
  constructor(@Inject("AI_SERVICE") private readonly aiClient: ClientProxy) {}

  @Post("tab")
  @ApiOperation({ summary: "AI 타브 생성 작업 요청" })
  @ApiResponse({ status: 201, description: "작업이 생성되었습니다" })
  @ApiResponse({ status: 401, description: "인증되지 않은 사용자" })
  async createTabJob(
    @Request() req: { user: { id: string } },
    @Body()
    body: {
      prompt: string;
      genre?: string;
      instrument?: string;
      difficulty?: string;
      measures?: number;
    },
  ) {
    return firstValueFrom(
      this.aiClient.send("ai.createTabJob", { userId: req.user.id, ...body }),
    );
  }

  @Post("audio-extraction")
  @ApiOperation({ summary: "오디오 추출 작업 요청" })
  @ApiResponse({ status: 201, description: "작업이 생성되었습니다" })
  @ApiResponse({ status: 401, description: "인증되지 않은 사용자" })
  async createExtractionJob(
    @Request() req: { user: { id: string } },
    @Body()
    body: {
      audioUrl: string;
      instrument?: string;
      tuning?: string;
    },
  ) {
    return firstValueFrom(
      this.aiClient.send("ai.createExtractionJob", {
        userId: req.user.id,
        ...body,
      }),
    );
  }

  @Get("jobs")
  @ApiOperation({ summary: "내 AI 작업 목록 조회" })
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
  @ApiResponse({ status: 200, description: "작업 목록 반환" })
  async getMyJobs(
    @Request() req: { user: { id: string } },
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return firstValueFrom(
      this.aiClient.send("ai.getMyJobs", {
        userId: req.user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Get("jobs/:id")
  @ApiOperation({ summary: "AI 작업 상세 조회" })
  @ApiResponse({ status: 200, description: "작업 상세 반환" })
  @ApiResponse({ status: 404, description: "작업을 찾을 수 없음" })
  async getJob(@Param("id") id: string) {
    return firstValueFrom(this.aiClient.send("ai.getJob", { jobId: id }));
  }

  @Post("webhook/:id")
  @ApiOperation({ summary: "AI 작업 웹훅 콜백 (ML 서버용)" })
  @ApiResponse({ status: 200, description: "웹훅 처리 완료" })
  async handleWebhook(
    @Param("id") id: string,
    @Body()
    body: {
      status: string;
      outputData?: Record<string, unknown>;
      errorMessage?: string;
      progress?: number;
    },
  ) {
    return firstValueFrom(
      this.aiClient.send("ai.webhook", { jobId: id, ...body }),
    );
  }
}
