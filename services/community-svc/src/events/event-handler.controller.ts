import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import {
  TAB_EVENTS,
  MARKETPLACE_EVENTS,
  PAYMENT_EVENTS,
  AI_EVENTS,
  SUBSCRIPTION_EVENTS,
  COMMUNITY_EVENTS,
  BADGE_EVENTS,
  KNOB_EVENTS,
  TabCreatedEvent,
  TabUpdatedEvent,
  TabDeletedEvent,
  TabPublishedEvent,
  TabForkedEvent,
  TabPurchasedEvent,
  PaymentCompletedEvent,
  AiJobCompletedEvent,
  AiJobFailedEvent,
  SubscriptionActivatedEvent,
  SubscriptionCancelledEvent,
  SubscriptionExpiredEvent,
  UserFollowedEvent,
  TabLikedEvent,
  CommentCreatedEvent,
  ReviewCreatedEvent,
  BadgeAwardedEvent,
  BadgeFeaturedChangedEvent,
  KnobEarnedEvent,
  KnobSpentEvent,
} from "@tone-knob/shared";

import { Follow } from "../entities/follow.entity";
import { Like } from "../entities/like.entity";
import { NotificationType } from "../entities/notification.entity";
import { Review } from "../entities/review.entity";
import { Tab } from "../entities/tab.entity";
import { BadgeService } from "../badge/badge.service";
import { NotificationService } from "../notification/notification.service";

@Controller()
export class EventHandlerController {
  private readonly logger = new Logger(EventHandlerController.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly badgeService: BadgeService,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(Tab)
    private readonly tabRepository: Repository<Tab>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  // ─── Helpers ───

  private async tryAwardBadge(
    userId: string,
    badgeCode: string,
  ): Promise<void> {
    try {
      await this.badgeService.awardBadge(userId, badgeCode);
      this.logger.log(`Badge awarded: ${badgeCode} → user ${userId}`);
    } catch {
      // 이미 획득했거나 뱃지 코드가 없는 경우 무시
    }
  }

  // ─── Tab Events ───

  @EventPattern(TAB_EVENTS.CREATED)
  async handleTabCreated(@Payload() data: TabCreatedEvent) {
    this.logger.log(`Tab created: ${data.tabId} by user ${data.userId}`);

    // 뱃지: 첫 타브
    const tabCount = await this.tabRepository.count({
      where: { userId: data.userId },
    });
    if (tabCount <= 1) {
      await this.tryAwardBadge(data.userId, "first_tab");
    }
    if (tabCount >= 10) {
      await this.tryAwardBadge(data.userId, "tab_master_10");
    }
    if (tabCount >= 50) {
      await this.tryAwardBadge(data.userId, "tab_master_50");
    }
  }

  @EventPattern(TAB_EVENTS.UPDATED)
  async handleTabUpdated(@Payload() data: TabUpdatedEvent) {
    this.logger.log(`Tab updated: ${data.tabId} by user ${data.userId}`);
  }

  @EventPattern(TAB_EVENTS.DELETED)
  async handleTabDeleted(@Payload() data: TabDeletedEvent) {
    this.logger.log(`Tab deleted: ${data.tabId} by user ${data.userId}`);
  }

  @EventPattern(TAB_EVENTS.PUBLISHED)
  async handleTabPublished(@Payload() data: TabPublishedEvent) {
    if (!data.isPublished) return;
    this.logger.log(`Tab published: ${data.tabId}`);

    // 뱃지: 첫 공개
    await this.tryAwardBadge(data.userId, "first_publish");

    // 팔로워에게 알림 발송
    const followers = await this.followRepository.find({
      where: { followingId: data.userId },
      select: ["followerId"],
    });

    for (const f of followers) {
      await this.notificationService.create({
        recipientId: f.followerId,
        actorId: data.userId,
        type: NotificationType.TAB_PUBLISHED,
        referenceId: data.tabId,
        message: `팔로우 중인 사용자가 새 타브를 공개했습니다: "${data.title}"`,
      });
    }
  }

  @EventPattern(TAB_EVENTS.FORKED)
  async handleTabForked(@Payload() data: TabForkedEvent) {
    this.logger.log(`Tab forked: ${data.tabId} from ${data.originalTabId}`);

    // 뱃지: 포크 입문
    await this.tryAwardBadge(data.userId, "first_fork");

    // 원본 타브 작성자에게 알림
    const originalTab = await this.tabRepository.findOne({
      where: { id: data.originalTabId },
      select: ["userId"],
    });
    if (originalTab && originalTab.userId !== data.userId) {
      await this.notificationService.create({
        recipientId: originalTab.userId,
        actorId: data.userId,
        type: NotificationType.TAB_FORKED,
        referenceId: data.originalTabId,
        message: `회원님의 타브가 포크되었습니다: "${data.title}"`,
      });
    }
  }

  // ─── Marketplace Events ───

  @EventPattern(MARKETPLACE_EVENTS.TAB_PURCHASED)
  async handleTabPurchased(@Payload() data: TabPurchasedEvent) {
    this.logger.log(`Tab purchased: ${data.tabId} by ${data.buyerId}`);
    await this.notificationService.create({
      recipientId: data.sellerId,
      actorId: data.buyerId,
      type: NotificationType.PURCHASE,
      referenceId: data.tabId,
      message: `회원님의 타브가 구매되었습니다. (${data.price.toLocaleString()}K)`,
    });

    // 뱃지: 첫 판매
    await this.tryAwardBadge(data.sellerId, "first_sale");
  }

  // ─── Payment Events ───

  @EventPattern(PAYMENT_EVENTS.COMPLETED)
  async handlePaymentCompleted(@Payload() data: PaymentCompletedEvent) {
    this.logger.log(`Payment completed: ${data.paymentId}`);
    await this.notificationService.create({
      recipientId: data.userId,
      actorId: data.userId,
      type: NotificationType.PAYMENT,
      referenceId: data.paymentId,
      message: `결제가 완료되었습니다. (₩${data.amount.toLocaleString()})`,
    });
  }

  // ─── AI Events ───

  @EventPattern(AI_EVENTS.JOB_COMPLETED)
  async handleAiJobCompleted(@Payload() data: AiJobCompletedEvent) {
    this.logger.log(`AI job completed: ${data.jobId}`);
    const typeLabel =
      data.type === "tab_generation" ? "AI 타브 생성" : "오디오 추출";
    await this.notificationService.create({
      recipientId: data.userId,
      actorId: data.userId,
      type: NotificationType.AI_JOB,
      referenceId: data.jobId,
      message: `${typeLabel} 작업이 완료되었습니다.`,
    });
  }

  @EventPattern(AI_EVENTS.JOB_FAILED)
  async handleAiJobFailed(@Payload() data: AiJobFailedEvent) {
    this.logger.log(`AI job failed: ${data.jobId}`);
    const typeLabel =
      data.type === "tab_generation" ? "AI 타브 생성" : "오디오 추출";
    await this.notificationService.create({
      recipientId: data.userId,
      actorId: data.userId,
      type: NotificationType.AI_JOB,
      referenceId: data.jobId,
      message: `${typeLabel} 작업이 실패했습니다: ${data.errorMessage}`,
    });
  }

  // ─── Subscription Events ───

  @EventPattern(SUBSCRIPTION_EVENTS.ACTIVATED)
  async handleSubscriptionActivated(
    @Payload() data: SubscriptionActivatedEvent,
  ) {
    this.logger.log(
      `Subscription activated: ${data.subscriptionId} (${data.plan})`,
    );
    // 뱃지: 프리미엄 멤버
    if (data.plan === "premium" || data.plan === "pro") {
      await this.tryAwardBadge(data.userId, "premium_member");
    }
  }

  @EventPattern(SUBSCRIPTION_EVENTS.CANCELLED)
  async handleSubscriptionCancelled(
    @Payload() data: SubscriptionCancelledEvent,
  ) {
    this.logger.log(
      `Subscription cancelled: ${data.subscriptionId} (${data.plan})`,
    );
  }

  @EventPattern(SUBSCRIPTION_EVENTS.EXPIRED)
  async handleSubscriptionExpired(@Payload() data: SubscriptionExpiredEvent) {
    this.logger.log(
      `Subscription expired: ${data.subscriptionId} (${data.plan}) for user ${data.userId}`,
    );
  }

  // ─── Community Events (내부) ───

  @EventPattern(COMMUNITY_EVENTS.USER_FOLLOWED)
  async handleUserFollowed(@Payload() data: UserFollowedEvent) {
    this.logger.log(`User followed: ${data.followerId} → ${data.followingId}`);

    // 뱃지: 첫 팔로우
    await this.tryAwardBadge(data.followerId, "first_follow");

    // 뱃지: 인플루언서 (팔로워 수 기반)
    const followerCount = await this.followRepository.count({
      where: { followingId: data.followingId },
    });
    if (followerCount >= 10) {
      await this.tryAwardBadge(data.followingId, "influencer_10");
    }
    if (followerCount >= 50) {
      await this.tryAwardBadge(data.followingId, "influencer_50");
    }
  }

  @EventPattern(COMMUNITY_EVENTS.TAB_LIKED)
  async handleTabLiked(@Payload() data: TabLikedEvent) {
    if (!data.isLiked) return;
    this.logger.log(`Tab liked: ${data.tabId} by ${data.userId}`);

    // 뱃지: 인기 타브 / 핫 타브 (좋아요 수 기반)
    const likeCount = await this.likeRepository.count({
      where: { tabId: data.tabId },
    });
    const tab = await this.tabRepository.findOne({
      where: { id: data.tabId },
      select: ["userId"],
    });
    if (tab) {
      if (likeCount >= 10) {
        await this.tryAwardBadge(tab.userId, "popular_tab");
      }
      if (likeCount >= 50) {
        await this.tryAwardBadge(tab.userId, "hot_tab");
      }
    }
  }

  @EventPattern(COMMUNITY_EVENTS.COMMENT_CREATED)
  async handleCommentCreated(@Payload() data: CommentCreatedEvent) {
    this.logger.log(`Comment created: ${data.commentId} on tab ${data.tabId}`);

    // 뱃지: 첫 댓글
    await this.tryAwardBadge(data.userId, "first_comment");
  }

  @EventPattern(COMMUNITY_EVENTS.REVIEW_CREATED)
  async handleReviewCreated(@Payload() data: ReviewCreatedEvent) {
    this.logger.log(`Review created: ${data.reviewId} on tab ${data.tabId}`);

    // 뱃지: 리뷰어 (리뷰 5개 이상)
    const reviewCount = await this.reviewRepository.count({
      where: { userId: data.userId },
    });
    if (reviewCount >= 5) {
      await this.tryAwardBadge(data.userId, "helpful_reviewer");
    }
  }

  // ─── Badge Events ───

  @EventPattern(BADGE_EVENTS.AWARDED)
  async handleBadgeAwarded(@Payload() data: BadgeAwardedEvent) {
    this.logger.log(`Badge awarded: ${data.badgeCode} → user ${data.userId}`);

    await this.notificationService.create({
      recipientId: data.userId,
      actorId: data.userId,
      type: NotificationType.BADGE_AWARDED,
      referenceId: data.userBadgeId,
      message: `새로운 뱃지를 획득했습니다: "${data.badgeName}"`,
    });
  }

  @EventPattern(BADGE_EVENTS.FEATURED_CHANGED)
  async handleBadgeFeaturedChanged(@Payload() data: BadgeFeaturedChangedEvent) {
    this.logger.log(
      `Badge featured changed: ${data.userBadgeId} → ${data.isFeatured} (user ${data.userId})`,
    );
  }

  // ─── Knob Events ───

  @EventPattern(KNOB_EVENTS.EARNED)
  async handleKnobEarned(@Payload() data: KnobEarnedEvent) {
    this.logger.log(
      `Knob earned: ${data.amount} (${data.type}) → user ${data.userId}, balance ${data.balanceAfter}`,
    );
  }

  @EventPattern(KNOB_EVENTS.SPENT)
  async handleKnobSpent(@Payload() data: KnobSpentEvent) {
    this.logger.log(
      `Knob spent: ${data.amount} (${data.type}) → user ${data.userId}, balance ${data.balanceAfter}`,
    );
  }
}
