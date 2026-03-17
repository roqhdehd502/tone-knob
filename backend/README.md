# Tone Knob – Backend

NestJS 11 + TypeORM + Supabase (PostgreSQL)

## 기술 스택

- **NestJS 11** + **TypeScript**
- **TypeORM 0.3** + **PostgreSQL** (Supabase)
- **JWT** 인증 (Access 15m / Refresh 7d) + **bcrypt**
- **Socket.IO** (협업 편집 `/collab`, 합주룸 `/jam`)
- **Swagger** UI: `GET /api/docs`
- **Winston** 로거

## 로컬 실행

```bash
npm install
cp .env.sample .env   # 환경변수 설정
npm run start:dev     # http://localhost:3000
```

## 환경변수

| 변수                        | 설명                                   |
| --------------------------- | -------------------------------------- |
| `DATABASE_URL`              | Supabase Transaction Pooler URL (필수) |
| `JWT_SECRET`                | JWT 서명 시크릿 (64자 이상 권장)       |
| `JWT_ACCESS_EXPIRATION`     | Access 토큰 만료 (기본: `15m`)         |
| `JWT_REFRESH_EXPIRATION`    | Refresh 토큰 만료 (기본: `7d`)         |
| `FRONTEND_URL`              | 배포된 프론트엔드 URL (CORS 허용)      |
| `SUPABASE_URL`              | Supabase 프로젝트 URL                  |
| `SUPABASE_ANON_KEY`         | Supabase anon key                      |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key              |

자세한 내용은 `.env.sample` 참고.

## 스크립트

| 명령                 | 설명                                |
| -------------------- | ----------------------------------- |
| `npm run start:dev`  | 개발 서버 (watch 모드)              |
| `npm run start:prod` | 프로덕션 서버 (`dist/main`)         |
| `npm run build`      | TypeScript 빌드                     |
| `npm run test`       | 단위 테스트                         |
| `npm run test:cov`   | 테스트 커버리지                     |
| `npm run lint`       | ESLint 검사                         |
| `npm run lint:fix`   | ESLint 자동 수정 (import 정렬 포함) |

## API 모듈 (19개)

| 모듈               | 경로 접두사          | 설명                     |
| ------------------ | -------------------- | ------------------------ |
| AuthModule         | `/api/auth`          | 로그인/회원가입/JWT 갱신 |
| UserModule         | `/api/users`         | 프로필 조회/수정         |
| TabModule          | `/api/tabs`          | 타브 CRUD                |
| JamRoomModule      | `/api/jam-rooms`     | 합주룸 관리              |
| CommunityModule    | `/api/community`     | 커뮤니티 글/댓글         |
| NotificationModule | `/api/notifications` | 알림                     |
| ReviewModule       | `/api/reviews`       | 리뷰                     |
| MarketplaceModule  | `/api/marketplace`   | 타브 거래                |
| SubscriptionModule | `/api/subscriptions` | 구독 관리                |
| SettlementModule   | `/api/settlements`   | 정산                     |
| PracticeModule     | `/api/practice`      | 연습 세션                |
| RecordingModule    | `/api/recordings`    | 녹음                     |
| AdminModule        | `/api/admin`         | 관리자                   |
| PaymentModule      | `/api/payments`      | 결제                     |
| CollabModule       | WS `/collab`         | 실시간 협업 편집         |
| AiGenModule        | `/api/ai`            | AI 타브 생성             |
| CdnModule          | -                    | CDN URL 변환 (Global)    |
| HealthModule       | `/api/health`        | 헬스체크                 |
| RegionModule       | `/api/regions`       | 다중 지역 Mediasoup      |

## Vercel 배포

`api/index.ts`가 Vercel 서버리스 핸들러로 동작합니다.

**환경변수 (Vercel 대시보드):**

```
DATABASE_URL      = postgresql://postgres.<ref>:...@...pooler.supabase.com:6543/postgres
JWT_SECRET        = <64자 이상 랜덤 문자열>
NODE_ENV          = production
FRONTEND_URL      = https://<프론트엔드>.vercel.app
SUPABASE_URL      = https://<ref>.supabase.co
SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY = eyJ...
```

> Root Directory: `backend`로 설정 필요

> ⚠️ WebSocket(Socket.IO) 기능은 Vercel 서버리스에서 동작하지 않습니다.
