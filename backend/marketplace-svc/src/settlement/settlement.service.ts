import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";

import { Settlement, SettlementStatus } from "../entities/settlement.entity";
import { PurchaseStatus, TabPurchase } from "../entities/tab-purchase.entity";

const PLATFORM_FEE_RATE = 0.1;

@Injectable()
export class SettlementService {
  constructor(
    @InjectRepository(Settlement)
    private readonly settlementRepository: Repository<Settlement>,
    @InjectRepository(TabPurchase)
    private readonly purchaseRepository: Repository<TabPurchase>,
  ) {}

  async requestSettlement(sellerId: string): Promise<Settlement> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const existing = await this.settlementRepository.findOne({
      where: { sellerId, periodStart: Between(periodStart, periodEnd) },
    });
    if (existing) {
      throw new RpcException(new ForbiddenException("이번 달 정산은 이미 요청되었습니다"));
    }

    const totalAmount = await this.calculatePeriodRevenue(sellerId, periodStart, periodEnd);
    if (totalAmount === 0) {
      throw new RpcException(new ForbiddenException("정산할 금액이 없습니다"));
    }

    return this.createSettlement(sellerId, periodStart, periodEnd, totalAmount);
  }

  /** 전월 매출에 대해 아직 정산되지 않은 판매자들의 정산을 자동 생성한다. */
  async runMonthlyAutoSettlement(): Promise<Settlement[]> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const sellers = await this.purchaseRepository
      .createQueryBuilder("purchase")
      .select("DISTINCT purchase.sellerId", "sellerId")
      .where("purchase.status = :status", { status: PurchaseStatus.COMPLETED })
      .andWhere("purchase.createdAt >= :start", { start: periodStart })
      .andWhere("purchase.createdAt <= :end", { end: periodEnd })
      .getRawMany<{ sellerId: string }>();

    const created: Settlement[] = [];
    for (const { sellerId } of sellers) {
      const existing = await this.settlementRepository.findOne({
        where: { sellerId, periodStart: Between(periodStart, periodEnd) },
      });
      if (existing) continue;

      const totalAmount = await this.calculatePeriodRevenue(sellerId, periodStart, periodEnd);
      if (totalAmount === 0) continue;

      created.push(await this.createSettlement(sellerId, periodStart, periodEnd, totalAmount));
    }
    return created;
  }

  private async calculatePeriodRevenue(
    sellerId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number> {
    const result = await this.purchaseRepository
      .createQueryBuilder("purchase")
      .select("SUM(purchase.price)", "total")
      .where("purchase.sellerId = :sellerId", { sellerId })
      .andWhere("purchase.status = :status", { status: PurchaseStatus.COMPLETED })
      .andWhere("purchase.createdAt >= :start", { start: periodStart })
      .andWhere("purchase.createdAt <= :end", { end: periodEnd })
      .getRawOne<{ total: string | null }>();

    return result?.total ? parseInt(result.total, 10) : 0;
  }

  private async createSettlement(
    sellerId: string,
    periodStart: Date,
    periodEnd: Date,
    totalAmount: number,
  ): Promise<Settlement> {
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
      order: { createdAt: "DESC" },
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
      .createQueryBuilder("s")
      .select("SUM(s.netAmount)", "totalPaid")
      .addSelect("SUM(s.totalAmount)", "totalRevenue")
      .addSelect("SUM(s.platformFee)", "totalFees")
      .where("s.sellerId = :sellerId", { sellerId })
      .andWhere("s.status = :status", { status: SettlementStatus.COMPLETED })
      .getRawOne<{
        totalPaid: string | null;
        totalRevenue: string | null;
        totalFees: string | null;
      }>();

    const pendingResult = await this.settlementRepository
      .createQueryBuilder("s")
      .select("SUM(s.netAmount)", "pending")
      .where("s.sellerId = :sellerId", { sellerId })
      .andWhere("s.status = :status", { status: SettlementStatus.PENDING })
      .getRawOne<{ pending: string | null }>();

    return {
      totalRevenue: completedResult?.totalRevenue ? parseInt(completedResult.totalRevenue, 10) : 0,
      totalFees: completedResult?.totalFees ? parseInt(completedResult.totalFees, 10) : 0,
      totalPaid: completedResult?.totalPaid ? parseInt(completedResult.totalPaid, 10) : 0,
      pendingAmount: pendingResult?.pending ? parseInt(pendingResult.pending, 10) : 0,
    };
  }

  async updateStatus(
    settlementId: string,
    status: SettlementStatus,
    externalTransferId?: string,
  ): Promise<Settlement> {
    const settlement = await this.settlementRepository.findOne({ where: { id: settlementId } });
    if (!settlement) throw new RpcException(new NotFoundException("정산 내역을 찾을 수 없습니다"));

    settlement.status = status;
    if (externalTransferId) settlement.externalTransferId = externalTransferId;
    return this.settlementRepository.save(settlement);
  }
}
