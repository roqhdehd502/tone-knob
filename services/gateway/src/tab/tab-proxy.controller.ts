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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateTabDto, UpdateTabDto } from '@tone-knob/shared';
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
  @ApiOperation({ summary: '타브 생성', description: '로그인한 사용자 명의로 새 타브를 생성합니다. 무료 플랜은 월 3회 생성 제한이 있습니다(subscription-svc에서 검증).' })
  @ApiResponse({ status: 201, description: '생성된 타브 반환' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '무료 플랜 월 생성 한도 초과' })
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateTabDto) {
    return firstValueFrom(
      this.tabClient.send('tabs.create', { userId: user.id, dto }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Get()
  @ApiOperation({ summary: '공개 타브 목록 조회', description: '인증 없이 누구나 조회 가능한 공개(isPublic=true) 타브 목록입니다. 제목/아티스트 검색 및 특정 작성자 필터링을 지원합니다.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본값 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본값 20)' })
  @ApiQuery({ name: 'search', required: false, description: '제목/아티스트 검색 키워드' })
  @ApiQuery({ name: 'userId', required: false, description: '특정 작성자의 타브만 조회' })
  @ApiResponse({ status: 200, description: '공개 타브 목록 반환 (페이지네이션)' })
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
  @ApiOperation({ summary: '내 타브 목록 조회', description: '로그인한 사용자가 작성한 모든 타브를 비공개 여부와 관계없이 조회합니다.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본값 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본값 20)' })
  @ApiResponse({ status: 200, description: '내 타브 목록 반환 (페이지네이션)' })
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
  @ApiOperation({ summary: '팔로우 기반 피드 조회', description: '내가 팔로우한 사용자들이 공개한 타브를 최신순으로 조회합니다.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본값 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본값 20)' })
  @ApiResponse({ status: 200, description: '피드 타브 목록 반환' })
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
  @ApiOperation({ summary: '타브 상세 조회', description: '비공개 타브는 작성자 본인만 조회할 수 있습니다(로그인 시 토큰 전달 권장).' })
  @ApiParam({ name: 'id', description: '타브 ID' })
  @ApiResponse({ status: 200, description: '타브 상세 정보 반환 (본문 content 포함)' })
  @ApiResponse({ status: 403, description: '비공개 타브이며 작성자가 아님' })
  @ApiResponse({ status: 404, description: '타브를 찾을 수 없음' })
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
  @ApiOperation({ summary: '타브 수정', description: '작성자 본인만 수정할 수 있습니다. 전달한 필드만 갱신됩니다(부분 수정).' })
  @ApiParam({ name: 'id', description: '타브 ID' })
  @ApiResponse({ status: 200, description: '수정된 타브 반환' })
  @ApiResponse({ status: 403, description: '작성자가 아님' })
  @ApiResponse({ status: 404, description: '타브를 찾을 수 없음' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateTabDto,
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
  @ApiOperation({ summary: '타브 삭제', description: '작성자 본인만 삭제할 수 있습니다. 연결된 버전 기록도 함께 삭제됩니다.' })
  @ApiParam({ name: 'id', description: '타브 ID' })
  @ApiResponse({ status: 200, description: '삭제 완료' })
  @ApiResponse({ status: 403, description: '작성자가 아님' })
  @ApiResponse({ status: 404, description: '타브를 찾을 수 없음' })
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
  @ApiOperation({ summary: '타브 포크', description: '다른 사람의 공개 타브를 복제해 내 소유의 새 타브로 만듭니다(원본 내용 그대로 복사, 독립적으로 수정 가능).' })
  @ApiParam({ name: 'id', description: '포크할 원본 타브 ID' })
  @ApiResponse({ status: 201, description: '포크된 새 타브 반환' })
  @ApiResponse({ status: 404, description: '원본 타브를 찾을 수 없음' })
  async fork(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.tabClient.send('tabs.fork', { id, userId: user.id }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Get(':id/versions')
  @ApiOperation({ summary: '타브 버전 히스토리 조회', description: '수정될 때마다 자동 저장되는 버전 기록을 시간순으로 조회합니다.' })
  @ApiParam({ name: 'id', description: '타브 ID' })
  @ApiResponse({ status: 200, description: '버전 목록 반환' })
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
  @ApiOperation({ summary: '타브 공개/비공개 토글', description: '작성자 본인만 가능합니다. 호출마다 현재 상태의 반대로 전환됩니다.' })
  @ApiParam({ name: 'id', description: '타브 ID' })
  @ApiResponse({ status: 200, description: '토글 후 타브 반환' })
  @ApiResponse({ status: 403, description: '작성자가 아님' })
  async togglePublish(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.tabClient.send('tabs.togglePublish', { id, userId: user.id }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }
}
