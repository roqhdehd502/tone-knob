import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';

import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';

import { Follow } from '../entities/follow.entity';
import { Tab } from '../entities/tab.entity';
import { TabVersion } from '../entities/tab-version.entity';

const TAB_LIST_CACHE_TTL_MS = 30_000; // 타브 목록은 30초간 캐시 — 쓰기 발생 시 전체 무효화

@Injectable()
export class TabService {
  private readonly logger = new Logger(TabService.name);

  constructor(
    @InjectRepository(Tab)
    private readonly tabRepository: Repository<Tab>,
    @InjectRepository(TabVersion)
    private readonly tabVersionRepository: Repository<TabVersion>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  // Redis 연결 실패 등 캐시 장애가 DB 조회 자체를 막지 않도록 모든 캐시 호출을 best-effort로 처리한다.
  private async invalidateTabListCache(): Promise<void> {
    try {
      await this.cache.clear();
    } catch (err) {
      this.logger.warn(`캐시 무효화 실패 (무시): ${err instanceof Error ? err.message : err}`);
    }
  }

  async create(
    userId: string,
    dto: { title: string; artist?: string; content: Record<string, unknown>; isPublic?: boolean },
  ): Promise<Tab> {
    const tab = this.tabRepository.create({
      userId,
      title: dto.title,
      artist: dto.artist,
      content: dto.content,
      isPublic: dto.isPublic ?? false,
    });
    const saved = await this.tabRepository.save(tab);

    const version = this.tabVersionRepository.create({
      tabId: saved.id,
      versionNumber: 1,
      content: dto.content,
      changeDescription: '초기 버전',
      createdBy: userId,
    });
    await this.tabVersionRepository.save(version);
    await this.invalidateTabListCache();

    return saved;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    userId?: string;
    isPublic?: boolean;
  }): Promise<{ data: Tab[]; total: number; page: number; limit: number }> {
    const cacheKey = `tabs:list:${JSON.stringify(query)}`;
    try {
      const cached =
        await this.cache.get<{ data: Tab[]; total: number; page: number; limit: number }>(
          cacheKey,
        );
      if (cached) return cached;
    } catch (err) {
      this.logger.warn(`캐시 조회 실패 (무시): ${err instanceof Error ? err.message : err}`);
    }

    const result = await this.findAllUncached(query);

    try {
      await this.cache.set(cacheKey, result, TAB_LIST_CACHE_TTL_MS);
    } catch (err) {
      this.logger.warn(`캐시 저장 실패 (무시): ${err instanceof Error ? err.message : err}`);
    }

    return result;
  }

  private async findAllUncached(query: {
    page?: number;
    limit?: number;
    search?: string;
    userId?: string;
    isPublic?: boolean;
  }): Promise<{ data: Tab[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.tabRepository
      .createQueryBuilder('tab')
      .leftJoinAndSelect('tab.user', 'user')
      .select([
        'tab.id', 'tab.title', 'tab.artist', 'tab.isPublic',
        'tab.viewCount', 'tab.likeCount', 'tab.createdAt', 'tab.updatedAt',
        'user.id', 'user.username', 'user.displayName', 'user.avatarUrl',
      ]);

    if (query.userId) {
      qb.andWhere('tab.userId = :userId', { userId: query.userId });
    }
    if (query.isPublic !== undefined) {
      qb.andWhere('tab.isPublic = :isPublic', { isPublic: query.isPublic });
    }
    if (query.search) {
      qb.andWhere('(tab.title ILIKE :search OR tab.artist ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('tab.updatedAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Tab> {
    const tab = await this.tabRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!tab) {
      throw new RpcException({ statusCode: 404, message: '타브를 찾을 수 없습니다' });
    }
    return tab;
  }

  async findOneWithAccessCheck(id: string, requestUserId?: string): Promise<Tab> {
    const tab = await this.findOne(id);
    if (!tab.isPublic && tab.userId !== requestUserId) {
      throw new RpcException({ statusCode: 403, message: '이 타브에 접근할 수 없습니다' });
    }
    void this.tabRepository.increment({ id }, 'viewCount', 1);
    return tab;
  }

  async update(
    id: string,
    userId: string,
    dto: { title?: string; artist?: string; content?: Record<string, unknown>; isPublic?: boolean; changeDescription?: string },
  ): Promise<Tab> {
    const tab = await this.findOne(id);
    if (tab.userId !== userId) {
      throw new RpcException({ statusCode: 403, message: '이 타브를 수정할 권한이 없습니다' });
    }

    if (dto.content) {
      const lastVersion = await this.tabVersionRepository.findOne({
        where: { tabId: id },
        order: { versionNumber: 'DESC' },
      });
      const nextVersion = (lastVersion?.versionNumber ?? 0) + 1;
      const version = this.tabVersionRepository.create({
        tabId: id,
        versionNumber: nextVersion,
        content: dto.content,
        changeDescription: dto.changeDescription ?? `버전 ${nextVersion}`,
        createdBy: userId,
      });
      await this.tabVersionRepository.save(version);
    }

    Object.assign(tab, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.artist !== undefined && { artist: dto.artist }),
      ...(dto.content !== undefined && { content: dto.content }),
      ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
    });

    const saved = await this.tabRepository.save(tab);
    await this.invalidateTabListCache();
    return saved;
  }

  async remove(id: string, userId: string): Promise<{ success: true }> {
    const tab = await this.findOne(id);
    if (tab.userId !== userId) {
      throw new RpcException({ statusCode: 403, message: '이 타브를 삭제할 권한이 없습니다' });
    }
    await this.tabRepository.remove(tab);
    await this.invalidateTabListCache();
    return { success: true };
  }

  async fork(id: string, userId: string): Promise<Tab> {
    const original = await this.findOne(id);
    if (!original.isPublic && original.userId !== userId) {
      throw new RpcException({ statusCode: 403, message: '이 타브를 포크할 수 없습니다' });
    }

    const forked = this.tabRepository.create({
      userId,
      title: `${original.title} (Fork)`,
      artist: original.artist,
      content: original.content,
      isPublic: false,
    });
    const saved = await this.tabRepository.save(forked);

    const version = this.tabVersionRepository.create({
      tabId: saved.id,
      versionNumber: 1,
      content: original.content,
      changeDescription: `${original.title}에서 포크`,
      createdBy: userId,
    });
    await this.tabVersionRepository.save(version);
    await this.invalidateTabListCache();

    return saved;
  }

  async getVersions(tabId: string, requestUserId?: string): Promise<TabVersion[]> {
    const tab = await this.findOne(tabId);
    if (!tab.isPublic && tab.userId !== requestUserId) {
      throw new RpcException({ statusCode: 403, message: '이 타브에 접근할 수 없습니다' });
    }
    return this.tabVersionRepository.find({
      where: { tabId },
      order: { versionNumber: 'DESC' },
      relations: ['creator'],
    });
  }

  async getFeed(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Tab[]; total: number; page: number; limit: number }> {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const followingIds = await this.followRepository
      .createQueryBuilder('follow')
      .select('follow.followingId')
      .where('follow.followerId = :userId', { userId })
      .getRawMany<{ follow_followingId: string }>();

    const ids = followingIds.map((f) => f.follow_followingId);
    if (ids.length === 0) {
      return { data: [], total: 0, page, limit: safeLimit };
    }

    const [data, total] = await this.tabRepository
      .createQueryBuilder('tab')
      .leftJoinAndSelect('tab.user', 'user')
      .select([
        'tab.id', 'tab.title', 'tab.artist', 'tab.isPublic',
        'tab.viewCount', 'tab.likeCount', 'tab.createdAt', 'tab.updatedAt',
        'user.id', 'user.username', 'user.displayName', 'user.avatarUrl',
      ])
      .where('tab.userId IN (:...ids)', { ids })
      .andWhere('tab.isPublic = :isPublic', { isPublic: true })
      .orderBy('tab.updatedAt', 'DESC')
      .skip(skip)
      .take(safeLimit)
      .getManyAndCount();

    return { data, total, page, limit: safeLimit };
  }

  async togglePublish(id: string, userId: string): Promise<Tab> {
    const tab = await this.findOne(id);
    if (tab.userId !== userId) {
      throw new RpcException({ statusCode: 403, message: '이 타브를 공개/비공개 전환할 권한이 없습니다' });
    }
    tab.isPublic = !tab.isPublic;
    const saved = await this.tabRepository.save(tab);
    await this.invalidateTabListCache();
    return saved;
  }
}
