import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CdnService } from './cdn/cdn.service';
import { RegionService } from './region/region.service';
import { StorageService } from './storage/storage.service';

@Controller()
export class MediaSvcController {
  constructor(
    private readonly cdnService: CdnService,
    private readonly regionService: RegionService,
    private readonly storageService: StorageService,
  ) {}

  // ─── Storage ───

  @MessagePattern('media.storage.upload')
  async uploadFile(
    @Payload()
    data: {
      fileBase64: string;
      fileName: string;
      contentType: string;
      folder?: string;
    },
  ) {
    return this.storageService.upload(
      data.fileBase64,
      data.fileName,
      data.contentType,
      data.folder,
    );
  }

  @MessagePattern('media.storage.remove')
  async removeFile(@Payload() data: { path: string }) {
    await this.storageService.remove(data.path);
    return { success: true };
  }

  @MessagePattern('media.storage.status')
  getStorageStatus() {
    return { enabled: this.storageService.isEnabled() };
  }

  // ─── CDN ───

  @MessagePattern('media.cdn.toCdnUrl')
  toCdnUrl(@Payload() data: { url: string }) {
    return this.cdnService.toCdnUrl(data.url);
  }

  @MessagePattern('media.cdn.toOriginUrl')
  toOriginUrl(@Payload() data: { url: string }) {
    return this.cdnService.toOriginUrl(data.url);
  }

  @MessagePattern('media.cdn.getSignedUrl')
  getSignedUrl(@Payload() data: { path: string; expiresInSeconds?: number }) {
    return this.cdnService.getSignedUrl(data.path, data.expiresInSeconds);
  }

  @MessagePattern('media.cdn.transformUrls')
  transformUrls(@Payload() data: { items: Record<string, unknown>[]; fields: string[] }) {
    return this.cdnService.transformUrls(data.items, data.fields);
  }

  @MessagePattern('media.cdn.status')
  getCdnStatus() {
    return this.cdnService.getCdnStatus();
  }

  // ─── Region ───

  @MessagePattern('media.region.getAll')
  getAllRegions() {
    return this.regionService.getAllRegions();
  }

  @MessagePattern('media.region.select')
  selectRegion(@Payload() data: { latitude?: number; longitude?: number }) {
    return this.regionService.selectRegion(data.latitude, data.longitude);
  }

  @MessagePattern('media.region.getById')
  getRegionById(@Payload() data: { id: string }) {
    return this.regionService.getRegionById(data.id);
  }

  @MessagePattern('media.region.checkHealth')
  async checkHealth() {
    await this.regionService.checkHealth();
    return this.regionService.getAllRegions().map((r) => ({
      id: r.id,
      name: r.name,
      healthy: r.healthy,
      latencyMs: r.latencyMs,
    }));
  }
}
