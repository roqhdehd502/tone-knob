import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { BadgeService } from "./badge/badge.service";
import { CommunityService } from "./community/community.service";
import { NotificationService } from "./notification/notification.service";
import { ReviewService } from "./review/review.service";

@Controller()
export class CommunitySvcController {
  constructor(
    private readonly badgeService: BadgeService,
    private readonly communityService: CommunityService,
    private readonly notificationService: NotificationService,
    private readonly reviewService: ReviewService,
  ) {}

  // ─── 좋아요 ───

  @MessagePattern("community.toggleLike")
  async toggleLike(@Payload() data: { tabId: string; userId: string }) {
    return this.communityService.toggleLike(data.tabId, data.userId);
  }

  @MessagePattern("community.isLiked")
  async isLiked(@Payload() data: { tabId: string; userId: string }) {
    return this.communityService.isLiked(data.tabId, data.userId);
  }

  // ─── 댓글 ───

  @MessagePattern("community.createComment")
  async createComment(
    @Payload()
    data: {
      tabId: string;
      userId: string;
      dto: { content: string; parentId?: string };
    },
  ) {
    return this.communityService.createComment(
      data.tabId,
      data.userId,
      data.dto,
    );
  }

  @MessagePattern("community.getComments")
  async getComments(
    @Payload() data: { tabId: string; page?: number; limit?: number },
  ) {
    return this.communityService.getComments(data.tabId, data.page, data.limit);
  }

  @MessagePattern("community.getReplies")
  async getReplies(@Payload() data: { commentId: string }) {
    return this.communityService.getReplies(data.commentId);
  }

  @MessagePattern("community.updateComment")
  async updateComment(
    @Payload()
    data: {
      commentId: string;
      userId: string;
      dto: { content: string };
    },
  ) {
    return this.communityService.updateComment(
      data.commentId,
      data.userId,
      data.dto,
    );
  }

  @MessagePattern("community.deleteComment")
  async deleteComment(@Payload() data: { commentId: string; userId: string }) {
    return this.communityService.deleteComment(data.commentId, data.userId);
  }

  // ─── 팔로우 ───

  @MessagePattern("community.toggleFollow")
  async toggleFollow(
    @Payload() data: { followerId: string; followingId: string },
  ) {
    return this.communityService.toggleFollow(
      data.followerId,
      data.followingId,
    );
  }

  @MessagePattern("community.isFollowing")
  async isFollowing(
    @Payload() data: { followerId: string; followingId: string },
  ) {
    return this.communityService.isFollowing(data.followerId, data.followingId);
  }

  @MessagePattern("community.getFollowers")
  async getFollowers(
    @Payload() data: { userId: string; page?: number; limit?: number },
  ) {
    return this.communityService.getFollowers(
      data.userId,
      data.page,
      data.limit,
    );
  }

  @MessagePattern("community.getFollowing")
  async getFollowing(
    @Payload() data: { userId: string; page?: number; limit?: number },
  ) {
    return this.communityService.getFollowing(
      data.userId,
      data.page,
      data.limit,
    );
  }

  @MessagePattern("community.getUserStats")
  async getUserStats(@Payload() data: { userId: string }) {
    const [followerCount, followingCount] = await Promise.all([
      this.communityService.getFollowerCount(data.userId),
      this.communityService.getFollowingCount(data.userId),
    ]);
    return { followerCount, followingCount };
  }

  // ─── 알림 ───

  @MessagePattern("notification.create")
  async createNotification(
    @Payload()
    data: {
      recipientId: string;
      actorId: string;
      type: string;
      referenceId?: string;
      message: string;
    },
  ) {
    return this.notificationService.create(data as any);
  }

  @MessagePattern("notification.getByUser")
  async getNotifications(
    @Payload() data: { userId: string; page?: number; limit?: number },
  ) {
    return this.notificationService.getByUser(
      data.userId,
      data.page,
      data.limit,
    );
  }

  @MessagePattern("notification.markAsRead")
  async markAsRead(
    @Payload() data: { notificationId: string; userId: string },
  ) {
    return this.notificationService.markAsRead(
      data.notificationId,
      data.userId,
    );
  }

  @MessagePattern("notification.markAllAsRead")
  async markAllAsRead(@Payload() data: { userId: string }) {
    return this.notificationService.markAllAsRead(data.userId);
  }

  @MessagePattern("notification.unreadCount")
  async getUnreadCount(@Payload() data: { userId: string }) {
    return this.notificationService.getUnreadCount(data.userId);
  }

  @MessagePattern("notification.delete")
  async deleteNotification(
    @Payload() data: { notificationId: string; userId: string },
  ) {
    return this.notificationService.delete(data.notificationId, data.userId);
  }

  // ─── 리뷰 ───

  @MessagePattern("review.create")
  async createReview(
    @Payload()
    data: {
      tabId: string;
      userId: string;
      dto: { rating: number; content?: string };
    },
  ) {
    return this.reviewService.create(data.tabId, data.userId, data.dto);
  }

  @MessagePattern("review.getByTab")
  async getReviewsByTab(
    @Payload() data: { tabId: string; page?: number; limit?: number },
  ) {
    return this.reviewService.getByTab(data.tabId, data.page, data.limit);
  }

  @MessagePattern("review.update")
  async updateReview(
    @Payload()
    data: {
      reviewId: string;
      userId: string;
      dto: { rating?: number; content?: string };
    },
  ) {
    return this.reviewService.update(data.reviewId, data.userId, data.dto);
  }

  @MessagePattern("review.remove")
  async removeReview(@Payload() data: { reviewId: string; userId: string }) {
    return this.reviewService.remove(data.reviewId, data.userId);
  }

  @MessagePattern("review.getMyReview")
  async getMyReview(@Payload() data: { tabId: string; userId: string }) {
    return this.reviewService.getMyReview(data.tabId, data.userId);
  }

  // ─── 뱃지 ───

  @MessagePattern("badge.getAll")
  async getAllBadges() {
    return this.badgeService.getAllBadges();
  }

  @MessagePattern("badge.getUserBadges")
  async getUserBadges(@Payload() data: { userId: string }) {
    return this.badgeService.getUserBadges(data.userId);
  }

  @MessagePattern("badge.getFeatured")
  async getFeaturedBadges(@Payload() data: { userId: string }) {
    return this.badgeService.getFeaturedBadges(data.userId);
  }

  @MessagePattern("badge.award")
  async awardBadge(@Payload() data: { userId: string; badgeCode: string }) {
    return this.badgeService.awardBadge(data.userId, data.badgeCode);
  }

  @MessagePattern("badge.toggleFeatured")
  async toggleFeatured(
    @Payload() data: { userBadgeId: string; userId: string },
  ) {
    return this.badgeService.toggleFeatured(data.userBadgeId, data.userId);
  }
}
