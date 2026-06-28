import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Request,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { firstValueFrom } from "rxjs";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RpcToHttpExceptionFilter } from "../common/rpc-exception.filter";

@ApiTags("Badge")
@Controller("api/badges")
@UseFilters(RpcToHttpExceptionFilter)
export class BadgeProxyController {
  constructor(
    @Inject("COMMUNITY_SERVICE") private readonly communityClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: "전체 뱃지 목록 조회", description: "시스템에 정의된 모든 뱃지 종류(코드, 이름, 설명, 아이콘, 카테고리)를 조회합니다. 인증이 필요하지 않습니다." })
  @ApiResponse({ status: 200, description: "뱃지 목록 반환" })
  async getAllBadges() {
    return firstValueFrom(this.communityClient.send("badge.getAll", {}));
  }

  @Get("my")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "내 뱃지 목록 조회", description: "로그인한 사용자가 획득한 뱃지 목록을 획득일 최신순으로 조회합니다." })
  @ApiResponse({ status: 200, description: "내 뱃지 목록 반환" })
  async getMyBadges(@Request() req: { user: { id: string } }) {
    return firstValueFrom(
      this.communityClient.send("badge.getUserBadges", { userId: req.user.id }),
    );
  }

  @Get("user/:userId")
  @ApiOperation({ summary: "특정 유저 뱃지 조회", description: "다른 사용자가 획득한 뱃지 목록을 조회합니다(프로필 페이지 등에서 사용)." })
  @ApiParam({ name: "userId", description: "사용자 ID" })
  @ApiResponse({ status: 200, description: "유저 뱃지 목록 반환" })
  async getUserBadges(@Param("userId", ParseUUIDPipe) userId: string) {
    return firstValueFrom(
      this.communityClient.send("badge.getUserBadges", { userId }),
    );
  }

  @Get("user/:userId/featured")
  @ApiOperation({ summary: "특정 유저 대표 뱃지 조회", description: "프로필에 노출되는 대표 뱃지(최대 3개)만 조회합니다." })
  @ApiParam({ name: "userId", description: "사용자 ID" })
  @ApiResponse({ status: 200, description: "대표 뱃지 목록 반환" })
  async getFeaturedBadges(@Param("userId", ParseUUIDPipe) userId: string) {
    return firstValueFrom(
      this.communityClient.send("badge.getFeatured", { userId }),
    );
  }

  @Patch(":userBadgeId/featured")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "대표 뱃지 토글", description: "보유한 뱃지를 프로필 대표 뱃지로 지정/해제합니다(토글 방식). 대표 뱃지는 최대 3개까지 지정할 수 있습니다." })
  @ApiParam({ name: "userBadgeId", description: "보유 뱃지(UserBadge) ID — 뱃지 코드가 아닌 획득 기록의 ID입니다" })
  @ApiResponse({ status: 200, description: "대표 뱃지 토글 완료" })
  @ApiResponse({ status: 400, description: "대표 뱃지 최대 3개 초과" })
  @ApiResponse({ status: 404, description: "뱃지를 찾을 수 없음" })
  async toggleFeatured(
    @Param("userBadgeId", ParseUUIDPipe) userBadgeId: string,
    @Request() req: { user: { id: string } },
  ) {
    return firstValueFrom(
      this.communityClient.send("badge.toggleFeatured", {
        userBadgeId,
        userId: req.user.id,
      }),
    );
  }
}
