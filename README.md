# Tone Knob (톤 노브)

타브 제작 + 실시간 온라인 합주 통합 플랫폼

## 프로젝트 구조

Turborepo 기반 모노레포 — 9개 마이크로서비스 + Gateway + Frontend

```
tone-knob/
├── frontend/              # React Router V7 (SSR) + React 19 + TailwindCSS v4 (유저 화면)
├── admin/                 # React Router V7 (SSR) + TailwindCSS v4 (관리자 패널, :3100)
├── backend/
│   ├── gateway/           # HTTP API Gateway (:3000) → 각 서비스 TCP 프록시
│   ├── auth-svc/          # 인증/사용자 (TCP :3001)
│   ├── tab-svc/           # 타브 CRUD, 연습 (TCP :3002)
│   ├── jam-svc/           # 합주룸, 협업 편집, 녹음 (TCP :3003 + WS :3004)
│   ├── community-svc/     # 커뮤니티, 알림, 리뷰, 뱃지 (TCP :3005)
│   ├── marketplace-svc/   # 마켓플레이스, 결제, 정산, Knob 재화 (TCP :3006)
│   ├── subscription-svc/  # 구독, 타브 제작 제한 (TCP :3007)
│   ├── media-svc/         # CDN, 지역 선택 (TCP :3008)
│   └── ai-svc/            # AI 타브 생성, 오디오 추출 (TCP :3009)
├── packages/
│   └── shared/            # 공유 DTO, 타입, 이벤트 상수 (@tone-knob/shared)
├── supabase/              # DB 마이그레이션 + 시드 데이터
├── docs/                  # 기획/설계/구현 문서
└── docker-compose.services.yml
```

## 기술 스택

| 영역     | 기술                                                                  |
| -------- | --------------------------------------------------------------------- |
| Frontend | React 19, React Router V7 (SSR), TypeScript, TailwindCSS v4, Radix UI |
| Backend  | NestJS 11 마이크로서비스 (TCP), TypeORM 0.3                           |
| Shared   | `@tone-knob/shared` — DTO, 이벤트 패턴/페이로드, 타입                 |
| Auth     | JWT (Access 15m / Refresh 7d), bcrypt, OAuth2 (Google, GitHub)        |
| Realtime | Socket.IO (협업 편집 `/collab`, 합주룸 `/jam`)                        |
| DB       | Supabase (PostgreSQL 17)                                              |
| Infra    | Turborepo, Docker Compose                                             |
| CI/CD    | GitHub Actions — main push → OCI SSH 자동 배포                        |

## 빠른 시작

### 사전 요구사항

- Node.js 20+
- Supabase 계정 및 프로젝트

### 설치 및 빌드

```bash
npm install                     # 루트에서 전체 의존성 설치 (워크스페이스)
npx turbo run build --force     # shared → 전체 서비스 빌드
```

### 개발 서버

```bash
# 전체 서비스 + 프론트엔드 + 관리자 패널 동시 기동
npm run dev:all

# 또는 개별 실행
npm run dev:services            # Gateway + 마이크로서비스
npm run dev:admin               # 관리자 패널만 (http://localhost:3100)
cd frontend && npm run dev      # 유저 화면만 (http://localhost:5173)
```

### 환경변수

각 서비스 디렉토리의 `.env.sample`을 `.env`로 복사하여 설정합니다.

| 변수                                         | 위치                             | 설명                                                             |
| -------------------------------------------- | -------------------------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`                               | 7개 서비스 (DB 사용)             | Supabase PostgreSQL URL (공유 DB, 독립 커넥션)                   |
| `JWT_SECRET`                                 | auth-svc, gateway, jam-svc       | JWT 서명/검증 시크릿 (동일 값 필수, 64자+)                       |
| `COMMUNITY_SVC_HOST/PORT`                    | tab-svc, marketplace-svc, ai-svc | 이벤트 발행 대상                                                 |
| `MARKETPLACE_SVC_HOST/PORT`                  | auth-svc, tab-svc, jam-svc       | 이벤트 발행 대상 (Knob 활동 기반 자동 적립)                      |
| `GOOGLE_CLIENT_ID/SECRET`                    | gateway                          | Google OAuth2 (선택, 미설정 시 비활성)                           |
| `GITHUB_CLIENT_ID/SECRET`                    | gateway                          | GitHub OAuth2 (선택, 미설정 시 비활성)                           |
| `ML_SERVER_URL`                              | ai-svc                           | ML 서버 엔드포인트 (미연결 시 더미 결과로 대체)                  |
| `GATEWAY_PUBLIC_URL`                         | ai-svc                           | ML 서버가 콜백할 Gateway 공개 주소                               |
| `ML_WEBHOOK_SECRET`                          | ai-svc, gateway                  | ML 웹훅 인증 공유 시크릿 (동일 값 필수, 선택)                    |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | media-svc                        | Supabase Storage 연동 (미설정 시 업로드 비활성)                  |
| `REDIS_URL`                                  | tab-svc                          | 타브 목록 캐싱 (30초 TTL, 연결 실패 시 캐시 없이 동작)           |
| `SENTRY_DSN`                                 | gateway                          | 에러 모니터링 (선택, 미설정 시 SDK 비활성)                       |
| `VITE_API_URL`                               | frontend                         | Gateway URL                                                      |
| `VITE_SENTRY_DSN`                            | frontend                         | 클라이언트 에러 모니터링 (선택, 미설정 시 SDK 비활성)            |
| `PORTONE_STORE_ID`                           | marketplace-svc, gateway         | PortOne V2 Store ID (`store-XXXXXXXX` 형식, 콘솔 발급 필수)      |
| `PORTONE_CHANNEL_KEY`                        | marketplace-svc, gateway         | PortOne V2 채널키 (테스트: `test_ck_...`, 실결제: `live_ck_...`) |
| `PORTONE_API_SECRET`                         | marketplace-svc                  | PortOne V2 API Secret (서버 전용, 외부 노출 금지)                |
| `PORTONE_WEBHOOK_SECRET`                     | marketplace-svc                  | PortOne 웹훅 서명 검증 시크릿 (선택, 미설정 시 검증 생략)        |

### PortOne V2 결제 설정

구독 정기결제(빌링키 발급)는 PortOne V2를 통해 처리됩니다.

1. [PortOne 콘솔](https://admin.portone.io) 로그인 후 V2 프로젝트 생성
2. **내 식별코드 · API Keys** → **V2 Store ID** 복사 (형식: `store-XXXXXXXX`)
   - ⚠️ `iamporttest_4`는 V1 가맹점 코드로 V2 SDK와 호환되지 않음
3. **결제 연동 → 채널 관리** → 테스트/실결제 채널 생성 후 채널키 복사
4. `backend/marketplace-svc/.env` 및 `backend/gateway/.env`에 `PORTONE_STORE_ID`, `PORTONE_CHANNEL_KEY` 설정
5. `backend/marketplace-svc/.env`에만 `PORTONE_API_SECRET` 설정 (서버 전용 시크릿)

### OAuth 소셜 로그인 설정

소셜 로그인은 `backend/gateway/.env`에 키를 설정해야 활성화됩니다. 미설정 시 해당 Provider 전략이 자동으로 비활성화되며, 버튼 클릭 시 500 에러가 반환됩니다.

**Google OAuth2**

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client ID (Web application) 생성
2. Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
3. `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` 설정

**GitHub OAuth2**

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Authorization callback URL: `http://localhost:3000/api/auth/github/callback`
3. `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_CALLBACK_URL` 설정

> 프로덕션 배포 시에는 callback URL을 실제 도메인으로 변경하고 OAuth App 설정에도 동일하게 등록해야 합니다.

## 서비스 아키텍처

```
Client → Frontend (:5173)
           ↓ HTTP
         Gateway (:3000)
           ↓ TCP
  ┌────────┼────────┬──────────┬───────────┬──────────┬────────┬──────────┐
auth    tab-svc  jam-svc  community  marketplace  subscription  media  ai-svc
:3001   :3002    :3003    :3005      :3006        :3007         :3008  :3009
```

### 이벤트 드리븐 통신

서비스 간 비동기 이벤트 (TCP `ClientProxy.emit()` → `@EventPattern()`):

- **tab-svc** → community-svc: 타브 생성/수정/삭제/발행/포크
- **marketplace-svc** → community-svc: 구매 완료, 결제 완료, Knob 적립/차감
- **ai-svc** → community-svc: AI 작업 완료/실패 → 알림 자동 생성
- **community-svc** → community-svc (self-loop): 좋아요/팔로우/댓글/리뷰, 뱃지 수여 → 알림 자동 생성
- **tab-svc / jam-svc / auth-svc** → marketplace-svc: 타브 제작/합주 참여/로그인 → Knob 활동 기반 자동 적립

## 주요 기능

- **타브 편집기**: 기타/베이스 타브 악보 작성 및 공유
- **실시간 협업 편집**: WebSocket 기반 다중 사용자 동시 편집
- **합주룸**: WebRTC + Socket.IO 실시간 온라인 합주
- **마켓플레이스**: Knob 내부 재화 기반 타브 판매/구매/정산 (인기순/최신순/등록순 정렬)
- **Knob 재화 시스템**: 활동 기반 마일리지 적립, 마켓플레이스 구매 수단
- **AI 타브 생성**: 오디오에서 자동 타브 추출 (ML 서버 연동)
- **구독 & 결제**: 프리미엄 플랜 관리, 무료 플랜 타브 월 3회 제작 제한
- **커뮤니티**: 좋아요, 댓글, 팔로우, 리뷰, 알림
- **뱃지 컬렉션**: 활동 기반 뱃지 획득, 대표 뱃지 설정 (최대 3개)
- **소셜 로그인**: Google, GitHub OAuth2 (선택적 활성화)
- **관리자 패널** (`/admin`, :3100): 회원·타브·합주방·구독·녹음 관리, 대시보드 통계 (Supabase service_role 직접 연결, 쿠키 세션 인증)

## DB 마이그레이션

`supabase/migrations/*.sql`은 `scripts/migrate.js`로 실행한다. `backend/marketplace-svc/.env`의 `DATABASE_URL`로 직접 접속하며,
적용 이력은 DB의 `public.schema_migrations` 테이블에 기록되어 이미 적용된 파일은 재실행 시 자동으로 건너뛴다.

```bash
# 전체 마이그레이션 일괄 실행 (파일명 순서대로, 이미 적용된 건 자동 건너뜀)
npm run migrate

# 특정 파일 1개만 선택 실행 (새 마이그레이션 파일 추가/수정 시)
npm run migrate:file -- 20240107000000_add_payment_billing_key.sql

# 시드 데이터 (선택)
psql "<DATABASE_URL>" -f supabase/seed.sql
```

실행 결과는 파일별로 ✅ 성공 / ⏭ 건너뜀(이미 적용) / ❌ 실패(에러 메시지)로 터미널에 표시되며, 실패 시 이후 순번 마이그레이션은 중단된다.

## Docker 배포

```bash
docker compose -f docker-compose.services.yml up -d
```

## Kubernetes 배포

`k8s/` 디렉토리에 9개 마이크로서비스 + Gateway + Redis용 Deployment/Service 매니페스트와 ConfigMap/Secret/Ingress가 있다.
Postgres는 Supabase(관리형)를 그대로 사용하므로 별도 매니페스트가 없다.

```bash
# 1. 각 서비스 이미지 빌드 후 사용할 레지스트리에 푸시 (예: tone-knob/auth-svc:latest)
#    docker build -f backend/auth-svc/Dockerfile -t tone-knob/auth-svc:latest .

# 2. k8s/02-secret.yaml의 CHANGE_ME 값들을 실제 값으로 교체 (DATABASE_URL, JWT_SECRET 등)

# 3. 적용
kubectl apply -f k8s/
```

- 정산(marketplace-svc)/구독 만료(subscription-svc) 자동 처리는 `@nestjs/schedule` 기반 단일 인스턴스 크론이므로
  중복 실행 방지를 위해 `replicas: 1`로 고정되어 있다 (분산 락 도입 전까지 스케일 아웃 금지).
- jam-svc의 Socket.IO(`/socket.io`)는 REST API(gateway)와 별도 HTTP 포트(3004)로 서빙되므로 Ingress에서
  경로 기반으로 분기한다 (`k8s/19-ingress.yaml`).

## OCI 배포 (백엔드) / Vercel (프론트엔드)

백엔드는 **Oracle Cloud Free Tier ARM** 인스턴스(4vCPU / 24GB) + Docker Compose로 배포한다.
PostgreSQL은 Supabase를 그대로 사용하며 VM 내 컨테이너는 Redis + 9개 마이크로서비스 + Nginx.

### 사전 작업 (OCI VM에서)

```bash
# 1. 레포 클론
git clone https://github.com/<you>/tone-knob.git /opt/tone-knob
cd /opt/tone-knob

# 2. 환경변수 파일 작성 (YOUR_DOMAIN, 시크릿 등 채워 넣기)
cp .env.prod.example .env

# 3. nginx.conf 도메인 교체
sed -i 's/YOUR_DOMAIN/실제도메인/g' nginx/nginx.conf

# 4. SSL 인증서 발급 (도메인이 이 VM을 가리키고 있어야 함)
sudo certbot certonly --standalone -d 실제도메인 -d jam.실제도메인

# 5. 빌드 및 기동
docker compose -f docker-compose.prod.yml up -d --build
```

### 트래픽 흐름

```
클라이언트
  ├─ https://YOUR_DOMAIN/*        → nginx → gateway:3000  (REST API)
  └─ https://jam.YOUR_DOMAIN/*   → nginx → jam-svc:3004  (Socket.IO WebSocket)
```

### 자동 배포 (GitHub Actions)

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 OCI VM에 자동으로 배포한다.

GitHub 레포 → **Settings → Secrets and variables → Actions** 에서 아래 4개 Secret을 등록해야 한다:

| Secret | 값 예시 | 설명 |
| --- | --- | --- |
| `OCI_SSH_HOST` | `144.xxx.xxx.xxx` | OCI VM 공개 IP |
| `OCI_SSH_USER` | `ubuntu` | SSH 접속 사용자명 |
| `OCI_SSH_PRIVATE_KEY` | `-----BEGIN OPENSSH...` | SSH 개인키 전체 내용 |
| `OCI_DEPLOY_PATH` | `/opt/tone-knob` | VM 레포 클론 경로 |

### 수동 배포 (긴급 시)

```bash
cd /opt/tone-knob
git fetch origin && git reset --hard origin/main
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
```

프론트엔드는 `frontend/vercel.json`으로 Vercel에 정적 배포한다 (`VITE_API_URL`을 `https://YOUR_DOMAIN` 으로 설정).

> **블로커**: OCI 계정 및 도메인 미확보 상태 — 인스턴스 신청 후 위 절차 적용 가능.

## 테스트

```bash
# 프론트엔드 E2E (Playwright) — webServer가 frontend 개발 서버와 MSA 백엔드 전체(dev:services)를 함께 기동한다.
# 실제 Supabase Postgres(DATABASE_URL)에 연결 가능해야 registration-flow.spec.ts 등 백엔드 연동 테스트가 통과한다.
cd frontend && npx playwright test
```

## 문서

- [MSA 아키텍처](./docs/04_구현/02_MSA아키텍처.md) — 전체 마이크로서비스 설계 및 마이그레이션 이력
- [기획 문서](./docs/) — 요구사항, 분석, 설계, 구현 문서
