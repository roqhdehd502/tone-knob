/**
 * 서비스 간 이벤트 페이로드 인터페이스
 */

// ─── Tab Events ───

export interface TabCreatedEvent {
  tabId: string;
  userId: string;
  title: string;
  instrument?: string;
  createdAt: string;
}

export interface TabUpdatedEvent {
  tabId: string;
  userId: string;
  title: string;
  updatedAt: string;
}

export interface TabDeletedEvent {
  tabId: string;
  userId: string;
}

export interface TabPublishedEvent {
  tabId: string;
  userId: string;
  title: string;
  isPublished: boolean;
}

export interface TabForkedEvent {
  tabId: string;
  originalTabId: string;
  userId: string;
  title: string;
}

// ─── Payment Events ───

export interface PaymentCompletedEvent {
  paymentId: string;
  userId: string;
  amount: number;
  type: "tab_purchase" | "subscription";
  referenceId: string;
}

export interface PaymentRefundedEvent {
  paymentId: string;
  userId: string;
  amount: number;
}

// ─── Marketplace Events ───

export interface TabPurchasedEvent {
  purchaseId: string;
  buyerId: string;
  sellerId: string;
  tabId: string;
  price: number;
}

export interface TabListedEvent {
  tabId: string;
  sellerId: string;
  price: number;
}

// ─── Subscription Events ───

export interface SubscriptionActivatedEvent {
  subscriptionId: string;
  userId: string;
  plan: string;
  startDate: string;
  endDate: string;
}

export interface SubscriptionExpiredEvent {
  subscriptionId: string;
  userId: string;
  plan: string;
}

export interface SubscriptionCancelledEvent {
  subscriptionId: string;
  userId: string;
  plan: string;
  cancelledAt: string;
}

// ─── AI Events ───

export interface AiJobCompletedEvent {
  jobId: string;
  userId: string;
  type: "tab_generation" | "audio_extraction";
  outputData: Record<string, unknown>;
}

export interface AiJobFailedEvent {
  jobId: string;
  userId: string;
  type: "tab_generation" | "audio_extraction";
  errorMessage: string;
}

// ─── Community Events ───

export interface UserFollowedEvent {
  followerId: string;
  followingId: string;
}

export interface TabLikedEvent {
  userId: string;
  tabId: string;
  isLiked: boolean;
}

export interface CommentCreatedEvent {
  commentId: string;
  userId: string;
  tabId: string;
  content: string;
}

export interface ReviewCreatedEvent {
  reviewId: string;
  userId: string;
  tabId: string;
  rating: number;
}

// ─── Badge Events ───

export interface BadgeAwardedEvent {
  userId: string;
  badgeCode: string;
  badgeName: string;
  userBadgeId: string;
}

export interface BadgeFeaturedChangedEvent {
  userId: string;
  userBadgeId: string;
  isFeatured: boolean;
}

// ─── Knob Events ───

export interface KnobEarnedEvent {
  userId: string;
  amount: number;
  type: string;
  balanceAfter: number;
  referenceId?: string;
}

export interface KnobSpentEvent {
  userId: string;
  amount: number;
  type: string;
  balanceAfter: number;
  referenceId?: string;
}

// ─── Jam Events ───

export interface JamParticipantJoinedEvent {
  userId: string;
  roomId: string;
}

// ─── Auth Events ───

export interface UserLoggedInEvent {
  userId: string;
}
