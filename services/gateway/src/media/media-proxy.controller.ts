import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { GetSignedUrlDto, ToCdnUrlDto, ToOriginUrlDto } from '@tone-knob/shared';
import { firstValueFrom } from 'rxjs';

import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RpcToHttpExceptionFilter } from '../common/rpc-exception.filter';

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024; // Supabase storage file_size_limit과 동일 (50MiB)

@ApiTags('Media')
@Controller('api/media')
@UseFilters(RpcToHttpExceptionFilter)
export class MediaProxyController {
  constructor(
    @Inject('MEDIA_SERVICE') private readonly mediaClient: ClientProxy,
  ) {}

  // ─── Storage ───

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '파일 업로드 (Supabase Storage)',
    description:
      '오디오/이미지 등 파일을 Supabase Storage에 업로드합니다. 최대 50MiB. ' +
      'SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY가 설정되지 않은 환경에서는 업로드가 비활성화되어 실패합니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: '업로드할 파일' },
        folder: { type: 'string', description: '저장 경로 prefix (미입력 시 users/{내 id} 하위에 저장)' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: '{ url, path } — 업로드된 파일의 공개 URL과 Storage 경로 반환' })
  @ApiResponse({ status: 400, description: '파일이 없거나 50MiB 초과' })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_SIZE_BYTES } }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: RequestUser,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('업로드할 파일이 없습니다');
    }

    return firstValueFrom(
      this.mediaClient.send('media.storage.upload', {
        fileBase64: file.buffer.toString('base64'),
        fileName: file.originalname,
        contentType: file.mimetype,
        folder: folder || `users/${user.id}`,
      }),
    );
  }

  // ─── CDN ───

  @Post('cdn/to-cdn-url')
  @ApiOperation({ summary: 'Origin URL → CDN URL 변환', description: 'Storage 원본 URL을 CDN 도메인 기준 URL로 변환합니다. CDN_BASE_URL 미설정 시 원본 URL을 그대로 반환합니다.' })
  @ApiResponse({ status: 200, description: '변환된 CDN URL 반환' })
  async toCdnUrl(@Body() body: ToCdnUrlDto) {
    return firstValueFrom(
      this.mediaClient.send('media.cdn.toCdnUrl', body),
    );
  }

  @Post('cdn/to-origin-url')
  @ApiOperation({ summary: 'CDN URL → Origin URL 변환', description: 'CDN 도메인 기준 URL을 Storage 원본 URL로 역변환합니다.' })
  @ApiResponse({ status: 200, description: '변환된 원본 URL 반환' })
  async toOriginUrl(@Body() body: ToOriginUrlDto) {
    return firstValueFrom(
      this.mediaClient.send('media.cdn.toOriginUrl', body),
    );
  }

  @Post('cdn/signed-url')
  @ApiOperation({ summary: '서명된 임시 URL 발급', description: '비공개 파일에 대해 일정 시간 동안만 유효한 서명된 URL을 발급합니다(녹음 파일 등 비공개 콘텐츠 공유용).' })
  @ApiResponse({ status: 200, description: '{ url: string } 반환' })
  async getSignedUrl(@Body() body: GetSignedUrlDto) {
    const url = await firstValueFrom(
      this.mediaClient.send('media.cdn.getSignedUrl', body),
    );
    return { url };
  }

  @Get('cdn/status')
  @ApiOperation({ summary: 'CDN 연동 상태 조회', description: 'CDN_BASE_URL 등 CDN 관련 환경변수 설정 여부를 조회합니다(헬스체크/디버깅용).' })
  @ApiResponse({ status: 200, description: 'CDN 설정 상태 반환' })
  async getCdnStatus() {
    return firstValueFrom(
      this.mediaClient.send('media.cdn.status', {}),
    );
  }

  // ─── Region ───

  @Get('regions')
  @ApiOperation({ summary: '전체 미디어 리전 목록 조회', description: '합주(WebRTC)/스토리지 등에 사용 가능한 지역(리전) 목록과 각 리전의 헬스 상태를 조회합니다.' })
  @ApiResponse({ status: 200, description: '리전 목록 반환' })
  async getAllRegions() {
    return firstValueFrom(
      this.mediaClient.send('media.region.getAll', {}),
    );
  }

  @Get('regions/select')
  @ApiOperation({ summary: '최적 리전 자동 선택', description: '클라이언트의 위도/경도를 기준으로 가장 가까운(지연시간이 낮을 것으로 예상되는) 헬시 리전을 추천합니다. 좌표 미전달 시 기본 리전을 반환합니다.' })
  @ApiQuery({ name: 'lat', required: false, description: '클라이언트 위도', example: 37.5665 })
  @ApiQuery({ name: 'lng', required: false, description: '클라이언트 경도', example: 126.978 })
  @ApiResponse({ status: 200, description: '추천 리전 반환' })
  async selectRegion(@Query('lat') lat?: string, @Query('lng') lng?: string) {
    return firstValueFrom(
      this.mediaClient.send('media.region.select', {
        latitude: lat ? parseFloat(lat) : undefined,
        longitude: lng ? parseFloat(lng) : undefined,
      }),
    );
  }

  @Get('regions/health')
  @ApiOperation({ summary: '리전 헬스체크 실행', description: '등록된 모든 리전에 헬스체크를 수행하고 최신 상태(healthy, latencyMs)를 반환합니다.' })
  @ApiResponse({ status: 200, description: '갱신된 리전별 헬스 상태 목록 반환' })
  async checkHealth() {
    return firstValueFrom(
      this.mediaClient.send('media.region.checkHealth', {}),
    );
  }
}
