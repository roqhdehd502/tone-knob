# Tone Knob – UX Wireframe Document

## 문서 목적
본 문서는 Tone Knob MVP의 사용자 경험(UX) 구조와 화면 흐름을 정의하는 문서이다.
디자인, 프론트엔드 개발, 기획 기준 문서로 사용된다.

---

# 1. UX 설계 철학

### 핵심 원칙
1. 음악 중심 UX
2. 합주 중심 구조
3. 악보 중심 화면 구조
4. 방 기반 협업 구조
5. 실시간성 우선 설계

---

# 2. 사용자 플로우

[Landing]
 → [Login]
 → [Dashboard]
 → [Create Room / Join Room]
 → [Room Lobby]
 → [Instrument Setup]
 → [Score Setup]
 → [Sync Setup]
 → [Session Room]

---

# 3. 화면 구조 정의

## 3.1 Landing
구성요소:
- 서비스 소개
- 핵심 가치 제시
- 시작하기 버튼

---

## 3.2 Login
구성요소:
- 이메일 로그인
- 회원가입

---

## 3.3 Dashboard
구성요소:
- 내 방 목록
- 참여 이력
- 방 생성 버튼

---

## 3.4 Create Room
필드:
- 방 이름
- BPM
- Key
- Time Signature
- Sync Mode
- 공개/비공개

---

## 3.5 Room Lobby
구성요소:
- 참여자 리스트
- 악기 표시
- 상태 표시(연결/지연)
- Start Session 버튼

---

## 3.6 Instrument Setup
구성요소:
- 오디오 입력 장치 선택
- 볼륨 테스트
- 레이턴시 테스트
- 메트로놈 테스트

---

## 3.7 Score Setup
구성요소:
- 악보 업로드
- 악보 선택
- 악보 타입 선택(Staff/TAB)

---

## 3.8 Sync Setup
구성요소:
- BPM 확인
- 메트로놈 동기화
- 지연 보정 설정

---

## 3.9 Session Room (Core Screen)

레이아웃 구조:

┌──────────────────────────────┐
│ Header (Room Info / Controls)│
├──────────────┬───────────────┤
│ Score View   │ Participant   │
│ (Highlight)  │ Panel         │
├──────────────┴───────────────┤
│ Audio Control Bar            │
├──────────────────────────────┤
│ Sync Bar (BPM / Metronome)   │
└──────────────────────────────┘

---

# 4. 핵심 UX 요소

## 악보 중심 UX
- 중앙 고정 Score Viewer
- 자동 스크롤
- 하이라이트 표시

## 실시간성 UX
- 상태 표시
- 지연 표시
- 연결 품질 표시

## 협업 UX
- 파트 표시
- 실시간 상태 표시
- 참여자 인터랙션

---

# 5. 인터랙션 정의

## Score Interaction
- 확대/축소
- 스크롤
- 페이지 이동

## Audio Interaction
- 볼륨 조절
- 뮤트
- 개인 음소거

## Room Interaction
- 초대 링크
- 참가자 관리

---

# 6. UX 우선순위

P0:
- 합주 화면 구조
- 악보 뷰어
- 오디오 제어

P1:
- 상태 UI
- 가이드 UI

P2:
- 시각화 요소
- 애니메이션

---

# 7. 접근성 고려

- 키보드 접근성
- 색상 대비
- 가독성 중심 디자인

---

# 문서 상태

- Version: v1.0
- Status: Draft
- Type: UX Wireframe
- Usage: Design / Frontend / Planning

---

Tone Knob UX Wireframe Document End

