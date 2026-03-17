import {
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Body,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('api/media')
export class MediaProxyController {
  constructor(
    @Inject('MEDIA_SERVICE') private readonly mediaClient: ClientProxy,
  ) {}

  // ─── CDN ───

  @Post('cdn/to-cdn-url')
  async toCdnUrl(@Body() body: { url: string }) {
    return firstValueFrom(
      this.mediaClient.send('media.cdn.toCdnUrl', body),
    );
  }

  @Post('cdn/to-origin-url')
  async toOriginUrl(@Body() body: { url: string }) {
    return firstValueFrom(
      this.mediaClient.send('media.cdn.toOriginUrl', body),
    );
  }

  @Post('cdn/signed-url')
  async getSignedUrl(@Body() body: { path: string; expiresInSeconds?: number }) {
    const url = await firstValueFrom(
      this.mediaClient.send('media.cdn.getSignedUrl', body),
    );
    return { url };
  }

  @Get('cdn/status')
  async getCdnStatus() {
    return firstValueFrom(
      this.mediaClient.send('media.cdn.status', {}),
    );
  }

  // ─── Region ───

  @Get('regions')
  async getAllRegions() {
    return firstValueFrom(
      this.mediaClient.send('media.region.getAll', {}),
    );
  }

  @Get('regions/select')
  async selectRegion(@Query('lat') lat?: string, @Query('lng') lng?: string) {
    return firstValueFrom(
      this.mediaClient.send('media.region.select', {
        latitude: lat ? parseFloat(lat) : undefined,
        longitude: lng ? parseFloat(lng) : undefined,
      }),
    );
  }

  @Get('regions/health')
  async checkHealth() {
    return firstValueFrom(
      this.mediaClient.send('media.region.checkHealth', {}),
    );
  }
}
