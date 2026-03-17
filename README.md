# Tone Knob (톤 노브)

타브 제작 + 실시간 온라인 합주 통합 플랫폼

## 프로젝트 구조

```
tone-knob/
├── frontend/        # React Router V7 (SPA) + React 19 + TypeScript + TailwindCSS v4
├── backend/         # NestJS + TypeORM + Supabase (PostgreSQL)
├── supabase/        # Supabase 마이그레이션 + 시드 데이터
└── docs/            # 기획/설계/구현 문서
```

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React 19, React Router V7, TypeScript, TailwindCSS v4, Radix UI |
| Backend | NestJS 11, TypeORM 0.3, PostgreSQL (Supabase) |
| Auth | JWT (Access 15m / Refresh 7d), bcrypt |
| Realtime | Socket.IO (협업 편집, 합주룸) |
| DB | Supabase (PostgreSQL 17, RLS 적용) |
| Deploy | Vercel (Frontend + Backend Serverless) |

## 빠른 시작

### 사전 요구사항

- Node.js 20+
- Supabase 계정 및 프로젝트

### 백엔드

```bash
cd backend
cp .env.sample .env       # 환경변수 설정
npm install
npm run start:dev         # http://localhost:3000
```

### 프론트엔드

```bash
cd frontend
cp .env.example .env      # 환경변수 설정
npm install
npm run dev               # http://localhost:5173
```

## 환경변수

자세한 내용은 각 디렉토리의 `.env.sample` / `.env.example` 참고.

| 변수 | 위치 | 설명 |
|---|---|---|
| `DATABASE_URL` | backend | Supabase Transaction Pooler URL |
| `JWT_SECRET` | backend | JWT 서명 시크릿 (64자+) |
| `FRONTEND_URL` | backend | 배포된 프론트엔드 URL (CORS) |
| `VITE_API_URL` | frontend | 배포된 백엔드 URL |

## Supabase 마이그레이션

```bash
# Supabase CLI 로그인 및 연결
supabase login
supabase link --project-ref <PROJECT_REF>

# 스키마 마이그레이션 적용
supabase db push

# 시드 데이터 주입 (Transaction Pooler URL 사용)
psql "<DATABASE_URL>" -f supabase/seed.sql
```

## 주요 기능

- **타브 편집기**: 기타/베이스 타브 악보 작성 및 공유
- **실시간 협업 편집**: WebSocket 기반 다중 사용자 동시 편집
- **합주룸**: WebRTC + Socket.IO 실시간 온라인 합주
- **마켓플레이스**: 타브 판매/구매
- **AI 타브 생성**: 오디오에서 자동 타브 추출 (ML 서버 연동)
- **구독 & 결제**: 프리미엄 플랜 관리

## Vercel 배포

[backend/README.md](./backend/README.md#vercel-배포) 및
[frontend/README.md](./frontend/README.md#vercel-배포) 참고.

> ⚠️ WebSocket 기능(합주룸, 협업 편집)은 Vercel 서버리스 환경에서 동작하지 않습니다.
> 해당 기능은 Railway / Render / Fly.io 등 상시 실행 서버 배포를 권장합니다.
