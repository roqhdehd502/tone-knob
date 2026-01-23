# Tone Knob – Development Backlog

## 문서 목적
Tone Knob MVP 개발을 위한 실행 중심 개발 태스크 백로그 문서.
실제 개발 관리(Jira/Notion/Linear) 이전 기준 구조.

---

# 구조 체계

Epic → Feature → Task → Subtask

---

# Epic 1: Project Setup & Infrastructure

## Feature 1.1: Repository & Environment Setup

### Task
- Monorepo 구조 설계
- Frontend Repo 생성
- Backend Repo 생성
- Realtime Server Repo 생성

### Subtask
- Git 구조 정의
- Branch 전략 설정
- Dev/Stage/Prod 환경 분리
- CI/CD 구조 설계

Priority: P0

---

# Epic 2: Authentication System

## Feature 2.1: Auth Core

### Task
- JWT 인증 구조
- 로그인 API
- 회원가입 API

### Subtask
- Token 발급 로직
- Refresh Token 구조
- Auth Middleware

Priority: P0

---

# Epic 3: Room System

## Feature 3.1: Room Core

### Task
- 방 생성 API
- 방 참가 API
- 방 종료 API

### Subtask
- Room Model
- 권한 구조
- Host 권한

Priority: P0

---

# Epic 4: Realtime Communication

## Feature 4.1: WebSocket Sync

### Task
- WebSocket Server 구축
- Room Event 구조
- Sync Event 구조

### Subtask
- 연결 관리
- 재연결 로직
- 이벤트 브로드캐스트

Priority: P0

---

# Epic 5: WebRTC Audio System

## Feature 5.1: WebRTC Core

### Task
- Signaling Server
- Peer Connection
- ICE Server 연동

### Subtask
- STUN/TURN 설정
- 오디오 트랙 관리
- Peer 관리

Priority: P0

---

# Epic 6: Audio Processing

## Feature 6.1: Audio Input

### Task
- 오디오 입력 캡처
- 볼륨 제어
- 뮤트 기능

### Subtask
- Gain Control
- Noise Gate
- Echo Cancel

Priority: P0

---

# Epic 7: Score System

## Feature 7.1: Score Upload

### Task
- 파일 업로드 API
- 저장소 연동

### Subtask
- 파일 검증
- 포맷 검사

Priority: P0

## Feature 7.2: Score Viewer

### Task
- 악보 렌더링
- 확대/축소
- 페이지 이동

### Subtask
- SVG 변환
- PDF 처리

Priority: P0

---

# Epic 8: Sync System

## Feature 8.1: BPM Sync

### Task
- BPM 관리
- 메트로놈 트리거

### Subtask
- 서버 타임 동기화
- 클라이언트 타이머 보정

Priority: P0

---

# Epic 9: Session UI

## Feature 9.1: Core UI

### Task
- 합주 화면 UI
- 참여자 패널
- 오디오 컨트롤 바

### Subtask
- 상태 UI
- 지연 UI

Priority: P0

---

# Epic 10: QA & Stability

## Feature 10.1: Testing

### Task
- 통합 테스트
- 부하 테스트

### Subtask
- WebRTC 테스트
- Sync 테스트

Priority: P1

---

# Sprint Structure (Example)

## Sprint 1
- Repo Setup
- Auth
- Room Core

## Sprint 2
- WebSocket
- WebRTC Signaling

## Sprint 3
- Audio Input
- Sync System

## Sprint 4
- Score System
- Core UI

## Sprint 5
- Integration
- QA

---

# 우선순위 기준

P0: MVP 필수
P1: 안정성
P2: 확장

---

# 문서 상태

- Version: v1.0
- Status: Draft
- Type: Development Backlog
- Usage: Dev Team / PM / Planning

---

Tone Knob Development Backlog Document End