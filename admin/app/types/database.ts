import type {
  AiJobRow,
  BadgeRow,
  JamRoomRow,
  KnobTransactionRow,
  PaymentRow,
  RecordingRow,
  SettlementRow,
  SubscriptionRow,
  TabPurchaseRow,
  TabRow,
  UserRow,
} from "./db";

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Supabase `user_badges` 테이블의 행 형태 */
type UserBadgeRow = {
  id: string;
  userId: string;
  badgeId: string;
  isFeatured: boolean;
  earnedAt: string;
};

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: never[];
};

/**
 * Supabase `createClient` 제네릭 파라미터용 Database 타입.
 * 어드민에서 사용하는 모든 테이블의 Row / Insert / Update 타입을 정의한다.
 */
export type Database = {
  public: {
    Tables: {
      users: TableDef<
        UserRow,
        PartialBy<UserRow, "id" | "createdAt" | "displayName" | "role" | "subscriptionTier">,
        Partial<UserRow>
      >;
      tabs: TableDef<
        TabRow,
        PartialBy<TabRow, "id" | "createdAt" | "artist" | "viewCount" | "likeCount" | "downloadCount" | "price" | "isPublic">,
        Partial<TabRow>
      >;
      jam_rooms: TableDef<
        JamRoomRow,
        PartialBy<JamRoomRow, "id" | "createdAt" | "description" | "currentParticipants" | "isActive" | "isPrivate" | "bpm">,
        Partial<JamRoomRow>
      >;
      subscriptions: TableDef<
        SubscriptionRow,
        PartialBy<SubscriptionRow, "id" | "createdAt" | "startDate" | "endDate">,
        Partial<SubscriptionRow>
      >;
      recordings: TableDef<
        RecordingRow,
        PartialBy<RecordingRow, "id" | "createdAt" | "title" | "duration" | "fileSize">,
        Partial<RecordingRow>
      >;
      payments: TableDef<
        PaymentRow,
        PartialBy<PaymentRow, "id" | "createdAt" | "externalPaymentId" | "externalOrderId" | "metadata">,
        Partial<PaymentRow>
      >;
      settlements: TableDef<
        SettlementRow,
        PartialBy<SettlementRow, "id" | "createdAt" | "externalTransferId" | "note">,
        Partial<SettlementRow>
      >;
      ai_jobs: TableDef<
        AiJobRow,
        PartialBy<AiJobRow, "id" | "createdAt" | "updatedAt" | "errorMessage" | "progress" | "externalJobId">,
        Partial<AiJobRow>
      >;
      badges: TableDef<
        BadgeRow,
        PartialBy<BadgeRow, "id" | "createdAt" | "description" | "icon" | "sortOrder">,
        Partial<BadgeRow>
      >;
      knob_transactions: TableDef<
        KnobTransactionRow,
        PartialBy<KnobTransactionRow, "id" | "createdAt" | "description">,
        Partial<KnobTransactionRow>
      >;
      tab_purchases: TableDef<
        TabPurchaseRow,
        PartialBy<TabPurchaseRow, "id" | "createdAt">,
        Partial<TabPurchaseRow>
      >;
      user_badges: TableDef<
        UserBadgeRow,
        PartialBy<UserBadgeRow, "id" | "isFeatured" | "earnedAt">,
        Partial<UserBadgeRow>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
