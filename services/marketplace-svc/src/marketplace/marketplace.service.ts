import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';

import { Repository } from 'typeorm';

import { Tab } from '../entities/tab.entity';
import { PurchaseStatus, TabPurchase } from '../entities/tab-purchase.entity';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(Tab)
    private readonly tabRepository: Repository<Tab>,
    @InjectRepository(TabPurchase)
    private readonly purchaseRepository: Repository<TabPurchase>,
  ) {}

  async setPrice(tabId: string, userId: string, price: number): Promise<Tab> {
    const tab = await this.tabRepository.findOne({ where: { id: tabId } });
    if (!tab) throw new RpcException(new NotFoundException('타브를 찾을 수 없습니다'));
    if (tab.userId !== userId) {
      throw new RpcException(new ForbiddenException('이 타브의 가격을 설정할 권한이 없습니다'));
    }
    tab.price = price;
    return this.tabRepository.save(tab);
  }

  async listPaidTabs(
    page = 1,
    limit = 20,
  ): Promise<{ data: Tab[]; total: number; page: number; limit: number }> {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const [data, total] = await this.tabRepository
      .createQueryBuilder('tab')
      .leftJoinAndSelect('tab.user', 'user')
      .select([
        'tab.id', 'tab.title', 'tab.artist', 'tab.isPublic',
        'tab.viewCount', 'tab.likeCount', 'tab.price',
        'tab.createdAt', 'tab.updatedAt',
        'user.id', 'user.username', 'user.displayName', 'user.avatarUrl',
      ])
      .where('tab.isPublic = :isPublic', { isPublic: true })
      .andWhere('tab.price > :minPrice', { minPrice: 0 })
      .orderBy('tab.updatedAt', 'DESC')
      .skip(skip)
      .take(safeLimit)
      .getManyAndCount();

    return { data, total, page, limit: safeLimit };
  }

  async purchase(tabId: string, buyerId: string): Promise<TabPurchase> {
    const tab = await this.tabRepository.findOne({ where: { id: tabId } });
    if (!tab) throw new RpcException(new NotFoundException('타브를 찾을 수 없습니다'));
    if (!tab.isPublic) throw new RpcException(new ForbiddenException('비공개 타브는 구매할 수 없습니다'));
    if (tab.price <= 0) throw new RpcException(new ForbiddenException('무료 타브입니다'));
    if (tab.userId === buyerId) throw new RpcException(new ForbiddenException('자신의 타브는 구매할 수 없습니다'));

    const existing = await this.purchaseRepository.findOne({ where: { buyerId, tabId } });
    if (existing) throw new RpcException(new ConflictException('이미 구매한 타브입니다'));

    const purchase = this.purchaseRepository.create({
      buyerId,
      sellerId: tab.userId,
      tabId,
      price: tab.price,
      status: PurchaseStatus.COMPLETED,
    });
    return this.purchaseRepository.save(purchase);
  }

  async getMyPurchases(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: TabPurchase[]; total: number }> {
    const [data, total] = await this.purchaseRepository.findAndCount({
      where: { buyerId: userId },
      relations: ['tab', 'tab.user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async getMySales(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: TabPurchase[]; total: number; totalRevenue: number }> {
    const [data, total] = await this.purchaseRepository.findAndCount({
      where: { sellerId: userId, status: PurchaseStatus.COMPLETED },
      relations: ['tab', 'buyer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const revenueResult = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .select('SUM(purchase.price)', 'total')
      .where('purchase.sellerId = :userId', { userId })
      .andWhere('purchase.status = :status', { status: PurchaseStatus.COMPLETED })
      .getRawOne<{ total: string | null }>();

    const totalRevenue = revenueResult?.total ? parseInt(revenueResult.total, 10) : 0;
    return { data, total, totalRevenue };
  }

  async hasPurchased(tabId: string, userId: string): Promise<boolean> {
    const count = await this.purchaseRepository.count({ where: { buyerId: userId, tabId } });
    return count > 0;
  }
}
