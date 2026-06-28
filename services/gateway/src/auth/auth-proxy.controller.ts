import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Request,
  Res,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { LoginDto, RefreshTokenDto, RegisterDto } from "@tone-knob/shared";
import { Response } from "express";
import { catchError, firstValueFrom, throwError } from "rxjs";

import { RpcToHttpExceptionFilter } from "../common/rpc-exception.filter";
import { CurrentUser, RequestUser } from "./decorators/current-user.decorator";
import { GitHubAuthGuard } from "./guards/github-auth.guard";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("Auth")
@Controller("api/auth")
@UseFilters(RpcToHttpExceptionFilter)
export class AuthProxyController {
  constructor(@Inject("AUTH_SERVICE") private readonly authClient: ClientProxy) {}

  // 브루트포스 방어: 전역 60req/min보다 훨씬 엄격하게 제한
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post("register")
  @ApiOperation({
    summary: "회원가입",
    description:
      "이메일/비밀번호로 신규 계정을 생성하고 즉시 로그인 토큰을 발급합니다. 이메일/username은 중복될 수 없습니다. " +
      "브루트포스 방지를 위해 IP당 1분에 10회로 제한됩니다.",
  })
  @ApiResponse({
    status: 201,
    description: "회원가입 성공 — 사용자 정보와 액세스/리프레시 토큰 반환",
  })
  @ApiResponse({ status: 409, description: "이미 사용 중인 이메일 또는 username" })
  @ApiResponse({ status: 429, description: "요청 횟수 초과 (1분당 10회 제한)" })
  async register(@Body() dto: RegisterDto) {
    return firstValueFrom(
      this.authClient.send("auth.register", dto).pipe(catchError((err) => throwError(() => err))),
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "로그인",
    description:
      "이메일/비밀번호로 로그인하고 액세스 토큰(15분)과 리프레시 토큰(7일)을 발급합니다. " +
      "로그인 시 일일 1회 Knob 적립이 자동으로 처리됩니다. 브루트포스 방지를 위해 IP당 1분에 10회로 제한됩니다.",
  })
  @ApiResponse({
    status: 200,
    description: "로그인 성공 — 사용자 정보와 액세스/리프레시 토큰 반환",
  })
  @ApiResponse({ status: 401, description: "이메일 또는 비밀번호가 일치하지 않음" })
  @ApiResponse({ status: 429, description: "요청 횟수 초과 (1분당 10회 제한)" })
  async login(@Body() dto: LoginDto) {
    return firstValueFrom(
      this.authClient.send("auth.login", dto).pipe(catchError((err) => throwError(() => err))),
    );
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "토큰 갱신",
    description:
      "만료된 액세스 토큰을 리프레시 토큰으로 재발급합니다. 리프레시 토큰 자체도 함께 갱신됩니다(로테이션).",
  })
  @ApiResponse({ status: 200, description: "새 액세스/리프레시 토큰 반환" })
  @ApiResponse({ status: 401, description: "리프레시 토큰이 유효하지 않거나 만료됨" })
  async refresh(@Body() dto: RefreshTokenDto) {
    return firstValueFrom(
      this.authClient.send("auth.refresh", dto).pipe(catchError((err) => throwError(() => err))),
    );
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "현재 로그인한 사용자 정보 조회",
    description: "Authorization 헤더의 액세스 토큰으로 본인 프로필 정보를 조회합니다.",
  })
  @ApiResponse({ status: 200, description: "사용자 정보 반환" })
  @ApiResponse({ status: 401, description: "인증되지 않았거나 토큰이 만료됨" })
  async getMe(@CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.authClient
        .send("auth.validate", { userId: user.id })
        .pipe(catchError((err) => throwError(() => err))),
    );
  }

  // ─── Google OAuth ───

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: "Google 소셜 로그인 시작",
    description:
      "브라우저를 Google 로그인 동의 화면으로 리다이렉트합니다. GOOGLE_CLIENT_ID/SECRET 미설정 시 비활성화됩니다.",
  })
  @ApiResponse({ status: 302, description: "Google 인증 페이지로 리다이렉트" })
  async googleLogin() {
    // Passport redirects to Google
  }

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: "Google 소셜 로그인 콜백",
    description:
      "Google이 인증 완료 후 호출하는 콜백 엔드포인트입니다(직접 호출 대상 아님). " +
      "토큰 발급 후 `FRONTEND_URL/auth/callback?accessToken=...&refreshToken=...`로 리다이렉트합니다.",
  })
  @ApiResponse({ status: 302, description: "토큰을 쿼리 파라미터로 담아 프론트엔드로 리다이렉트" })
  async googleCallback(
    @Request()
    req: {
      user: {
        provider: string;
        providerId: string;
        email: string;
        displayName?: string;
        avatarUrl?: string;
      };
    },
    @Res() res: Response,
  ) {
    const result = await firstValueFrom(this.authClient.send("auth.socialLogin", req.user));
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${result.tokens.accessToken}&refreshToken=${result.tokens.refreshToken}`,
    );
  }

  // ─── GitHub OAuth ───

  @Get("github")
  @UseGuards(GitHubAuthGuard)
  @ApiOperation({
    summary: "GitHub 소셜 로그인 시작",
    description:
      "브라우저를 GitHub 로그인 동의 화면으로 리다이렉트합니다. GITHUB_CLIENT_ID/SECRET 미설정 시 비활성화됩니다.",
  })
  @ApiResponse({ status: 302, description: "GitHub 인증 페이지로 리다이렉트" })
  async githubLogin() {
    // Passport redirects to GitHub
  }

  @Get("github/callback")
  @UseGuards(GitHubAuthGuard)
  @ApiOperation({
    summary: "GitHub 소셜 로그인 콜백",
    description:
      "GitHub이 인증 완료 후 호출하는 콜백 엔드포인트입니다(직접 호출 대상 아님). " +
      "토큰 발급 후 `FRONTEND_URL/auth/callback?accessToken=...&refreshToken=...`로 리다이렉트합니다.",
  })
  @ApiResponse({ status: 302, description: "토큰을 쿼리 파라미터로 담아 프론트엔드로 리다이렉트" })
  async githubCallback(
    @Request()
    req: {
      user: {
        provider: string;
        providerId: string;
        email: string;
        displayName?: string;
        avatarUrl?: string;
      };
    },
    @Res() res: Response,
  ) {
    const result = await firstValueFrom(this.authClient.send("auth.socialLogin", req.user));
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${result.tokens.accessToken}&refreshToken=${result.tokens.refreshToken}`,
    );
  }
}
