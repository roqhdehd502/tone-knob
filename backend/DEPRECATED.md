# ⚠️ DEPRECATED - 모놀리스 백엔드

> **이 디렉토리는 더 이상 활성 개발에 사용되지 않습니다.**

## 마이그레이션 완료

모든 백엔드 모듈이 `services/` 디렉토리의 독립 마이크로서비스로 추출 완료되었습니다.

| 모놀리스 모듈 | 마이크로서비스 | TCP 포트 |
|---|---|---|
| AuthModule | `services/auth-svc` | :3001 |
| TabModule, PracticeModule | `services/tab-svc` | :3002 |
| JamRoomModule, CollabModule, RecordingModule | `services/jam-svc` | :3003 |
| CommunityModule, NotificationModule, ReviewModule | `services/community-svc` | :3005 |
| MarketplaceModule, PaymentModule, SettlementModule | `services/marketplace-svc` | :3006 |
| SubscriptionModule | `services/subscription-svc` | :3007 |
| CdnModule, RegionModule | `services/media-svc` | :3008 |
| AiGenModule | `services/ai-svc` | :3009 |
| (HTTP Gateway) | `services/gateway` | :3000 |

## 이 디렉토리를 유지하는 이유

- **참조용**: 원본 모놀리스 코드를 마이크로서비스 구현과 비교할 때 참고
- **테스트**: 기존 60개 단위 테스트가 포함되어 있어 로직 검증에 활용 가능
- **엔티티 스키마**: 원본 TypeORM 엔티티 정의가 DB 스키마의 단일 진실 공급원(Single Source of Truth)

## 주의사항

- 이 디렉토리의 코드를 수정하지 마세요.
- 새로운 기능은 반드시 `services/` 디렉토리의 해당 마이크로서비스에 구현하세요.
- 향후 마이크로서비스 안정화가 완료되면 이 디렉토리를 완전히 제거할 예정입니다.
