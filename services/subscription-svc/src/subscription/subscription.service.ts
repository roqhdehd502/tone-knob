import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository } from "typeorm";

import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from "../entities/subscription.entity";
import { Tab } from "../entities/tab.entity";
import { User } from "../entities/user.entity";

const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 0,
  [SubscriptionPlan.PREMIUM]: 9900,
  [SubscriptionPlan.PRO]: 19900,
};

const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  [SubscriptionPlan.FREE]: ["타브 월 3회 제작", "공개 타브 열람", "합주방 무제한 참여"],
  [SubscriptionPlan.PREMIUM]: [
    "타브 무제한 제작",
    "공개 타브 열람",
    "합주방 무제한 참여",
    "고급 테크닉 표기",
    "버전 히스토리",
  ],
  [SubscriptionPlan.PRO]: [
    "Premium 기능 전부 포함",
    "AI 타브 생성",
    "마켓플레이스 판매",
    "우선 고객 지원",
    "분석 대시보드",
  ],
};

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tab)
    private readonly tabRepository: Repository<Tab>,
  ) {}

  getPlans() {
    return Object.values(SubscriptionPlan).map((plan) => ({
      plan,
      priceMonthly: PLAN_PRICES[plan],
      features: PLAN_FEATURES[plan],
    }));
  }

  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      order: { createdAt: "DESC" },
    });
  }

  async subscribe(
    userId: string,
    plan: SubscriptionPlan,
    externalPaymentId?: string,
  ): Promise<Subscription> {
    if (plan === SubscriptionPlan.FREE) {
      throw new RpcException(new ConflictException("무료 플랜은 별도 구독이 필요하지 않습니다"));
    }

    const existing = await this.getCurrentSubscription(userId);
    if (existing && existing.plan === plan) {
      throw new RpcException(new ConflictException("이미 동일한 플랜을 구독 중입니다"));
    }

    if (existing) {
      existing.status = SubscriptionStatus.CANCELLED;
      await this.subscriptionRepository.save(existing);
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = this.subscriptionRepository.create({
      userId,
      plan,
      status: SubscriptionStatus.ACTIVE,
      priceMonthly: PLAN_PRICES[plan],
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      externalPaymentId,
    });
    const saved = await this.subscriptionRepository.save(subscription);

    await this.userRepository.update(userId, { subscriptionTier: plan });

    return saved;
  }

  async cancel(userId: string): Promise<Subscription> {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription) {
      throw new RpcException(new NotFoundException("활성 구독을 찾을 수 없습니다"));
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    const saved = await this.subscriptionRepository.save(subscription);

    await this.userRepository.update(userId, {
      subscriptionTier: SubscriptionPlan.FREE,
    });

    return saved;
  }

  async canCreateTab(
    userId: string,
  ): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new RpcException(new NotFoundException("사용자를 찾을 수 없습니다"));
    }

    if ((user.subscriptionTier as string) !== (SubscriptionPlan.FREE as string)) {
      return { allowed: true, remaining: -1, limit: -1 };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const count = await this.tabRepository
      .createQueryBuilder("tab")
      .where("tab.userId = :userId", { userId })
      .andWhere("tab.createdAt >= :start", { start: startOfMonth })
      .getCount();

    const limit = 3;
    const remaining = Math.max(0, limit - count);
    return { allowed: remaining > 0, remaining, limit };
  }

  /** 만료일(currentPeriodEnd)이 지난 활성 구독을 EXPIRED로 전환하고 사용자를 FREE로 다운그레이드한다. */
  async expireOverdueSubscriptions(): Promise<Subscription[]> {
    const overdue = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: LessThan(new Date()),
      },
    });

    for (const subscription of overdue) {
      subscription.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(subscription);
      await this.userRepository.update(subscription.userId, {
        subscriptionTier: SubscriptionPlan.FREE,
      });
    }

    return overdue;
  }

  async getHistory(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Subscription[]; total: number }> {
    const [data, total] = await this.subscriptionRepository.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}
