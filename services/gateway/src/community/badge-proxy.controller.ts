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
  @ApiOperation({ summary: "전체 뱃지 목록 조회" })
  @ApiResponse({ status: 200, description: "뱃지 목록 반환" })
  async getAllBadges() {
    return firstValueFrom(this.communityClient.send("badge.getAll", {}));
  }

  @Get("my")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "내 뱃지 목록 조회" })
  @ApiResponse({ status: 200, description: "내 뱃지 목록 반환" })
  async getMyBadges(@Request() req: { user: { id: string } }) {
    return firstValueFrom(
      this.communityClient.send("badge.getUserBadges", { userId: req.user.id }),
    );
  }

  @Get("user/:userId")
  @ApiOperation({ summary: "특정 유저 뱃지 조회" })
  @ApiResponse({ status: 200, description: "유저 뱃지 목록 반환" })
  async getUserBadges(@Param("userId", ParseUUIDPipe) userId: string) {
    return firstValueFrom(
      this.communityClient.send("badge.getUserBadges", { userId }),
    );
  }

  @Get("user/:userId/featured")
  @ApiOperation({ summary: "특정 유저 대표 뱃지 조회" })
  @ApiResponse({ status: 200, description: "대표 뱃지 목록 반환" })
  async getFeaturedBadges(@Param("userId", ParseUUIDPipe) userId: string) {
    return firstValueFrom(
      this.communityClient.send("badge.getFeatured", { userId }),
    );
  }

  @Patch(":userBadgeId/featured")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "대표 뱃지 토글" })
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
