import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Between, Repository } from 'typeorm';

import { Settlement, SettlementStatus } from '../entities/settlement.entity';
import { PurchaseStatus, TabPurchase } from '../entities/tab-purchase.entity';

const PLATFORM_FEE_RATE = 0.1; // 10% 수수료

@Injectable()
export class SettlementService {
  constructor(
    @InjectRepository(Settlement)
    private readonly settlementRepository: Repository<Settlement>,
    @InjectRepository(TabPurchase)
    private readonly purchaseRepository: Repository<TabPurchase>,
  ) {}

  async requestSettlement(sellerId: string): Promise<Settlement> {
    // 이번 달 기간 계산
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 이번 달 이미 정산 요청한 건이 있는지 확인
    const existing = await this.settlementRepository.findOne({
      where: {
        sellerId,
        periodStart: Between(periodStart, periodEnd),
      },
    });
    if (existing) {
      throw new ForbiddenException('이번 달 정산은 이미 요청되었습니다');
    }

    // 해당 기간 판매 합산
    const result = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .select('SUM(purchase.price)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('purchase.sellerId = :sellerId', { sellerId })
      .andWhere('purchase.status = :status', {
        status: PurchaseStatus.COMPLETED,
      })
      .andWhere('purchase.createdAt >= :start', { start: periodStart })
      .andWhere('purchase.createdAt <= :end', { end: periodEnd })
      .getRawOne<{ total: string | null; count: string }>();

    const totalAmount = result?.total ? parseInt(result.total, 10) : 0;
    if (totalAmount === 0) {
      throw new ForbiddenException('정산할 금액이 없습니다');
    }

    const platformFee = Math.round(totalAmount * PLATFORM_FEE_RATE);
    const netAmount = totalAmount - platformFee;

    const settlement = this.settlementRepository.create({
      sellerId,
      totalAmount,
      platformFee,
      netAmount,
      status: SettlementStatus.PENDING,
      periodStart,
      periodEnd,
    });

    return this.settlementRepository.save(settlement);
  }

  async getMySettlements(
    sellerId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Settlement[]; total: number }> {
    const [data, total] = await this.settlementRepository.findAndCount({
      where: { sellerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async getSummary(sellerId: string): Promise<{
    totalRevenue: number;
    totalFees: number;
    totalPaid: number;
    pendingAmount: number;
  }> {
    const completedResult = await this.settlementRepository
      .createQueryBuilder('s')
      .select('SUM(s.netAmount)', 'totalPaid')
      .addSelect('SUM(s.totalAmount)', 'totalRevenue')
      .addSelect('SUM(s.platformFee)', 'totalFees')
      .where('s.sellerId = :sellerId', { sellerId })
      .andWhere('s.status = :status', { status: SettlementStatus.COMPLETED })
      .getRawOne<{
        totalPaid: string | null;
        totalRevenue: string | null;
        totalFees: string | null;
      }>();

    const pendingResult = await this.settlementRepository
      .createQueryBuilder('s')
      .select('SUM(s.netAmount)', 'pending')
      .where('s.sellerId = :sellerId', { sellerId })
      .andWhere('s.status = :status', { status: SettlementStatus.PENDING })
      .getRawOne<{ pending: string | null }>();

    return {
      totalRevenue: completedResult?.totalRevenue
        ? parseInt(completedResult.totalRevenue, 10)
        : 0,
      totalFees: completedResult?.totalFees
        ? parseInt(completedResult.totalFees, 10)
        : 0,
      totalPaid: completedResult?.totalPaid
        ? parseInt(completedResult.totalPaid, 10)
        : 0,
      pendingAmount: pendingResult?.pending
        ? parseInt(pendingResult.pending, 10)
        : 0,
    };
  }

  // 관리자용: 정산 상태 변경
  async updateStatus(
    settlementId: string,
    status: SettlementStatus,
    externalTransferId?: string,
  ): Promise<Settlement> {
    const settlement = await this.settlementRepository.findOne({
      where: { id: settlementId },
    });
    if (!settlement) {
      throw new NotFoundException('정산 내역을 찾을 수 없습니다');
    }

    settlement.status = status;
    if (externalTransferId) {
      settlement.externalTransferId = externalTransferId;
    }
    return this.settlementRepository.save(settlement);
  }
}
