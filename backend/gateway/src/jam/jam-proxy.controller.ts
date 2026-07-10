import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CreateJamRoomDto, JoinJamRoomDto } from "@tone-knob/shared";
import { catchError, firstValueFrom, throwError } from "rxjs";

import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RpcToHttpExceptionFilter } from "../common/rpc-exception.filter";

@ApiTags("Jam Rooms")
@Controller("api/jam-rooms")
@UseFilters(RpcToHttpExceptionFilter)
export class JamProxyController {
  constructor(@Inject("JAM_SERVICE") private readonly jamClient: ClientProxy) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "합주방 생성",
    description:
      "로그인한 사용자를 호스트로 하는 합주방을 생성합니다. 실시간 합주는 별도 WebSocket(/jam, jam-svc HTTP 포트)으로 연결합니다.",
  })
  @ApiResponse({ status: 201, description: "생성된 합주방 반환" })
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateJamRoomDto) {
    return firstValueFrom(
      this.jamClient
        .send("jam.create", { hostId: user.id, dto })
        .pipe(catchError((err) => throwError(() => err))),
    );
  }

  @Get()
  @ApiOperation({
    summary: "합주방 목록 조회",
    description:
      "인증 없이 누구나 조회 가능합니다. 비공개방(isPrivate=true)도 목록에는 노출되지만 입장 시 비밀번호가 필요합니다.",
  })
  @ApiQuery({ name: "page", required: false, description: "페이지 번호 (기본값 1)" })
  @ApiQuery({ name: "limit", required: false, description: "페이지당 항목 수 (기본값 20)" })
  @ApiQuery({ name: "isActive", required: false, description: "진행 중인 방만 조회 (true/false)" })
  @ApiResponse({ status: 200, description: "합주방 목록 반환" })
  async findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("isActive") isActive?: string,
  ) {
    return firstValueFrom(
      this.jamClient
        .send("jam.findAll", {
          page: page ? parseInt(page, 10) : undefined,
          limit: limit ? parseInt(limit, 10) : undefined,
          isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
        })
        .pipe(catchError((err) => throwError(() => err))),
    );
  }

  @Get(":id")
  @ApiOperation({
    summary: "합주방 상세 조회",
    description: "방 정보(이름, BPM, 최대 인원, 현재 인원, 비공개 여부 등)를 조회합니다.",
  })
  @ApiParam({ name: "id", description: "합주방 ID" })
  @ApiResponse({ status: 200, description: "합주방 상세 정보 반환" })
  @ApiResponse({ status: 404, description: "합주방을 찾을 수 없음" })
  async findOne(@Param("id") id: string) {
    return firstValueFrom(
      this.jamClient.send("jam.findOne", { id }).pipe(catchError((err) => throwError(() => err))),
    );
  }

  @Post(":id/join")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "합주방 참가",
    description:
      "방 정원이 가득 찼거나 비공개방 비밀번호가 틀리면 실패합니다. 참가 성공 시 Knob이 자동 적립됩니다. 참가 후 실시간 통신은 WebSocket으로 별도 연결해야 합니다.",
  })
  @ApiParam({ name: "id", description: "합주방 ID" })
  @ApiResponse({ status: 200, description: "참가 성공 — 합주방 정보 반환" })
  @ApiResponse({ status: 400, description: "비밀번호가 틀림" })
  @ApiResponse({ status: 403, description: "방 정원이 가득 찼거나 비활성 상태" })
  async join(
    @Param("id") id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: JoinJamRoomDto,
  ) {
    return firstValueFrom(
      this.jamClient
        .send("jam.join", { roomId: id, userId: user.id, password: dto.password })
        .pipe(catchError((err) => throwError(() => err))),
    );
  }

  @Post(":id/leave")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "합주방 나가기",
    description:
      "호스트가 나가도 방은 유지되며, 마지막 참가자가 나가면 방이 자동으로 비활성화됩니다.",
  })
  @ApiParam({ name: "id", description: "합주방 ID" })
  @ApiResponse({ status: 200, description: "나가기 완료" })
  async leave(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.jamClient
        .send("jam.leave", { roomId: id, userId: user.id })
        .pipe(catchError((err) => throwError(() => err))),
    );
  }

  @Get(":id/participants")
  @ApiOperation({
    summary: "합주방 참가자 목록",
    description: "현재 방에 참가 중인 사용자 목록을 조회합니다.",
  })
  @ApiParam({ name: "id", description: "합주방 ID" })
  @ApiResponse({ status: 200, description: "참가자 목록 반환" })
  async getParticipants(@Param("id") id: string) {
    return firstValueFrom(
      this.jamClient
        .send("jam.participants", { roomId: id })
        .pipe(catchError((err) => throwError(() => err))),
    );
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "합주방 닫기",
    description: "호스트만 가능합니다. 모든 참가자가 강제로 퇴장되고 방이 비활성화됩니다.",
  })
  @ApiParam({ name: "id", description: "합주방 ID" })
  @ApiResponse({ status: 200, description: "닫기 완료" })
  @ApiResponse({ status: 403, description: "호스트가 아님" })
  async close(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.jamClient
        .send("jam.close", { roomId: id, userId: user.id })
        .pipe(catchError((err) => throwError(() => err))),
    );
  }
}
