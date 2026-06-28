import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface UploadResult {
  url: string;
  path: string;
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // Supabase 프로젝트 file_size_limit과 동일 (50MiB)

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: SupabaseClient | null;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    this.bucket = this.configService.get<string>(
      'SUPABASE_STORAGE_BUCKET',
      'media',
    );

    if (!url || !serviceRoleKey) {
      this.logger.warn(
        'SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY가 설정되지 않아 파일 업로드가 비활성화됩니다.',
      );
      this.client = null;
    } else {
      this.client = createClient(url, serviceRoleKey);
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  async upload(
    fileBase64: string,
    fileName: string,
    contentType: string,
    folder = 'uploads',
  ): Promise<UploadResult> {
    if (!this.client) {
      throw new RpcException(
        new BadRequestException(
          '파일 업로드가 설정되지 않았습니다 (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY 필요)',
        ),
      );
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
      throw new RpcException(
        new BadRequestException(
          `파일 크기는 최대 ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MiB까지 허용됩니다`,
        ),
      );
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${folder}/${Date.now()}-${safeName}`;

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, buffer, { contentType, upsert: false });

    if (error) {
      this.logger.error(`Upload failed for ${path}: ${error.message}`);
      throw new RpcException(
        new BadRequestException(`파일 업로드에 실패했습니다: ${error.message}`),
      );
    }

    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return { url: data.publicUrl, path };
  }

  async remove(path: string): Promise<void> {
    if (!this.client) return;
    const { error } = await this.client.storage.from(this.bucket).remove([path]);
    if (error) {
      this.logger.warn(`Failed to remove ${path}: ${error.message}`);
    }
  }
}
