import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Query,
  Request,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientProxy } from "@nestjs/microservices";
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AiWebhookDto, CreateAiTabJobDto, CreateAudioExtractionJobDto } from "@tone-knob/shared";
import { firstValueFrom } from "rxjs";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RpcToHttpExceptionFilter } from "../common/rpc-exception.filter";

@ApiTags("AI Generation")
@Controller("api/ai-gen")
@UseFilters(RpcToHttpExceptionFilter)
export class AiProxyController {
  constructor(
    @Inject("AI_SERVICE") private readonly aiClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  @Post("tab")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "AI 타브 생성 작업 요청",
    description:
      "텍스트 설명(prompt)으로 새 타브 악보를 비동기 생성합니다. 작업은 큐에 들어가고(status: queued) 즉시 반환되며, " +
      "/api/ai-gen/jobs/:id로 진행 상태를 폴링해야 합니다. ML_SERVER_URL이 설정/연결되지 않으면 더미 결과로 자동 완료됩니다(로컬 개발 기본 동작).",
  })
  @ApiResponse({ status: 201, description: "작업이 생성되었습니다 (status: queued)" })
  @ApiResponse({ status: 401, description: "인증되지 않은 사용자" })
  async createTabJob(@Request() req: { user: { id: string } }, @Body() body: CreateAiTabJobDto) {
    return firstValueFrom(this.aiClient.send("ai.createTabJob", { userId: req.user.id, ...body }));
  }

  @Post("audio-extraction")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "오디오 추출 작업 요청",
    description:
      "업로드된 오디오 파일(audioUrl)에서 타브를 자동 추출하는 비동기 작업을 생성합니다. " +
      "오디오는 /api/media/upload로 먼저 업로드한 뒤 반환된 url을 전달해야 합니다.",
  })
  @ApiResponse({ status: 201, description: "작업이 생성되었습니다 (status: queued)" })
  @ApiResponse({ status: 401, description: "인증되지 않은 사용자" })
  async createExtractionJob(
    @Request() req: { user: { id: string } },
    @Body() body: CreateAudioExtractionJobDto,
  ) {
    return firstValueFrom(
      this.aiClient.send("ai.createExtractionJob", {
        userId: req.user.id,
        ...body,
      }),
    );
  }

  @Get("jobs")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "내 AI 작업 목록 조회",
    description: "로그인한 사용자가 요청한 타브 생성/오디오 추출 작업을 최신순으로 조회합니다.",
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "AI 작업 상세 조회",
    description:
      "작업 상태(queued/processing/completed/failed)와 완료 시 결과(outputData)를 조회합니다. 진행 상태 폴링에 사용합니다.",
  })
  @ApiParam({ name: "id", description: "AI 작업 ID" })
  @ApiResponse({ status: 200, description: "작업 상세 반환" })
  @ApiResponse({ status: 404, description: "작업을 찾을 수 없음" })
  async getJob(@Param("id") id: string) {
    return firstValueFrom(this.aiClient.send("ai.getJob", { jobId: id }));
  }

  // ML 서버가 호출하는 콜백 — 사용자 JWT가 없으므로 공유 비밀키로 인증한다.
  // ML_WEBHOOK_SECRET이 설정되지 않은 경우(로컬 개발 등) 검증을 생략한다.
  @Post("webhook/:id")
  @ApiOperation({
    summary: "AI 작업 웹훅 콜백 (ML 서버용)",
    description:
      "실제 ML 서버가 작업 완료/실패 시 호출하는 콜백입니다. 프론트엔드/일반 클라이언트가 직접 호출하는 엔드포인트가 아닙니다. " +
      "사용자 JWT 대신 x-ml-webhook-secret 헤더의 공유 시크릿으로 인증하며, ML_WEBHOOK_SECRET 미설정 시 검증을 생략합니다.",
  })
  @ApiParam({ name: "id", description: "AI 작업 ID" })
  @ApiHeader({
    name: "x-ml-webhook-secret",
    required: false,
    description: "ML_WEBHOOK_SECRET과 동일한 값 (미설정 환경에서는 생략 가능)",
  })
  @ApiResponse({ status: 200, description: "웹훅 처리 완료" })
  @ApiResponse({ status: 403, description: "잘못된 웹훅 시크릿" })
  async handleWebhook(
    @Param("id") id: string,
    @Headers("x-ml-webhook-secret") secret: string | undefined,
    @Body() body: AiWebhookDto,
  ) {
    const expectedSecret = this.configService.get<string>("ML_WEBHOOK_SECRET");
    if (expectedSecret && secret !== expectedSecret) {
      throw new ForbiddenException("유효하지 않은 웹훅 시크릿입니다");
    }

    return firstValueFrom(this.aiClient.send("ai.webhook", { jobId: id, ...body }));
  }
}
