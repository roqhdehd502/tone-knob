import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { catchError, firstValueFrom, throwError } from 'rxjs';

import { RpcToHttpExceptionFilter } from '../common/rpc-exception.filter';
import { CurrentUser, RequestUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('api/auth')
@UseFilters(RpcToHttpExceptionFilter)
export class AuthProxyController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  async register(
    @Body() dto: { email: string; username: string; password: string; displayName?: string },
  ) {
    return firstValueFrom(
      this.authClient.send('auth.register', dto).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인' })
  async login(@Body() dto: { email: string; password: string }) {
    return firstValueFrom(
      this.authClient.send('auth.login', dto).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '토큰 갱신' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return firstValueFrom(
      this.authClient.send('auth.refresh', { refreshToken }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 사용자 정보' })
  async getMe(@CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.authClient.send('auth.validate', { userId: user.id }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }
}
