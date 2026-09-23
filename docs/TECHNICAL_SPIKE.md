# Prism Quick Analysis Technical Spike

## Goal

Quick Reading에서 생년월일 하나만으로 실제 계산 가능한 최소 엔진을 연결한다.

## Implemented

### Saju
- lunar-javascript@1.7.7
- 년주 / 월주 / 일주
- 일간
- 6자 기준 기본 오행 개수
- 시주 제외
- 절기 경계일 경고

### Astrology
- astronomy-engine@2.1.19
- UTC 12:00 날짜 스냅샷
- Sun / Mercury / Venus / Mars ecliptic longitude와 sign
- 날짜 안에서 sign이 바뀌는 경계 여부 확인
- Quick에서는 Houses / ASC / MC 제외
- 정규화에는 우선 Sun element만 사용

### Numerology
- 생년월일 숫자 합산
- Life Path
- 11 / 22 / 33 master number 유지

### Cross Analysis
공통 Trait 7개:
- autonomy
- reflection
- stability
- sociability
- creativity
- adaptability
- care

상태:
- AGREEMENT
- COMPLEMENTARY
- DIVERGENCE
- INSUFFICIENT

핵심 상태는 LLM 자유 판단이 아니라 규칙으로 먼저 결정한다.

### Gemini
- Server-only GEMINI_API_KEY
- 기본 모델: gemini-3.8-flash
- 계산된 데이터만 전달
- JSON 응답을 해석 레이어로 사용
- 키가 없거나 호출 실패 시 deterministic fallback narrative 사용

### Supabase
- @supabase/supabase-js SDK 추가
- Browser client factory 준비
- 실제 로그인 / 결과 저장 테이블은 아직 구현하지 않음

## API

### POST /api/analyze

Body:

    { "date": "1998-05-12" }

Response:
- saju
- astrology
- numerology
- normalized traits
- cross analysis
- narrative
- warnings

### GET /api/health

환경변수 설정 여부만 반환한다. 실제 키 값은 반환하지 않는다.

## Local Validation

    git pull
    npm install
    npm run check
    npm run build
    npm run dev

그 후:
- http://localhost:3000/api/health
- POST http://localhost:3000/api/analyze

실행 전에는 PASS로 기록하지 않는다.
