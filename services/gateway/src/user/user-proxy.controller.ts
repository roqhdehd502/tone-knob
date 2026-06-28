import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Put,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UpdateUserDto } from '@tone-knob/shared';
import { catchError, firstValueFrom, throwError } from 'rxjs';

import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RpcToHttpExceptionFilter } from '../common/rpc-exception.filter';

@ApiTags('Users')
@Controller('api/users')
@UseFilters(RpcToHttpExceptionFilter)
export class UserProxyController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 프로필 조회', description: '다른 사용자의 공개 프로필(닉네임, 표시 이름, 아바타, 자기소개 등)을 조회합니다.' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 프로필 반환' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async findById(@Param('id') id: string) {
    return firstValueFrom(
      this.authClient.send('users.findById', { id }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 프로필 수정', description: '본인 프로필만 수정할 수 있습니다(전달한 필드만 갱신).' })
  @ApiParam({ name: 'id', description: '사용자 ID (본인 ID와 일치해야 함)' })
  @ApiResponse({ status: 200, description: '수정된 프로필 반환' })
  @ApiResponse({ status: 403, description: '본인이 아님' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateUserDto,
  ) {
    if (user.id !== id) {
      return { statusCode: 403, message: '본인만 수정할 수 있습니다' };
    }
    return firstValueFrom(
      this.authClient.send('users.update', { id, dto }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }
}
