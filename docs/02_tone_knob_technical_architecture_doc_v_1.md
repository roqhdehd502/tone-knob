# Tone Knob – Technical Architecture Document (TAD)

## 문서 목적

본 문서는 Tone Knob MVP 개발을 위한 기술 설계 기준 문서이다.
개발, 인프라, 협업, 확장성을 모두 고려한 구조를 정의한다.

---

# 1. 전체 시스템 아키텍처

## 시스템 구조 개요

[Web Client]

- Audio Input
- Score Viewer
- Room UI
- Sync UI
- Instrument Setup

        ↓

[Realtime Layer]

- WebRTC (Audio Stream)
- WebSocket (Sync / Control)
- Signaling Server
- Latency Controller

        ↓

[Backend Core]

- Auth Server
- Room Server
- Session Manager
- Score Server
- API Gateway

        ↓

[Infrastructure]

- DB Server
- Cache Server
- Storage Server
- AI Processing Queue

---

# 2. Frontend Architecture

## 기술 스택

- Front-end: React Router 7 (React 19.x)
- Backend: NestJS
- Audio: Web Audio API + AudioWorklet
- Realtime: WebRTC + WebSocket
- Rendering: SVG / Canvas

## 구조

- UI Layer
- Audio Layer
- Sync Layer
- Network Layer

### Audio Layer

- Input Capture
- Gain Control
- Noise Gate
- Echo Cancel
- Output Mix

---

# 3. Realtime Architecture

## WebRTC 구조

Client A ⇄ Signaling Server ⇄ Client B

- ICE Server
- STUN/TURN
- Peer Connection
- Audio Stream Track

## WebSocket 구조

- Room Events
- Sync Events
- Score Events
- Control Events

---

# 4. Backend Architecture

## Core Services

- Auth Service
- Room Service
- Session Service
- Score Service
- Sync Service

## API 구조

/api/auth
/api/room
/api/session
/api/score
/api/sync

---

# 5. Data Architecture

## User

id
email
nickname
instrument
audio_profile

## Room

id
host_id
bpm
key
mode
sync_mode
score_id

## Session

id
room_id
start_time
status

## Score

id
title
type
format
bpm
storage_url

---

# 6. Sync Architecture

## Sync 방식

- Master Clock: Server
- Client Clock Sync
- BPM Based Sync
- Metronome Trigger

## Sync Flow

Server Time
→ Client Time Sync
→ BPM Tick
→ Beat Event
→ UI Sync
→ Score Sync

---

# 7. Latency Handling

## 구조

- Client Latency Measure
- Adaptive Buffer
- Time Offset Compensation
- Predictive Playback

---

# 8. Infrastructure Architecture

## 서버 구조

- API Server Cluster
- Realtime Server Cluster
- Media Server
- AI Worker Node

## 저장소

- PostgreSQL
- Redis
- Object Storage(S3)

---

# 9. AI 확장 구조 (Future)

## Pipeline

Audio Input
→ Preprocess
→ Stem Separation
→ Pitch Detection
→ Chord Detection
→ Rhythm Analysis
→ Score Generation

---

# 10. 보안 구조

- JWT Auth
- HTTPS
- Secure WebSocket
- Media Encryption

---

# 11. 확장 전략

## Scale Out

- Multi Region Server
- CDN
- Edge Processing

## Feature Expansion

- Virtual Instrument
- AI Score Generation
- Recording System
- Education Mode

---

# 12. 기술 리스크 관리

| 리스크      | 대응        |
| ----------- | ----------- |
| 레이턴시    | BPM Sync    |
| 오디오 품질 | WebRTC QoS  |
| 서버 부하   | 분산 구조   |
| AI 정확도   | 단계적 도입 |

---

# 문서 상태

- Version: v1.0
- Status: Draft
- Type: Technical Architecture
- Usage: 개발 기준 문서

---

Tone Knob Technical Architecture Document End
