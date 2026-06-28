export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export enum SubscriptionTier {
  FREE = "free",
  PREMIUM = "premium",
  PRO = "pro",
}

export enum AiJobType {
  TAB_GENERATION = "tab_generation",
  AUDIO_EXTRACTION = "audio_extraction",
}

export enum AiJobStatus {
  QUEUED = "queued",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum TabDifficulty {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum PaymentType {
  SUBSCRIPTION = "subscription",
  TAB_PURCHASE = "tab_purchase",
}
