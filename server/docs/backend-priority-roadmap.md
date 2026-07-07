# Backend PM 우선순위 로드맵

## Summary

- 백엔드 루트는 repo의 `server/` 디렉터리를 기준으로 한다.
- P0는 API 구현보다 DB 모델링과 스키마 변경 관리를 우선한다.
- Spring Boot + MySQL + Flyway + OpenAPI/Swagger를 기준으로 백엔드 MVP를 단계화한다.
- MVP에서는 닉네임 기반 임시 사용자를 사용하고, 반환된 `userId`를 클라이언트가 보관한다.

## Priority Backlog

### P0: DB 모델링 + 마이그레이션 기준 확정

- 핵심 테이블은 `users`, `rooms`, `reading_sessions`, `reading_records`로 둔다.
- 닉네임 사용자는 `POST /api/users`에서 생성하고, 반환된 `userId`를 클라이언트가 보관한다.
- Flyway로 초기 스키마와 이후 스키마 변경 이력을 관리한다.
- 페이지 범위, 세션 상태, 방 세션 시간 등 최소 검증 규칙을 DB/서비스 레벨에서 정의한다.

### P1: Spring Boot 골격 + API 계약

- Spring Boot 프로젝트를 `server/` 아래 구성한다.
- Springdoc OpenAPI/Swagger를 붙여 프론트와 공유할 API 계약을 노출한다.
- 도메인, 서비스, 컨트롤러, DTO, 예외 응답 구조를 잡는다.
- 서비스 단위 테스트를 우선 품질 게이트로 둔다.

### P2: MVP 핵심 API 구현

- 구현 대상은 사용자 생성, 방 목록/생성/상세, 세션 시작, 이탈 횟수 반영, 세션 완료, 내 기록 조회다.
- 세션 완료 시 `ReadingRecord`를 함께 저장한다.
- 완료 기록 필수값은 책 제목, 시작 페이지, 끝 페이지, 감상이다.
- 개발 환경 전용 Seed/Reset API를 제공해 프론트 시연과 QA를 지원한다.

### P3: 프론트 연동 안정화

- CORS, 환경변수, 에러 응답, 로딩/빈 응답 케이스를 프론트 P2 API 연동 기준에 맞춘다.
- Swagger 예시 요청/응답을 실제 프론트 플로우와 맞춘다.
- 데이터 초기화 API는 개발 환경에서만 활성화한다.
- 반복 사용 목표인 `14일 내 3회 세션`을 계산할 수 있도록 기록 조회 응답을 정리한다.

### P4: MVP 이후 고도화

- 1순위: 반복 사용 지표 API. 14일 내 세션 횟수, 최근 기록, 재참여 판단용 집계를 제공한다.
- 2순위: 임시 토큰 인증. `userId` 직접 전달을 줄이고 bearer token 기반 임시 인증으로 전환한다.
- 3순위: 실시간 독서방. WebSocket/SSE로 현재 참여자와 진행 상태를 제공한다.
- 이후 외부 도서 검색, 신뢰도/추천, 신고/매너 평가를 단계적으로 검토한다.

## Public Interfaces

- `POST /api/users`
- `GET /api/rooms`
- `POST /api/rooms`
- `GET /api/rooms/{roomId}`
- `POST /api/rooms/{roomId}/sessions`
- `PATCH /api/sessions/{sessionId}/leave-count`
- `POST /api/sessions/{sessionId}/complete`
- `GET /api/users/{userId}/records`

## Acceptance Criteria

- P0: Flyway 초기 스키마와 핵심 엔티티 관계가 확정된다.
- P1: Swagger에서 MVP API 계약을 확인할 수 있다.
- P2: 프론트 없이도 서비스 단위 테스트로 방 생성, 세션 시작, 세션 완료, 기록 저장을 검증할 수 있다.
- P3: 프론트 P2 연동 시 동일 플로우가 서버 데이터 기준으로 동작한다.
- P4: 반복 사용 지표와 임시 토큰 인증을 후속 백로그로 분리해 관리한다.

## Assumptions

- MVP에서는 이메일, 비밀번호, 소셜 로그인, 권한 관리를 구현하지 않는다.
- MVP에서는 `userId`를 클라이언트가 보관해 요청에 전달한다.
- 임시 토큰 인증은 후속 개선 항목으로 둔다.
- 실시간, 외부 도서 검색, 신뢰도/추천은 MVP 필수 구현에서 제외한다.
