import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Recording, RecordingVisibility } from '../entities/recording.entity';

@Injectable()
export class RecordingService {
  constructor(
    @InjectRepository(Recording)
    private readonly recordingRepository: Repository<Recording>,
  ) {}

  async create(
    userId: string,
    data: {
      title: string;
      description?: string;
      audioUrl: string;
      durationSeconds: number;
      tabId?: string;
      visibility?: RecordingVisibility;
    },
  ): Promise<Recording> {
    const recording = this.recordingRepository.create({
      userId,
      title: data.title,
      description: data.description,
      audioUrl: data.audioUrl,
      durationSeconds: data.durationSeconds,
      tabId: data.tabId,
      visibility: data.visibility || RecordingVisibility.PUBLIC,
    });
    return this.recordingRepository.save(recording);
  }

  async findById(id: string): Promise<Recording> {
    const recording = await this.recordingRepository.findOne({
      where: { id },
      relations: ['user', 'tab'],
    });
    if (!recording) {
      throw new NotFoundException('녹음을 찾을 수 없습니다');
    }
    return recording;
  }

  async findPublic(
    page = 1,
    limit = 20,
  ): Promise<{ data: Recording[]; total: number }> {
    const [data, total] = await this.recordingRepository.findAndCount({
      where: { visibility: RecordingVisibility.PUBLIC },
      relations: ['user', 'tab'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findByUser(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Recording[]; total: number }> {
    const [data, total] = await this.recordingRepository.findAndCount({
      where: { userId },
      relations: ['tab'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async update(
    userId: string,
    recordingId: string,
    data: {
      title?: string;
      description?: string;
      visibility?: RecordingVisibility;
    },
  ): Promise<Recording> {
    const recording = await this.findById(recordingId);
    if (recording.userId !== userId) {
      throw new ForbiddenException('수정 권한이 없습니다');
    }
    Object.assign(recording, data);
    return this.recordingRepository.save(recording);
  }

  async delete(userId: string, recordingId: string): Promise<void> {
    const recording = await this.findById(recordingId);
    if (recording.userId !== userId) {
      throw new ForbiddenException('삭제 권한이 없습니다');
    }
    await this.recordingRepository.remove(recording);
  }

  async incrementPlayCount(id: string): Promise<void> {
    await this.recordingRepository.increment({ id }, 'playCount', 1);
  }

  async getShareUrl(recordingId: string): Promise<{ url: string }> {
    const recording = await this.findById(recordingId);
    return { url: `/recordings/${recording.id}` };
  }
}
