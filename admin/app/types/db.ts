export type UserRow = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: string;
  subscriptionTier: string;
  createdAt: string;
};

export type TabRow = {
  id: string;
  userId: string;
  title: string;
  artist: string | null;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  downloadCount: number;
  price: number;
  createdAt: string;
};

export type JamRoomRow = {
  id: string;
  name: string;
  description: string | null;
  hostId: string;
  maxParticipants: number;
  currentParticipants: number;
  isActive: boolean;
  isPrivate: boolean;
  bpm: number;
  createdAt: string;
};

export type SubscriptionRow = {
  id: string;
  userId: string;
  plan: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
};

export type RecordingRow = {
  id: string;
  userId: string;
  title: string | null;
  visibility: string;
  duration: number | null;
  fileSize: number | null;
  createdAt: string;
};

export type PaymentRow = {
  id: string;
  userId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  externalPaymentId: string | null;
  externalOrderId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type SettlementRow = {
  id: string;
  sellerId: string;
  totalAmount: number;
  platformFee: number;
  netAmount: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  externalTransferId: string | null;
  note: string | null;
  createdAt: string;
  seller?: { email: string; username: string; displayName: string | null } | null;
};

export type AiJobRow = {
  id: string;
  userId: string;
  type: string;
  status: string;
  errorMessage: string | null;
  progress: number;
  externalJobId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BadgeRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  sortOrder: number;
  createdAt: string;
};

export type KnobTransactionRow = {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
};

export type TabPurchaseRow = {
  id: string;
  buyerId: string;
  sellerId: string;
  tabId: string;
  price: number;
  status: string;
  createdAt: string;
  buyer?: { email: string; username: string } | null;
  tab?: { title: string } | null;
};

export type UserDetailRow = UserRow & {
  knobBalance: number;
  tabCount: number;
  badgeCount: number;
};
