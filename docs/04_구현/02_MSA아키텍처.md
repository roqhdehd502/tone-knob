# MSA 아키텍처 설계

> **목적**: 현재 모놀리식 백엔드(`backend/`)를 마이크로서비스 아키텍처로 단계적으로 전환하여
> 서비스 독립성, 확장성, 장애 격리를 확보한다.

---

## 1. 현재 아키텍처 분석

### 현재 구조 (Monolith)

```
tone-knob/
├── frontend/          # React SPA
└── backend/           # NestJS 모놀리스 (19개 모듈)
    └── src/
        ├── auth/
        ├── user/
        ├── tab/
        ├── jam-room/
        ├── collab/
        ├── community/
        ├── marketplace/
        ├── subscription/
        ├── payment/
        ├── settlement/
        ├── practice/
        ├── recording/
        ├── notification/
        ├── review/
        ├── ai-gen/
        ├── admin/
        ├── media/
        ├── cdn/
        └── health/
```

### 현재 구조의 문제점

| 문제             | 설명                                           |
| ---------------- | ---------------------------------------------- |
| 단일 장애점      | 한 모듈 오류가 전체 서비스 중단으로 이어짐     |
| 독립 배포 불가   | 작은 변경도 전체 재배포 필요                   |
| 기술 스택 고착   | 모든 모듈이 동일 런타임/언어에 종속            |
| 수평 확장 비효율 | AI 생성, 합주 등 고부하 기능만 스케일아웃 불가 |
| 코드 결합도      | 모듈 간 직접 import로 경계가 불분명            |

---

## 2. MSA 전환 목표

- **서비스 독립성**: 각 서비스는 독립적으로 개발·배포·확장 가능
- **장애 격리**: AI 서비스 장애가 인증/탭 서비스에 영향 없음
- **선택적 확장**: 합주룸, AI 등 고부하 서비스만 독립 스케일아웃
- **점진적 전환**: 기존 서비스 중단 없이 Strangler Fig 패턴 적용
- **명확한 도메인 경계**: DDD 기반 Bounded Context 정의

---

## 3. 서비스 분리 설계

### 3.1 Bounded Context 정의

```
┌─────────────────────────────────────────────────────────┐
│                      API Gateway                         │
│         (라우팅, 인증 검증, Rate Limiting, CORS)           │
└───────┬────────┬────────┬────────┬────────┬─────────────┘
        │        │        │        │        │
   ┌────┘   ┌────┘   ┌────┘   ┌────┘   ┌────┘
   ▼        ▼        ▼        ▼        ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Auth │ │ Tab  │ │ Jam  │ │ Comm │ │ Mkt  │
│ Svc  │ │ Svc  │ │ Svc  │ │ Svc  │ │ Svc  │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘
┌──────┐ ┌──────┐ ┌──────┐
│ Sub  │ │ Media│ │  AI  │
│ Svc  │ │ Svc  │ │ Svc  │
└──────┘ └──────┘ └──────┘
```

### 3.2 서비스별 책임 정의

| 서비스               | 포함 모듈                                              | 주요 책임                               | 포트 |
| -------------------- | ------------------------------------------------------ | --------------------------------------- | ---- |
| **gateway**          | (신규)                                                 | HTTP 라우팅, JWT 검증, Rate Limit       | 3000 |
| **auth-svc**         | Auth, User                                             | 회원가입/로그인, JWT 발급, 프로필 관리  | 3001 |
| **tab-svc**          | Tab, TabVersion, Practice                              | 타브 CRUD, 버전 관리, 연습 세션         | 3002 |
| **jam-svc**          | JamRoom, Collab, Recording                             | 합주룸, 협업 편집(WebSocket), 녹음      | 3003 |
| **community-svc**    | Community, Notification, Review, Follow, Like, Comment | 게시글, 댓글, 좋아요, 알림              | 3004 |
| **marketplace-svc**  | Marketplace, Payment, Settlement, TabPurchase          | 타브 판매/구매, 결제, 정산              | 3005 |
| **subscription-svc** | Subscription                                           | 구독 플랜 관리                          | 3006 |
| **media-svc**        | Recording, CDN, Region                                 | 미디어 파일, CDN, Mediasoup 지역 라우팅 | 3007 |
| **ai-svc**           | AiGen                                                  | AI 타브 생성, 오디오 추출, ML 서버 웹훅 | 3008 |

---

## 4. 모노레포 구조

### Turborepo + npm Workspaces

```
tone-knob/                          ← Workspace Root
├── turbo.json                      ← Turborepo 빌드 파이프라인
├── package.json                    ← npm workspaces 설정
│
├── packages/                       ← 공유 라이브러리
│   ├── shared/                     ← 공통 타입, DTO, 데코레이터
│   │   ├── src/
│   │   │   ├── dto/                ← 공통 DTO (AuthDto, UserDto, TabDto...)
│   │   │   ├── types/              ← 공통 타입, 인터페이스
│   │   │   ├── decorators/         ← 공통 데코레이터
│   │   │   ├── guards/             ← JwtAuthGuard 등 공통 Guard
│   │   │   └── index.ts
│   │   ├── package.json            ← { "name": "@tone-knob/shared" }
│   │   └── tsconfig.json
│   │
│   └── eslint-config/              ← 공통 ESLint 설정
│       └── index.mjs
│
├── services/                       ← 마이크로서비스들
│   ├── gateway/                    ← API Gateway (기존 backend/ 리팩토링)
│   ├── auth-svc/                   ← Auth + User
│   ├── tab-svc/                    ← Tab + Practice
│   ├── jam-svc/                    ← JamRoom + Collab + Recording (WebSocket)
│   ├── community-svc/              ← Community + Notification
│   ├── marketplace-svc/            ← Marketplace + Payment
│   ├── subscription-svc/           ← Subscription
│   ├── media-svc/                  ← CDN + Media
│   └── ai-svc/                     ← AI 생성
│
├── frontend/                       ← React SPA (변경 없음)
└── supabase/                       ← DB 마이그레이션 (변경 없음)
```

### 핵심 파일 구조

**`/package.json` (Workspace Root)**

```json
{
  "name": "tone-knob",
  "private": true,
  "workspaces": ["frontend", "services/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

**`/turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": { "dependsOn": ["^build"] },
    "lint": {}
  }
}
```

---

## 5. 서비스 간 통신 방식

### 5.1 통신 패턴 비교

| 방식                  | 장점                        | 단점               | 적합 케이스      |
| --------------------- | --------------------------- | ------------------ | ---------------- |
| **TCP (NestJS 기본)** | 설정 단순, 추가 인프라 없음 | 동일 네트워크 필요 | 로컬 개발        |
| **Redis Pub/Sub**     | 비동기, 느슨한 결합         | Redis 필요         | 알림, 이벤트     |
| **gRPC**              | 성능 최고, 강타입           | 설정 복잡          | 고성능 내부 통신 |
| **HTTP REST**         | 범용, 디버깅 쉬움           | 오버헤드 큼        | 외부 노출 API    |
| **NATS**              | 경량, 클라우드 친화         | 추가 인프라 필요   | 이벤트 드리븐    |

### 5.2 채택 전략

```
┌─────────────────────────────────────────────────┐
│  동기 요청-응답 (Request-Reply)                    │
│  → @nestjs/microservices TCP 또는 Redis 트랜스포터  │
│  → 예: Gateway → auth-svc.validateToken()        │
├─────────────────────────────────────────────────┤
│  비동기 이벤트 (Event-Driven)                      │
│  → Redis Pub/Sub 또는 NATS                        │
│  → 예: payment 완료 → subscription-svc 알림       │
│  → 예: tab 생성 → notification-svc 팔로워 알림    │
├─────────────────────────────────────────────────┤
│  WebSocket 실시간                                 │
│  → jam-svc 독립 서버 (Socket.IO)                 │
│  → Gateway에서 WebSocket 업그레이드 프록시           │
└─────────────────────────────────────────────────┘
```

### 5.3 NestJS Microservice 메시지 패턴 예시

```typescript
// auth-svc: 메시지 핸들러 등록
@MessagePattern('auth.validateToken')
async validateToken(@Payload() data: { token: string }) {
  return this.authService.validateJwt(data.token);
}

// gateway: auth-svc 호출
@Inject('AUTH_SERVICE') private authClient: ClientProxy;

async validateRequest(token: string) {
  return this.authClient
    .send('auth.validateToken', { token })
    .toPromise();
}
```

---

## 6. API Gateway 설계

### 6.1 역할

- **라우팅**: 요청 경로 기반 서비스 디스패치
- **인증 검증**: JWT 검증 (auth-svc 위임 또는 자체 처리)
- **Rate Limiting**: ThrottlerModule
- **CORS**: 프론트엔드 도메인 허용
- **Request ID 부여**: 분산 추적 (X-Request-ID 헤더)
- **응답 형식 통일**: 표준 응답 래퍼

### 6.2 라우팅 테이블

```
GET  /api/auth/*          → auth-svc
GET  /api/users/*         → auth-svc
GET  /api/tabs/*          → tab-svc
GET  /api/practice/*      → tab-svc
WS   /jam                 → jam-svc (WebSocket 프록시)
WS   /collab              → jam-svc (WebSocket 프록시)
GET  /api/community/*     → community-svc
GET  /api/notifications/* → community-svc
GET  /api/marketplace/*   → marketplace-svc
GET  /api/payments/*      → marketplace-svc
GET  /api/subscriptions/* → subscription-svc
GET  /api/recordings/*    → media-svc
GET  /api/ai/*            → ai-svc
GET  /api/health          → gateway 자체 헬스체크
```

---

## 7. 데이터 소유권 전략

### 7.1 DB 공유 vs 분리

초기 단계에서는 **단일 Supabase 인스턴스**를 사용하되,
각 서비스는 자신의 도메인 테이블만 직접 접근한다.

```
Supabase (단일 PostgreSQL)
├── users, refresh_tokens          → auth-svc 전용
├── tabs, tab_versions             → tab-svc 전용
├── practice_sessions              → tab-svc 전용
├── jam_rooms, jam_participants,
│   collab_sessions, collab_ops,
│   recordings                    → jam-svc 전용
├── community_posts, comments,
│   likes, follows, notifications,
│   reviews                       → community-svc 전용
├── tabs (판매 정보), tab_purchases,
│   payments, settlements         → marketplace-svc 전용
├── subscriptions                  → subscription-svc 전용
└── ai_jobs                        → ai-svc 전용
```

> **규칙**: 서비스 간 테이블 직접 JOIN 금지. 다른 도메인 데이터는 반드시 해당 서비스 API를 통해 조회.

### 7.2 향후 DB 분리 전략 (스케일 시점)

규모가 커지면 각 서비스별 별도 DB 인스턴스로 분리:

- auth-svc: 별도 PostgreSQL (사용자 데이터, 보안 중요)
- ai-svc: 별도 PostgreSQL + 오브젝트 스토리지
- jam-svc: Redis (실시간 상태) + PostgreSQL (영속 데이터)

---

## 8. 마이그레이션 전략 (Strangler Fig Pattern)

단계적으로 모놀리스에서 서비스를 추출하여 중단 없이 전환한다.

### Phase 0: 기반 설정 ✅ 완료

```
[ backend/ 모놀리스 ] ← 기존 운영 중 (점진적 축소 예정)
[ frontend/ SPA     ]
```

- [x] Turborepo + npm workspaces 설정
- [x] `packages/shared` 생성 (공통 타입, DTO)
- [x] 서비스 디렉토리 구조 생성 (`services/`)
- [x] 공통 ESLint 설정 패키지 (`packages/eslint-config`)

### Phase 1: Gateway + Auth 분리 ✅ 완료

```
[ Gateway (services/gateway/) ] ← HTTP 진입점 (:3000)
    ↓ TCP
[ auth-svc (:3001) ] ← Auth, User 분리
[ backend/ (나머지 모듈) ]      ← 점진적 축소
```

- [x] `services/gateway/` — HTTP 라우팅, JWT 로컬 검증, Rate Limiting, Swagger
- [x] `services/auth-svc/` — Auth + User 모듈 추출 (TCP 마이크로서비스)
- [x] Gateway → auth-svc TCP 통신 설정 (AUTH_SERVICE 클라이언트)
- [x] JWT 검증 로직: Gateway에서 Passport JWT 로컬 검증

### Phase 2: 핵심 도메인 분리 ✅ 완료

```
[ Gateway (:3000) ]
    ↓ TCP
[ auth-svc (:3001) ]  [ tab-svc (:3002) ]  [ jam-svc (TCP :3003 + HTTP :3004) ]
[ backend/ (remaining) ]
```

- [x] `services/tab-svc/` — Tab CRUD, TabVersion, Practice 추출 (TCP :3002)
- [x] `services/jam-svc/` — JamRoom, Collab 추출 (Hybrid: TCP :3003 + WebSocket HTTP :3004)
- [x] Gateway → tab-svc, jam-svc 프록시 컨트롤러 추가
- [x] docker-compose.services.yml 멀티서비스 설정
- [x] 각 서비스 Dockerfile 생성
- [ ] 이벤트 드리븐 통신 설정 (tab 생성 이벤트 등) — Phase 3에서 진행

### Phase 3: 부가 도메인 분리 ✅ 완료

```
[ Gateway (:3000) ]
    ↓ TCP
[ auth-svc (:3001) ]  [ tab-svc (:3002) ]  [ jam-svc (TCP :3003 + HTTP :3004) ]
[ community-svc (:3005) ]  [ marketplace-svc (:3006) ]  [ subscription-svc (:3007) ]
```

- [x] `services/community-svc/` — Like, Comment, Follow, Notification, Review (TCP :3005)
- [x] `services/marketplace-svc/` — Marketplace, Payment, Settlement (TCP :3006)
- [x] `services/subscription-svc/` — Subscription (TCP :3007)
- [x] Gateway → community-svc, marketplace-svc, subscription-svc 프록시 컨트롤러 추가
- [x] docker-compose.services.yml 7개 서비스 설정
- [x] 각 서비스 Dockerfile 생성 (총 7개)

### Phase 4: 특수 서비스 분리 ✅ 완료

```
[ Gateway (:3000) ]
    ↓ TCP
[ auth-svc (:3001) ]  [ tab-svc (:3002) ]  [ jam-svc (TCP :3003 + HTTP :3004) ]
[ community-svc (:3005) ]  [ marketplace-svc (:3006) ]  [ subscription-svc (:3007) ]
[ media-svc (:3008) ]  [ ai-svc (:3009) ]
```

- [x] `services/media-svc/` — CDN URL 변환, Region 선택/헬스체크 (TCP :3008, DB 불필요)
- [x] `services/ai-svc/` — AI 타브 생성, 오디오 추출, ML 서버 웹훅 (TCP :3009, 독립 스케일아웃 가능)
- [x] Gateway → media-svc, ai-svc 프록시 컨트롤러 추가
- [x] docker-compose.services.yml 9개 서비스 설정
- [x] 각 서비스 Dockerfile 생성 (총 9개)

### Phase 5: 마이그레이션 마무리 ✅ 완료

- [x] `@tone-knob/shared` 이벤트 상수/페이로드 타입 정의 (`events/event-patterns.ts`, `events/event-payloads.ts`)
- [x] 이벤트 발행 구현: tab-svc → `TAB_EVENTS`, marketplace-svc → `MARKETPLACE_EVENTS`/`PAYMENT_EVENTS`, ai-svc → `AI_EVENTS`
- [x] 이벤트 수신 구현: community-svc `EventHandlerController` — 알림 자동 생성 (`@EventPattern`)
- [x] 서비스 간 TCP 클라이언트 등록: tab-svc, marketplace-svc, ai-svc → `COMMUNITY_SERVICE`
- [x] `NotificationType` enum 확장 (PURCHASE, PAYMENT, AI_JOB, TAB_FORKED, TAB_PUBLISHED)
- [x] `backend/DEPRECATED.md` 추가 — 모놀리스 코드 참조용 보존, 신규 개발 금지
- [x] 전체 빌드 검증 (12 tasks 성공, 9개 서비스 dist/main.js 확인)

---

## 9. 배포 전략

### 9.1 서비스별 배포 플랫폼

| 서비스           | 플랫폼                | 이유                       |
| ---------------- | --------------------- | -------------------------- |
| frontend         | **Vercel** (정적)     | SPA 정적 파일              |
| gateway          | **Vercel** (서버리스) | HTTP-only, 상태 없음       |
| auth-svc         | **Vercel** (서버리스) | HTTP-only, 상태 없음       |
| tab-svc          | **Vercel** (서버리스) | HTTP-only                  |
| community-svc    | **Vercel** (서버리스) | HTTP-only                  |
| marketplace-svc  | **Vercel** (서버리스) | HTTP-only                  |
| subscription-svc | **Vercel** (서버리스) | HTTP-only                  |
| **jam-svc**      | **Railway / Fly.io**  | WebSocket 필요 (상시 실행) |
| **media-svc**    | **Railway / Fly.io**  | 파일 처리, 상시 실행       |
| **ai-svc**       | **Railway / Fly.io**  | ML 서버 연동, GPU 옵션     |

### 9.2 Vercel 서버리스 서비스 구조

각 서비스는 `api/index.ts` Vercel 핸들러를 가진다:

```
services/auth-svc/
├── src/               ← NestJS 소스
├── api/index.ts       ← Vercel 서버리스 진입점
└── vercel.json
```

### 9.3 서비스 간 HTTP 통신 (배포 환경)

배포 환경에서는 TCP 대신 HTTP를 사용한다 (Vercel 서버리스 제약):

```
개발환경:  @nestjs/microservices TCP (포트 기반)
배포환경:  HTTP REST (각 서비스의 internal API 호출)
```

환경 변수로 URL 주입:

```
AUTH_SERVICE_URL=https://tone-knob-auth.vercel.app
TAB_SERVICE_URL=https://tone-knob-tab.vercel.app
JAM_SERVICE_URL=https://tone-knob-jam.fly.dev
```

---

## 10. `packages/shared` 설계

### 구조

```
packages/shared/
├── src/
│   ├── dto/
│   │   ├── auth.dto.ts        ← LoginDto, RegisterDto, TokenDto
│   │   ├── user.dto.ts        ← UserDto, UpdateUserDto
│   │   ├── tab.dto.ts         ← CreateTabDto, TabResponseDto
│   │   ├── pagination.dto.ts  ← PaginationDto, PaginatedResponse
│   │   └── index.ts
│   ├── types/
│   │   ├── jwt-payload.ts     ← JwtPayload 인터페이스
│   │   ├── service-response.ts ← ServiceResponse<T> 래퍼
│   │   └── index.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── index.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── index.ts
│   └── index.ts               ← 전체 re-export
├── package.json
└── tsconfig.json
```

### 의존 규칙

```
┌─────────────────────────────────┐
│  @tone-knob/shared              │  ← NestJS 의존 없음
│  (순수 타입/DTO/인터페이스만)       │    (framework-agnostic)
└─────────────────────────────────┘
          ↑
┌─────────┴───────────────────────┐
│  services/* (각 마이크로서비스)    │  ← @tone-knob/shared 사용
└─────────────────────────────────┘
```

---

## 11. 구현 완료 현황 (Phase 0~4)

### 11.1 현재 서비스 구성 (9개)

| 서비스           | 패키지명                      | 포트                   | 트랜스포트 | 상태    |
| ---------------- | ----------------------------- | ---------------------- | ---------- | ------- |
| gateway          | `@tone-knob/gateway`          | HTTP :3000             | —          | ✅ 완료 |
| auth-svc         | `@tone-knob/auth-svc`         | TCP :3001              | TCP        | ✅ 완료 |
| tab-svc          | `@tone-knob/tab-svc`          | TCP :3002              | TCP        | ✅ 완료 |
| jam-svc          | `@tone-knob/jam-svc`          | TCP :3003 + HTTP :3004 | Hybrid     | ✅ 완료 |
| community-svc    | `@tone-knob/community-svc`    | TCP :3005              | TCP        | ✅ 완료 |
| marketplace-svc  | `@tone-knob/marketplace-svc`  | TCP :3006              | TCP        | ✅ 완료 |
| subscription-svc | `@tone-knob/subscription-svc` | TCP :3007              | TCP        | ✅ 완료 |
| media-svc        | `@tone-knob/media-svc`        | TCP :3008              | TCP        | ✅ 완료 |
| ai-svc           | `@tone-knob/ai-svc`           | TCP :3009              | TCP        | ✅ 완료 |

### 11.2 Gateway 라우팅 맵

```
/api/auth/*          → AUTH_SERVICE         (TCP :3001) — AuthProxyController
/api/users/*         → AUTH_SERVICE         (TCP :3001) — UserProxyController
/api/tabs/*          → TAB_SERVICE          (TCP :3002) — TabProxyController
/api/practice/*      → TAB_SERVICE          (TCP :3002) — PracticeProxyController
/api/jam-rooms/*     → JAM_SERVICE          (TCP :3003) — JamProxyController
WebSocket /jam       → jam-svc              (HTTP :3004) — 클라이언트 직접 연결
WebSocket /collab    → jam-svc              (HTTP :3004) — 클라이언트 직접 연결
/api/community/*     → COMMUNITY_SERVICE    (TCP :3005) — CommunityProxyController
/api/notifications/* → COMMUNITY_SERVICE    (TCP :3005) — NotificationProxyController
/api/reviews/*       → COMMUNITY_SERVICE    (TCP :3005) — ReviewProxyController
/api/marketplace/*   → MARKETPLACE_SERVICE  (TCP :3006) — MarketplaceProxyController
/api/payments/*      → MARKETPLACE_SERVICE  (TCP :3006) — PaymentProxyController
/api/settlements/*   → MARKETPLACE_SERVICE  (TCP :3006) — SettlementProxyController
/api/subscriptions/* → SUBSCRIPTION_SERVICE (TCP :3007) — SubscriptionProxyController
/api/media/*         → MEDIA_SERVICE        (TCP :3008) — MediaProxyController
/api/ai-gen/*        → AI_SERVICE           (TCP :3009) — AiProxyController
```

### 11.3 TCP MessagePattern 목록

**auth-svc (12 패턴)**

- `auth.register`, `auth.login`, `auth.refresh`, `auth.validate`
- `users.findById`, `users.update`

**tab-svc (12 패턴)**

- `tabs.create`, `tabs.findAll`, `tabs.findOne`, `tabs.update`, `tabs.remove`
- `tabs.fork`, `tabs.getVersions`, `tabs.getFeed`, `tabs.togglePublish`
- `practice.record`, `practice.stats`, `practice.recent`

**jam-svc (7 패턴)**

- `jam.create`, `jam.findAll`, `jam.findOne`, `jam.join`, `jam.leave`
- `jam.participants`, `jam.close`

**community-svc (18 패턴 + 6 이벤트)**

- `community.toggleLike`, `community.isLiked`
- `community.createComment`, `community.getComments`, `community.getReplies`, `community.updateComment`, `community.deleteComment`
- `community.toggleFollow`, `community.isFollowing`, `community.getFollowers`, `community.getFollowing`, `community.getUserStats`
- `notification.create`, `notification.getByUser`, `notification.markAsRead`, `notification.markAllAsRead`, `notification.unreadCount`, `notification.delete`
- `review.create`, `review.getByTab`, `review.update`, `review.remove`, `review.getMyReview`
- 이벤트 수신: `event.tab.created`, `event.tab.published`, `event.tab.forked`, `event.marketplace.tabPurchased`, `event.payment.completed`, `event.ai.jobCompleted`, `event.ai.jobFailed`

**marketplace-svc (11 패턴)**

- `marketplace.listPaidTabs`, `marketplace.setPrice`, `marketplace.purchase`, `marketplace.hasPurchased`, `marketplace.getMyPurchases`, `marketplace.getMySales`
- `payment.create`, `payment.confirm`, `payment.refund`, `payment.getById`, `payment.getMyPayments`
- `settlement.request`, `settlement.getMy`, `settlement.summary`

**subscription-svc (5 패턴)**

- `subscription.getPlans`, `subscription.getCurrent`, `subscription.subscribe`, `subscription.cancel`, `subscription.getHistory`

**media-svc (9 패턴)**

- `media.cdn.toCdnUrl`, `media.cdn.toOriginUrl`, `media.cdn.getSignedUrl`, `media.cdn.transformUrls`, `media.cdn.status`
- `media.region.getAll`, `media.region.select`, `media.region.getById`, `media.region.checkHealth`

**ai-svc (5 패턴)**

- `ai.createTabJob`, `ai.createExtractionJob`, `ai.getJob`, `ai.getMyJobs`, `ai.webhook`

### 11.4 개발 스크립트

```bash
npm run dev:services   # gateway + 전체 마이크로서비스 9개 동시 기동
npm run dev:all        # 위 + frontend 포함
npm run build:services # 서비스만 빌드
```

### 11.5 Docker Compose

```bash
docker compose -f docker-compose.services.yml up -d  # 전체 서비스 컨테이너 기동
```

### 코드 변경 최소화 원칙

- 기존 `backend/`는 **deprecated** 처리 (참조용 보존, 신규 개발 금지)
- `packages/shared`에 이벤트 상수·페이로드 타입 정의 (`events/` 디렉토리)
- 서비스 추출은 항상 새 디렉토리 생성 후 → 검증 → 구버전 삭제 순서
- 서비스 간 이벤트 드리븐 통신: `ClientProxy.emit()` → `@EventPattern()` (TCP 기반)

---

## 12. 트레이드오프 및 리스크

| 항목          | 리스크                                | 완화 방법                   |
| ------------- | ------------------------------------- | --------------------------- |
| 분산 트랜잭션 | 결제+구독 업데이트 원자성 보장 어려움 | Saga 패턴, 보상 트랜잭션    |
| 네트워크 지연 | 서비스 간 hop 증가                    | 캐싱, 배치 요청             |
| 운영 복잡도   | 9개 서비스 모니터링/배포 관리         | Turborepo 자동화, 중앙 로깅 |
| 개발 복잡도   | 로컬에서 여러 서비스 동시 실행        | `turbo run dev` 단일 명령   |
| 데이터 일관성 | 서비스 간 이벤트 순서 보장            | Outbox 패턴 (장기)          |

---

## 13. 참고 도구

| 도구                                                                  | 역할                          |
| --------------------------------------------------------------------- | ----------------------------- |
| [Turborepo](https://turbo.build/)                                     | 모노레포 빌드 오케스트레이션  |
| [@nestjs/microservices](https://docs.nestjs.com/microservices/basics) | NestJS 마이크로서비스 코어    |
| [NATS](https://nats.io/)                                              | 메시지 브로커 (비동기 이벤트) |
| [Redis](https://redis.io/)                                            | 세션 캐시, Pub/Sub (선택)     |
| [Fly.io](https://fly.io/)                                             | WebSocket 서비스 배포         |
| [Supabase](https://supabase.com/)                                     | 공유 PostgreSQL (초기)        |
