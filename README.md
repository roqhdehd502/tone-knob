# Tone Knob (톤 노브)

타브 제작 + 실시간 온라인 합주 통합 플랫폼

## 프로젝트 구조

Turborepo 기반 모노레포 — 9개 마이크로서비스 + Gateway + Frontend

```
tone-knob/
├── frontend/              # React Router V7 (SPA) + React 19 + TailwindCSS v4
├── services/
│   ├── gateway/           # HTTP API Gateway (:3000) → 각 서비스 TCP 프록시
│   ├── auth-svc/          # 인증/사용자 (TCP :3001)
│   ├── tab-svc/           # 타브 CRUD, 연습 (TCP :3002)
│   ├── jam-svc/           # 합주룸, 협업 편집, 녹음 (TCP :3003 + HTTP :3004)
│   ├── community-svc/     # 커뮤니티, 알림, 리뷰 (TCP :3005)
│   ├── marketplace-svc/   # 마켓플레이스, 결제, 정산 (TCP :3006)
│   ├── subscription-svc/  # 구독 (TCP :3007)
│   ├── media-svc/         # CDN, 지역 선택 (TCP :3008)
│   └── ai-svc/            # AI 타브 생성, 오디오 추출 (TCP :3009)
├── packages/
│   └── shared/            # 공유 DTO, 타입, 이벤트 상수
├── backend/               # ⚠️ DEPRECATED — 원본 모놀리스 (참조용)
├── supabase/              # DB 마이그레이션 + 시드 데이터
├── docs/                  # 기획/설계/구현 문서
└── docker-compose.services.yml
```

## 기술 스택

| 영역     | 기술                                                            |
| -------- | --------------------------------------------------------------- |
| Frontend | React 19, React Router V7, TypeScript, TailwindCSS v4, Radix UI |
| Backend  | NestJS 11 마이크로서비스 (TCP), TypeORM 0.3                     |
| Shared   | `@tone-knob/shared` — DTO, 이벤트 패턴/페이로드, 타입           |
| Auth     | JWT (Access 15m / Refresh 7d), bcrypt                           |
| Realtime | Socket.IO (협업 편집 `/collab`, 합주룸 `/jam`)                  |
| DB       | Supabase (PostgreSQL 17)                                        |
| Infra    | Turborepo, Docker Compose                                       |
| CI/CD    | GitHub Actions (Blue-Green Deploy)                              |

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
# 전체 서비스 + 프론트엔드 동시 기동
npm run dev:all

# 또는 개별 실행
npm run dev:services            # Gateway + 9개 마이크로서비스
cd frontend && npm run dev      # http://localhost:5173
```

### 환경변수

각 서비스 디렉토리의 `.env.sample`을 `.env`로 복사하여 설정합니다.

| 변수                      | 위치                             | 설명                    |
| ------------------------- | -------------------------------- | ----------------------- |
| `DATABASE_URL`            | 각 서비스                        | Supabase PostgreSQL URL |
| `JWT_SECRET`              | auth-svc, gateway                | JWT 서명 시크릿 (64자+) |
| `COMMUNITY_SVC_HOST/PORT` | tab-svc, marketplace-svc, ai-svc | 이벤트 발행 대상        |
| `ML_SERVER_URL`           | ai-svc                           | ML 서버 엔드포인트      |
| `VITE_API_URL`            | frontend                         | Gateway URL             |

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
- **marketplace-svc** → community-svc: 구매 완료, 결제 완료
- **ai-svc** → community-svc: AI 작업 완료/실패 → 알림 자동 생성

## 주요 기능

- **타브 편집기**: 기타/베이스 타브 악보 작성 및 공유
- **실시간 협업 편집**: WebSocket 기반 다중 사용자 동시 편집
- **합주룸**: WebRTC + Socket.IO 실시간 온라인 합주
- **마켓플레이스**: 타브 판매/구매/정산
- **AI 타브 생성**: 오디오에서 자동 타브 추출 (ML 서버 연동)
- **구독 & 결제**: 프리미엄 플랜 관리
- **커뮤니티**: 좋아요, 댓글, 팔로우, 리뷰, 알림

## Supabase 마이그레이션

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push
psql "<DATABASE_URL>" -f supabase/seed.sql
```

## Docker 배포

```bash
docker compose -f docker-compose.services.yml up -d
```

## 테스트

```bash
# 모놀리스 단위 테스트 (60개)
cd backend && npm test

# 프론트엔드 E2E (Playwright)
cd frontend && npx playwright test
```

## 문서

- [MSA 아키텍처](./docs/04_구현/02_MSA아키텍처.md) — 전체 마이크로서비스 설계 및 마이그레이션 이력
- [기획 문서](./docs/) — 요구사항, 분석, 설계, 구현 문서

> ⚠️ `backend/` 디렉토리는 **deprecated** 상태입니다. 신규 개발은 `services/` 디렉토리에서 진행하세요.
