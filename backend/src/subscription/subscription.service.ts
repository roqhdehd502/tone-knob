import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { User } from '../entities/user.entity';

const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 0,
  [SubscriptionPlan.PREMIUM]: 9900,
  [SubscriptionPlan.PRO]: 19900,
};

const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  [SubscriptionPlan.FREE]: [
    '타브 3개 제작',
    '공개 타브 열람',
    '합주방 참여 (월 5회)',
  ],
  [SubscriptionPlan.PREMIUM]: [
    '타브 무제한 제작',
    '공개 타브 열람',
    '합주방 무제한 참여',
    '고급 테크닉 표기',
    '버전 히스토리',
  ],
  [SubscriptionPlan.PRO]: [
    'Premium 기능 전부 포함',
    'AI 타브 생성',
    '마켓플레이스 판매',
    '우선 고객 지원',
    '분석 대시보드',
  ],
};

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
      order: { createdAt: 'DESC' },
    });
  }

  async subscribe(
    userId: string,
    plan: SubscriptionPlan,
    externalPaymentId?: string,
  ): Promise<Subscription> {
    if (plan === SubscriptionPlan.FREE) {
      throw new ConflictException('무료 플랜은 별도 구독이 필요하지 않습니다');
    }

    const existing = await this.getCurrentSubscription(userId);
    if (existing && existing.plan === plan) {
      throw new ConflictException('이미 동일한 플랜을 구독 중입니다');
    }

    // 기존 구독이 있으면 취소 처리
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
      externalPaymentId: externalPaymentId,
    });
    const saved = await this.subscriptionRepository.save(subscription);

    // User 엔티티의 subscriptionTier 동기화
    await this.userRepository.update(userId, { subscriptionTier: plan });

    return saved;
  }

  async cancel(userId: string): Promise<Subscription> {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription) {
      throw new NotFoundException('활성 구독을 찾을 수 없습니다');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    const saved = await this.subscriptionRepository.save(subscription);

    await this.userRepository.update(userId, {
      subscriptionTier: SubscriptionPlan.FREE,
    });

    return saved;
  }

  async getHistory(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Subscription[]; total: number }> {
    const [data, total] = await this.subscriptionRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}
