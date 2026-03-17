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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

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
  @ApiOperation({ summary: '사용자 프로필 조회' })
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
  @ApiOperation({ summary: '사용자 프로필 수정' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: { displayName?: string; avatarUrl?: string; bio?: string },
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
