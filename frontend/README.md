# Tone Knob – Frontend

React Router V7 (SPA 모드) + React 19 + TypeScript + TailwindCSS v4

## 기술 스택

- **React 19** + **React Router V7** (SPA 모드)
- **TypeScript** + **Vite 7**
- **TailwindCSS v4** + **Radix UI** (shadcn 스타일 컴포넌트)
- **Socket.IO Client** (실시간 합주/협업)
- **Tone.js** (오디오 처리)
- **dnd-kit** (드래그 앤 드롭 타브 편집)

## 로컬 실행

```bash
npm install
cp .env.example .env   # VITE_API_URL 설정
npm run dev            # http://localhost:5173
```

## 환경변수

| 변수           | 기본값                  | 설명           |
| -------------- | ----------------------- | -------------- |
| `VITE_API_URL` | `http://localhost:3000` | 백엔드 API URL |

## 스크립트

| 명령                | 설명                                |
| ------------------- | ----------------------------------- |
| `npm run dev`       | 개발 서버 실행 (HMR)                |
| `npm run build`     | 프로덕션 빌드 → `build/client/`     |
| `npm run typecheck` | TypeScript 타입 검사                |
| `npm run lint`      | ESLint 검사                         |
| `npm run lint:fix`  | ESLint 자동 수정 (import 정렬 포함) |
| `npm run format`    | Prettier 포맷팅                     |

## 라우트 구조

```
/                  홈
/login             로그인
/register          회원가입
/tabs              타브 목록
/tabs/my           내 타브
/tabs/:id          타브 상세
/editor/new        새 타브 작성
/editor/:id        타브 편집
/jamroom           합주룸 목록
/jamroom/create    합주룸 생성
/jamroom/:id       합주룸 입장
/community         커뮤니티
/marketplace       마켓플레이스
/subscription      구독 관리
/dashboard         대시보드
/recordings        녹음 목록
/ai-generate       AI 타브 생성
/audio-extract     오디오 추출
/profile           프로필
/settings          설정
```

## Vercel 배포

Vercel이 자동으로 `build/client/`를 정적 파일로 서빙합니다.

**환경변수 (Vercel 대시보드):**

```
VITE_API_URL=https://<백엔드-프로젝트>.vercel.app
```

> Root Directory: `frontend`로 설정 필요
