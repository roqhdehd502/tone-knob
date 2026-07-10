# MSA 아키텍처 설계

> **목적**: 기존 모놀리식 백엔드를 마이크로서비스 아키텍처로 전환하여
> 서비스 독립성, 확장성, 장애 격리를 확보한다.
>
> ⚠️ `backend/` 디렉토리는 MSA 전환 완료 후 삭제되었습니다. 아래 “현재 구조 (Monolith)” 섹션은 전환 전 구조 기록입니다.

---

## 1. 현재 아키텍처 분석

### 전환 전 구조 (Monolith) — 삭제됨

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
├── backend/                        ← 마이크로서비스들
│   ├── gateway/                    ← API Gateway
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
  "workspaces": ["frontend", "backend/*", "packages/*"],
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
[ backend/ 모놀리스 ] ← 기존 운영 중 (점진적 축소 예정, 현재 삭제됨)
[ frontend/ SPA     ]
```

- [x] Turborepo + npm workspaces 설정
- [x] `packages/shared` 생성 (공통 타입, DTO)
- [x] 서비스 디렉토리 구조 생성 (`backend/`)
- [x] 공통 ESLint 설정 패키지 (`packages/eslint-config`)

### Phase 1: Gateway + Auth 분리 ✅ 완료

```
[ Gateway (backend/gateway/) ] ← HTTP 진입점 (:3000)
    ↓ TCP
[ auth-svc (:3001) ] ← Auth, User 분리
```

- [x] `backend/gateway/` — HTTP 라우팅, JWT 로컬 검증, Rate Limiting, Swagger
- [x] `backend/auth-svc/` — Auth + User 모듈 추출 (TCP 마이크로서비스)
- [x] Gateway → auth-svc TCP 통신 설정 (AUTH_SERVICE 클라이언트)
- [x] JWT 검증 로직: Gateway에서 Passport JWT 로컬 검증

### Phase 2: 핵심 도메인 분리 ✅ 완료

```
[ Gateway (:3000) ]
    ↓ TCP
[ auth-svc (:3001) ]  [ tab-svc (:3002) ]  [ jam-svc (TCP :3003 + HTTP :3004) ]
```

- [x] `backend/tab-svc/` — Tab CRUD, TabVersion, Practice 추출 (TCP :3002)
- [x] `backend/jam-svc/` — JamRoom, Collab 추출 (Hybrid: TCP :3003 + WebSocket HTTP :3004)
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

- [x] `backend/community-svc/` — Like, Comment, Follow, Notification, Review (TCP :3005)
- [x] `backend/marketplace-svc/` — Marketplace, Payment, Settlement (TCP :3006)
- [x] `backend/subscription-svc/` — Subscription (TCP :3007)
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

- [x] `backend/media-svc/` — CDN URL 변환, Region 선택/헬스체크 (TCP :3008, DB 불필요)
- [x] `backend/ai-svc/` — AI 타브 생성, 오디오 추출, ML 서버 웹훅 (TCP :3009, 독립 스케일아웃 가능)
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
- [x] `backend/` 디렉토리 삭제 — 전체 MSA 전환 완료 후 모놀리스 코드 제거, 근거 `package.json` workspaces에서도 제외

---

## 9. 배포 전략

### 9.1 서비스별 배포 플랫폼 (확정안)

| 서비스                    | 플랫폼                        | 이유                                                              |
| ------------------------- | ----------------------------- | ------------------------------------------------------------------ |
| frontend                  | **Vercel** (정적)             | SPA 정적 파일, `frontend/vercel.json` 기존 구비                    |
| gateway + 8개 마이크로서비스 | **OCI Free Tier ARM** (VM 1대) | 4vCPU / 24GB RAM / 영구 무료, Docker Compose로 9개 서비스 통합 운영 |

OCI 단일 VM 위에서 `docker-compose.prod.yml` 으로 모든 백엔드 컨테이너를 기동한다.
서비스 간 통신은 Docker 내부 네트워크(`internal` bridge)의 컨테이너명 DNS를 이용하며,
외부로는 Nginx(포트 80/443)만 노출한다.

```
클라이언트
  ├─ https://YOUR_DOMAIN/*       → nginx → gateway:3000  (REST API)
  └─ https://jam.YOUR_DOMAIN/*  → nginx → jam-svc:3004  (Socket.IO WebSocket)
```

또는 동일한 Dockerfile/`k8s/` 매니페스트로 **Kubernetes**(자체 호스팅/관리형) 배포도 가능 (8장 참고).

> **변경 이력**:
> - 1차 원안: HTTP-only 서비스는 Vercel 서버리스, 상시 실행 서비스는 Railway/Fly.io 분리 (9.2절 참고용으로 보존)
> - 2차 변경: gateway 제외 8개 서비스가 전부 TCP 마이크로서비스(HTTP 어댑터 없음)라 Vercel 불가 → Fly.io 단일 플랫폼으로 통일 (`fly.toml` 9개 작성)
> - 3차 변경(현재): Fly.io는 9개 컨테이너를 개별 과금하면 월 $30~$50 발생 → **OCI Free Tier ARM 단일 VM + Docker Compose** 로 전환. 기존 Dockerfile은 그대로 사용, `fly.toml` 삭제.

### 9.2 (원안, 참고용) Vercel 서버리스 서비스 구조

각 서비스에 HTTP 어댑터를 추가한다면 다음 구조였을 것이다 (현재는 미구현):

```
backend/auth-svc/
├── src/               ← NestJS 소스
├── api/index.ts       ← Vercel 서버리스 진입점 (HTTP 어댑터 필요, 미구현)
└── vercel.json
```

### 9.3 서비스 간 통신 (OCI Docker Compose 배포 환경)

개발 환경과 동일하게 TCP를 그대로 사용한다 — Docker 내부 네트워크가 컨테이너명 DNS로 인터-서비스 TCP 연결을 지원하기 때문에 코드/프로토콜 변경이 없다:

```
개발환경 (로컬/Docker Compose):  @nestjs/microservices TCP, host=컨테이너명 (auth-svc, tab-svc ...)
배포환경 (OCI Docker Compose):  @nestjs/microservices TCP, host=컨테이너명 (동일 — 환경 변수 무변경)
```

개발/프로덕션 모두 컨테이너명이 동일하므로 `.env.prod.example`의 `*_SVC_HOST` 기본값을 그대로 사용한다:

```
AUTH_SVC_HOST=auth-svc
TAB_SVC_HOST=tab-svc
JAM_SVC_HOST=jam-svc
```

### 9.4 서비스 디스커버리 및 설정 관리

별도의 서비스 레지스트리(Consul/Eureka)나 중앙 컨피그 서버(Spring Cloud Config 등)를 두지 않고,
배포 환경별로 이미 존재하는 디스커버리 메커니즘에 위임하는 **정적 디스커버리** 전략을 택했다.

| 환경                          | 디스커버리 방식                                                                     | 설정(Config) 저장소                              |
| ----------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| 로컬 개발                     | `.env`의 `*_SVC_HOST`/`*_SVC_PORT` (기본값 `localhost`)                              | 서비스별 `.env`                                    |
| Docker Compose (로컬 개발)    | Compose 네트워크의 컨테이너명 DNS (`auth-svc`, `tab-svc` ...)                         | `docker-compose.services.yml`의 `environment:`     |
| Docker Compose (OCI 프로덕션) | 동일 — `internal` bridge 네트워크 컨테이너명 DNS                                      | OCI VM의 `.env` 파일 (`docker-compose.prod.yml`이 `env_file: .env`로 읽음) |
| Kubernetes (`k8s/`)           | k8s Service의 ClusterIP DNS (`auth-svc.tone-knob.svc.cluster.local` 등, 네임스페이스 내에서는 짧은 이름으로 해석) | `ConfigMap`(`tone-knob-config`) + `Secret`(`tone-knob-secrets`) — 사실상 경량 "컨피그 서버" 역할 |

**왜 전용 서비스 레지스트리를 도입하지 않았는가**

- Kubernetes는 Service 객체 자체가 이미 DNS 기반 서비스 디스커버리이고, ConfigMap/Secret이 중앙 설정 저장소 역할을 한다 — Consul/Eureka를 추가하면 같은 문제를 이중으로 해결하는 셋이 된다.
- 인스턴스 수가 적고(서비스당 1~2 레플리카) 트래픽 기반 동적 라우팅이나 헬스 기반 자동 제외(circuit breaking 수준의 정교함)가 필요한 규모가 아니다.
- 멀티 리전/멀티 클러스터로 확장하거나, 재배포 없이 런타임에 설정을 바꿔야 하는 요구가 생기면 그때 전용 컨피그 서버(예: AWS Parameter Store/Secrets Manager, HashiCorp Vault, 또는 k8s 환경이라면 External Secrets Operator)로 전환하는 것이 적절하다 — 현재 규모에서는 과한 인프라다.

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
│  backend/* (각 마이크로서비스)    │  ← @tone-knob/shared 사용
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
- 이벤트 수신: `event.tab.created`, `event.tab.published`, `event.tab.forked`, `event.marketplace.tabPurchased`, `event.payment.completed`, `event.ai.jobCompleted`, `event.ai.jobFailed`, `event.subscription.activated`, `event.subscription.cancelled`
- 이벤트 수신 (self-loop): `event.community.userFollowed`, `event.community.tabLiked`, `event.community.commentCreated`, `event.community.reviewCreated`, `event.badge.awarded`, `event.badge.featuredChanged`, `event.knob.earned`, `event.knob.spent`

**marketplace-svc (13 패턴)**

- `marketplace.listPaidTabs`, `marketplace.setPrice`, `marketplace.purchase`, `marketplace.hasPurchased`, `marketplace.getMyPurchases`, `marketplace.getMySales`
- `payment.create`, `payment.confirm`, `payment.refund`, `payment.getById`, `payment.getMyPayments`
- `settlement.request`, `settlement.getMy`, `settlement.summary`
- `knob.getBalance`, `knob.getHistory`
- 이벤트 수신: `event.tab.created` (Knob 자동 적립), `event.jam.participantJoined` (Knob 자동 적립), `event.auth.userLoggedIn` (Knob 일일 적립)

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

- 기존 `backend/` 모놀리스는 MSA 전환 완료 후 **삭제됨** (Strangler Fig Pattern 완결)
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
| [Oracle Cloud (OCI)](https://www.oracle.com/cloud/free/)              | 백엔드 VM 배포 (Free Tier ARM) |
| [Supabase](https://supabase.com/)                                     | 공유 PostgreSQL (초기)        |
