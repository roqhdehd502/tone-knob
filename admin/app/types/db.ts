/** Supabase `users` 테이블의 행 형태 */
export type UserRow = {
  /** UUID 기본키 */
  id: string;
  /** 로그인 이메일 */
  email: string;
  /** 고유 사용자명 */
  username: string;
  /** 표시 이름 (선택) */
  displayName: string | null;
  /** 계정 역할 (`user` | `admin` | `banned`) */
  role: string;
  /** 구독 티어 (`free` | `pro` | `premium`) */
  subscriptionTier: string;
  /** 소셜 로그인 제공자 (`local` | `google` | `github` 등) */
  provider: string;
  /** 소셜 로그인 제공자 고유 ID (선택) */
  providerId: string | null;
  /** 현재 Knob 포인트 잔액 */
  knobBalance: number;
  /** 계정 생성 시각 (ISO 8601) */
  createdAt: string;
};

/** Supabase `tabs` 테이블의 행 형태 */
export type TabRow = {
  /** UUID 기본키 */
  id: string;
  /** 작성자 userId */
  userId: string;
  /** 타브 제목 */
  title: string;
  /** 아티스트명 (선택) */
  artist: string | null;
  /** 공개 여부 */
  isPublic: boolean;
  /** 조회수 */
  viewCount: number;
  /** 좋아요수 */
  likeCount: number;
  /** 다운로드수 */
  downloadCount: number;
  /** 마켓플레이스 판매 가격 (KRW) */
  price: number;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

/** Supabase `jam_rooms` 테이블의 행 형태 */
export type JamRoomRow = {
  /** UUID 기본키 */
  id: string;
  /** 방 이름 */
  name: string;
  /** 방 설명 (선택) */
  description: string | null;
  /** 방장 userId */
  hostId: string;
  /** 최대 참가 인원 */
  maxParticipants: number;
  /** 현재 참가 인원 */
  currentParticipants: number;
  /** 활성 상태 여부 */
  isActive: boolean;
  /** 비공개 여부 */
  isPrivate: boolean;
  /** 기준 BPM */
  bpm: number;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

/** Supabase `subscriptions` 테이블의 행 형태 */
export type SubscriptionRow = {
  /** UUID 기본키 */
  id: string;
  /** 구독자 userId */
  userId: string;
  /** 구독 플랜 (`pro` | `premium`) */
  plan: string;
  /** 구독 상태 (`active` | `cancelled` | `expired`) */
  status: string;
  /** 구독 시작일 (ISO 8601, 선택) */
  startDate: string | null;
  /** 구독 종료일 (ISO 8601, 선택) */
  endDate: string | null;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

/** Supabase `recordings` 테이블의 행 형태 */
export type RecordingRow = {
  /** UUID 기본키 */
  id: string;
  /** 녹음 소유자 userId */
  userId: string;
  /** 녹음 제목 (선택) */
  title: string | null;
  /** 공개 범위 (`public` | `private` | `unlisted`) */
  visibility: string;
  /** 재생 시간 (초, 선택) */
  duration: number | null;
  /** 파일 크기 (bytes, 선택) */
  fileSize: number | null;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

/** Supabase `payments` 테이블의 행 형태 */
export type PaymentRow = {
  /** UUID 기본키 */
  id: string;
  /** 결제자 userId */
  userId: string;
  /** 결제 유형 (`subscription` | `tab_purchase` | `knob`) */
  type: string;
  /** 결제 금액 */
  amount: number;
  /** 통화 코드 (e.g. `KRW`) */
  currency: string;
  /** 결제 상태 (`pending` | `completed` | `failed` | `refunded`) */
  status: string;
  /** PG사 (`portone` 등) */
  provider: string;
  /** PG사 결제 ID (선택) */
  externalPaymentId: string | null;
  /** PG사 주문 ID (선택) */
  externalOrderId: string | null;
  /** 추가 메타데이터 (선택) */
  metadata: Record<string, unknown> | null;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

/** Supabase `settlements` 테이블의 행 형태 */
export type SettlementRow = {
  /** UUID 기본키 */
  id: string;
  /** 정산 수취인 userId */
  sellerId: string;
  /** 정산 총액 */
  totalAmount: number;
  /** 플랫폼 수수료 */
  platformFee: number;
  /** 실지급액 (totalAmount - platformFee) */
  netAmount: number;
  /** 정산 상태 (`pending` | `processing` | `completed` | `failed`) */
  status: string;
  /** 정산 기간 시작일 (ISO 8601) */
  periodStart: string;
  /** 정산 기간 종료일 (ISO 8601) */
  periodEnd: string;
  /** 외부 송금 트랜잭션 ID (선택) */
  externalTransferId: string | null;
  /** 관리자 메모 (선택) */
  note: string | null;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 판매자 기본 정보 (조인 시 포함) */
  seller?: { email: string; username: string; displayName: string | null } | null;
};

/** Supabase `ai_jobs` 테이블의 행 형태 */
export type AiJobRow = {
  /** UUID 기본키 */
  id: string;
  /** 요청자 userId */
  userId: string;
  /** 작업 유형 (`tab_generation` | `audio_extraction` 등) */
  type: string;
  /** 작업 상태 (`queued` | `processing` | `completed` | `failed`) */
  status: string;
  /** 실패 시 오류 메시지 (선택) */
  errorMessage: string | null;
  /** 진행률 (0–100) */
  progress: number;
  /** 외부 워커 작업 ID (선택) */
  externalJobId: string | null;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 마지막 갱신 시각 (ISO 8601) */
  updatedAt: string;
};

/** Supabase `badges` 테이블의 행 형태 */
export type BadgeRow = {
  /** UUID 기본키 */
  id: string;
  /** 고유 코드 (e.g. `first_tab`) */
  code: string;
  /** 표시 이름 */
  name: string;
  /** 설명 (선택) */
  description: string | null;
  /** 이모지 또는 아이콘 코드 (선택) */
  icon: string | null;
  /** 배지 카테고리 (`activity` | `achievement` 등) */
  category: string;
  /** 목록 정렬 순서 */
  sortOrder: number;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

/** Supabase `knob_transactions` 테이블의 행 형태 */
export type KnobTransactionRow = {
  /** UUID 기본키 */
  id: string;
  /** 거래 대상 userId */
  userId: string;
  /** 거래 유형 (`earn` | `spend` | `admin_adjust`) */
  type: string;
  /** 거래 금액 (음수=차감, 양수=적립) */
  amount: number;
  /** 거래 후 잔액 */
  balanceAfter: number;
  /** 거래 사유 (선택) */
  description: string | null;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

/** Supabase `tab_purchases` 테이블의 행 형태 */
export type TabPurchaseRow = {
  /** UUID 기본키 */
  id: string;
  /** 구매자 userId */
  buyerId: string;
  /** 판매자 userId */
  sellerId: string;
  /** 구매한 타브 ID */
  tabId: string;
  /** 결제 금액 */
  price: number;
  /** 구매 상태 (`completed` | `refunded`) */
  status: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 구매자 기본 정보 (조인 시 포함) */
  buyer?: { email: string; username: string } | null;
  /** 타브 기본 정보 (조인 시 포함) */
  tab?: { title: string } | null;
};

/** {@link UserRow}에 집계 정보를 추가한 사용자 상세 뷰 */
export type UserDetailRow = UserRow & {
  /** 보유 타브 수 */
  tabCount: number;
  /** 획득 배지 수 */
  badgeCount: number;
};
