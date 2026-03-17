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
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { catchError, firstValueFrom, throwError } from 'rxjs';

import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RpcToHttpExceptionFilter } from '../common/rpc-exception.filter';

@ApiTags('Jam Rooms')
@Controller('api/jam-rooms')
@UseFilters(RpcToHttpExceptionFilter)
export class JamProxyController {
  constructor(
    @Inject('JAM_SERVICE') private readonly jamClient: ClientProxy,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '합주방 생성' })
  async create(@CurrentUser() user: RequestUser, @Body() dto: Record<string, unknown>) {
    return firstValueFrom(
      this.jamClient.send('jam.create', { hostId: user.id, dto }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Get()
  @ApiOperation({ summary: '합주방 목록 조회' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ) {
    return firstValueFrom(
      this.jamClient.send('jam.findAll', {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      }).pipe(catchError((err) => throwError(() => err))),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '합주방 상세 조회' })
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.jamClient.send('jam.findOne', { id }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '합주방 참가' })
  async join(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: { password?: string },
  ) {
    return firstValueFrom(
      this.jamClient.send('jam.join', { roomId: id, userId: user.id, password: dto.password }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '합주방 나가기' })
  async leave(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.jamClient.send('jam.leave', { roomId: id, userId: user.id }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Get(':id/participants')
  @ApiOperation({ summary: '합주방 참가자 목록' })
  async getParticipants(@Param('id') id: string) {
    return firstValueFrom(
      this.jamClient.send('jam.participants', { roomId: id }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '합주방 닫기' })
  async close(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.jamClient.send('jam.close', { roomId: id, userId: user.id }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }
}
