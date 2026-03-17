import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CdnService {
  private readonly cdnBaseUrl: string;
  private readonly s3BaseUrl: string;
  private readonly cdnEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.cdnBaseUrl = this.configService.get<string>('CDN_BASE_URL', '');
    this.s3BaseUrl = this.configService.get<string>(
      'S3_BASE_URL',
      'https://storage.tone-knob.com',
    );
    this.cdnEnabled = Boolean(this.cdnBaseUrl);
  }

  // 원본 스토리지 URL을 CDN URL로 변환
  toCdnUrl(originalUrl: string): string {
    if (!this.cdnEnabled || !originalUrl) return originalUrl;
    if (originalUrl.startsWith(this.s3BaseUrl)) {
      return originalUrl.replace(this.s3BaseUrl, this.cdnBaseUrl);
    }
    return originalUrl;
  }

  // CDN URL을 원본 스토리지 URL로 역변환
  toOriginUrl(cdnUrl: string): string {
    if (!this.cdnEnabled || !cdnUrl) return cdnUrl;
    if (cdnUrl.startsWith(this.cdnBaseUrl)) {
      return cdnUrl.replace(this.cdnBaseUrl, this.s3BaseUrl);
    }
    return cdnUrl;
  }

  // 서명된 CDN URL 생성 (CloudFront 서명 URL 스텁)
  getSignedUrl(path: string, expiresInSeconds = 3600): string {
    if (!this.cdnEnabled) return `${this.s3BaseUrl}/${path}`;

    // TODO: 실제 CloudFront 서명 URL 생성
    // import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
    // return getSignedUrl({
    //   url: `${this.cdnBaseUrl}/${path}`,
    //   keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
    //   privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
    //   dateLessThan: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    // });

    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return `${this.cdnBaseUrl}/${path}?Expires=${expires}&stub=true`;
  }

  // 배치 URL 변환 (목록 응답에 사용)
  transformUrls<T extends Record<string, unknown>>(
    items: T[],
    fields: string[],
  ): T[] {
    return items.map((item) => {
      const transformed = { ...item } as Record<string, unknown>;
      for (const field of fields) {
        const val = transformed[field];
        if (typeof val === 'string') {
          transformed[field] = this.toCdnUrl(val);
        }
      }
      return transformed as T;
    });
  }

  getCdnStatus(): {
    enabled: boolean;
    cdnBaseUrl: string;
    s3BaseUrl: string;
  } {
    return {
      enabled: this.cdnEnabled,
      cdnBaseUrl: this.cdnBaseUrl || '(not configured)',
      s3BaseUrl: this.s3BaseUrl,
    };
  }
}
