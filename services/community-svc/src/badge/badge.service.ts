import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';

import { Repository } from 'typeorm';

import { BADGE_EVENTS } from '@tone-knob/shared';

import { Badge } from '../entities/badge.entity';
import { UserBadge } from '../entities/user-badge.entity';

@Injectable()
export class BadgeService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepository: Repository<UserBadge>,
    @Inject('COMMUNITY_SERVICE') private readonly communityClient: ClientProxy,
  ) {}

  async getAllBadges(): Promise<Badge[]> {
    return this.badgeRepository.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return this.userBadgeRepository.find({
      where: { userId },
      relations: ['badge'],
      order: { earnedAt: 'DESC' },
    });
  }

  async getFeaturedBadges(userId: string): Promise<UserBadge[]> {
    return this.userBadgeRepository.find({
      where: { userId, isFeatured: true },
      relations: ['badge'],
      order: { earnedAt: 'ASC' },
    });
  }

  async awardBadge(userId: string, badgeCode: string): Promise<UserBadge> {
    const badge = await this.badgeRepository.findOne({ where: { code: badgeCode } });
    if (!badge) {
      throw new RpcException(new NotFoundException(`뱃지 코드 '${badgeCode}'를 찾을 수 없습니다`));
    }

    const existing = await this.userBadgeRepository.findOne({
      where: { userId, badgeId: badge.id },
    });
    if (existing) {
      throw new RpcException(new ConflictException('이미 획득한 뱃지입니다'));
    }

    const userBadge = this.userBadgeRepository.create({
      userId,
      badgeId: badge.id,
    });
    const saved = await this.userBadgeRepository.save(userBadge);

    this.communityClient.emit(BADGE_EVENTS.AWARDED, {
      userId,
      badgeCode: badge.code,
      badgeName: badge.name,
      userBadgeId: saved.id,
    });

    return saved;
  }

  async toggleFeatured(userBadgeId: string, userId: string): Promise<UserBadge> {
    const userBadge = await this.userBadgeRepository.findOne({
      where: { id: userBadgeId, userId },
      relations: ['badge'],
    });
    if (!userBadge) {
      throw new RpcException(new NotFoundException('뱃지를 찾을 수 없습니다'));
    }

    if (!userBadge.isFeatured) {
      const featuredCount = await this.userBadgeRepository.count({
        where: { userId, isFeatured: true },
      });
      if (featuredCount >= 3) {
        throw new RpcException(
          new BadRequestException('대표 뱃지는 최대 3개까지만 설정할 수 있습니다'),
        );
      }
    }

    userBadge.isFeatured = !userBadge.isFeatured;
    const saved = await this.userBadgeRepository.save(userBadge);

    this.communityClient.emit(BADGE_EVENTS.FEATURED_CHANGED, {
      userId,
      userBadgeId: saved.id,
      isFeatured: saved.isFeatured,
    });

    return saved;
  }
}
