import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
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

@ApiTags('Tabs')
@Controller('api/tabs')
@UseFilters(RpcToHttpExceptionFilter)
export class TabProxyController {
  constructor(
    @Inject('TAB_SERVICE') private readonly tabClient: ClientProxy,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 생성' })
  async create(@CurrentUser() user: RequestUser, @Body() dto: Record<string, unknown>) {
    return firstValueFrom(
      this.tabClient.send('tabs.create', { userId: user.id, dto }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Get()
  @ApiOperation({ summary: '공개 타브 목록 조회' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'userId', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('userId') userId?: string,
  ) {
    return firstValueFrom(
      this.tabClient.send('tabs.findAll', {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        search,
        userId,
        isPublic: true,
      }).pipe(catchError((err) => throwError(() => err))),
    );
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 타브 목록 조회' })
  async findMyTabs(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.tabClient.send('tabs.findAll', {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        userId: user.id,
      }).pipe(catchError((err) => throwError(() => err))),
    );
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '팔로우 기반 피드 조회' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFeed(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.tabClient.send('tabs.getFeed', {
        userId: user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }).pipe(catchError((err) => throwError(() => err))),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '타브 상세 조회' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: RequestUser) {
    return firstValueFrom(
      this.tabClient.send('tabs.findOne', { id, requestUserId: user?.id }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 수정' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.tabClient.send('tabs.update', { id, userId: user.id, dto }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 삭제' })
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.tabClient.send('tabs.remove', { id, userId: user.id }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Post(':id/fork')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 포크' })
  async fork(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.tabClient.send('tabs.fork', { id, userId: user.id }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Get(':id/versions')
  @ApiOperation({ summary: '타브 버전 히스토리 조회' })
  async getVersions(@Param('id') id: string, @CurrentUser() user?: RequestUser) {
    return firstValueFrom(
      this.tabClient.send('tabs.getVersions', { tabId: id, requestUserId: user?.id }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 공개/비공개 토글' })
  async togglePublish(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.tabClient.send('tabs.togglePublish', { id, userId: user.id }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }
}
