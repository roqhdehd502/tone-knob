# Tone Knob – API Specification Document

## 문서 목적
Tone Knob MVP 개발을 위한 API 및 실시간 통신 구조 명세서.
백엔드/프론트엔드/리얼타임 서버 개발 기준 문서.

---

# 1. API 구조 개요

## Base URL
/api/v1

## 인증 방식
- JWT Bearer Token
- WebSocket Token Auth

---

# 2. Auth API

### POST /auth/register
Request:
- email
- password

Response:
- user_id
- token

### POST /auth/login
Request:
- email
- password

Response:
- user_id
- token

---

# 3. User API

### GET /user/me
Response:
- id
- email
- nickname
- instrument

### PUT /user/profile
Request:
- nickname
- instrument

---

# 4. Room API

### POST /room
Request:
- name
- bpm
- key
- time_signature
- sync_mode
- is_public

Response:
- room_id

### GET /room/{room_id}
Response:
- room_info
- participants

### POST /room/{room_id}/join
Response:
- session_id

### POST /room/{room_id}/leave
Response:
- success

---

# 5. Session API

### POST /session/start
Request:
- room_id

Response:
- session_id

### POST /session/end
Request:
- session_id

Response:
- success

---

# 6. Score API

### POST /score/upload
Request:
- file
- type

Response:
- score_id

### GET /score/{score_id}
Response:
- score_data

---

# 7. Sync API

### GET /sync/time
Response:
- server_time

### POST /sync/bpm
Request:
- room_id
- bpm

---

# 8. WebSocket Events

## Connection
/ws

### Events

room:join
room:leave
room:update

sync:time
sync:beat
sync:bar

score:scroll
score:page
score:highlight

---

# 9. WebRTC Signaling API

## Signaling Server
/ws/signal

### Events

signal:offer
signal:answer
signal:candidate

---

# 10. Data Models

## User
{
  id,
  email,
  nickname,
  instrument
}

## Room
{
  id,
  name,
  bpm,
  key,
  sync_mode,
  host_id
}

## Session
{
  id,
  room_id,
  start_time,
  status
}

## Score
{
  id,
  title,
  type,
  format,
  url
}

---

# 11. Error Codes

401 Unauthorized
403 Forbidden
404 Not Found
500 Server Error

---

# 12. Realtime Protocol 구조

## Sync Packet Example
{
  type: "sync",
  bpm: 120,
  beat: 3,
  bar: 12,
  timestamp: 123456789
}

---

# 문서 상태

- Version: v1.0
- Status: Draft
- Type: API Specification
- Usage: Backend / Frontend / Realtime Dev

---

Tone Knob API Specification Document End

