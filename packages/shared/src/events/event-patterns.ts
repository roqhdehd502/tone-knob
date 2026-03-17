/**
 * 서비스 간 이벤트 패턴 상수
 * NestJS @EventPattern / ClientProxy.emit() 에서 사용
 */

// ─── Tab Events (tab-svc → community-svc) ───
export const TAB_EVENTS = {
  CREATED: 'event.tab.created',
  UPDATED: 'event.tab.updated',
  DELETED: 'event.tab.deleted',
  PUBLISHED: 'event.tab.published',
  FORKED: 'event.tab.forked',
} as const;

// ─── Payment Events (marketplace-svc → subscription-svc, community-svc) ───
export const PAYMENT_EVENTS = {
  COMPLETED: 'event.payment.completed',
  REFUNDED: 'event.payment.refunded',
} as const;

// ─── Marketplace Events (marketplace-svc → community-svc) ───
export const MARKETPLACE_EVENTS = {
  TAB_PURCHASED: 'event.marketplace.tabPurchased',
  TAB_LISTED: 'event.marketplace.tabListed',
} as const;

// ─── Subscription Events (subscription-svc → community-svc) ───
export const SUBSCRIPTION_EVENTS = {
  ACTIVATED: 'event.subscription.activated',
  CANCELLED: 'event.subscription.cancelled',
} as const;

// ─── AI Events (ai-svc → tab-svc, community-svc) ───
export const AI_EVENTS = {
  JOB_COMPLETED: 'event.ai.jobCompleted',
  JOB_FAILED: 'event.ai.jobFailed',
} as const;

// ─── Community Events (community-svc 내부 / → 기타 서비스) ───
export const COMMUNITY_EVENTS = {
  USER_FOLLOWED: 'event.community.userFollowed',
  TAB_LIKED: 'event.community.tabLiked',
  COMMENT_CREATED: 'event.community.commentCreated',
  REVIEW_CREATED: 'event.community.reviewCreated',
} as const;
