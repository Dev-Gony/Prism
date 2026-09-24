# Prism

> 여러 관점으로 나를 보다.

Prism은 사용자의 생년월일을 바탕으로 **사주·서양 점성술·수비학**을 각각 계산하고, 세 체계의 공통점·보완점·차이점을 하나의 흐름으로 보여주는 자기이해 서비스입니다.

핵심 원칙은 **계산과 설명을 분리하는 것**입니다. 계산 가능한 값은 코드와 도메인 엔진이 만들고, LLM은 계산된 사실을 바탕으로 설명·요약·교차 해석만 담당합니다.

## Current Status

현재는 **핵심 기능 구현이 진행된 Active Development 단계**입니다.

구현된 주요 기능:

- Quick Reading / Detailed Reading
- 사주 계산 및 십신·지장간·합충형파해 분석
- 서양 점성술 10 Planets / ASC / MC / Whole Sign Houses / 주요 Aspect
- 수비학 Life Path 및 Personal Cycle, 선택형 Name Numerology
- 사주·점성술·수비학 Cross Analysis
- Destiny Timeline 연/분기/월 탐색
- Transit motion / applying·separating / exact-window 탐색
- Solar Return 계산 및 장소 기반 ASC / House
- Google OAuth + Supabase 저장/아카이브
- Quick → Detailed 확장, 저장 결과 재분석
- Detailed 결과 기반 Ask Prism
- 공유 카드, 타임라인 보기, 저장 리포트 비교
- 제품 이벤트 / 피드백 수집

아직 계산 기준값 검증과 전체 Production Regression은 계속 진행 중입니다.

## Architecture

```text
Birth Input
   |
   +--> Saju Engine
   |
   +--> Astrology Engine
   |
   +--> Numerology Engine
   |
   v
Normalized Interpretation
   |
   v
Cross Analysis
   |
   +--> Deterministic Result
   |
   +--> Gemini Narrative / Q&A
   |
   v
Save / Archive / Timeline
```

## LLM Boundary

Prism에서 LLM은 계산기가 아닙니다.

- 사주 계산은 코드와 도메인 로직이 수행합니다.
- 천문·점성술 위치 계산은 `astronomy-engine`을 사용합니다.
- 수비학 숫자는 코드로 계산합니다.
- Gemini는 계산된 사실의 설명, 교차 해석, 후속 질문을 담당합니다.
- 입력 정보가 없으면 시간 의존 값을 임의로 추정하지 않습니다.

## Product Flow

### Quick Reading

생년월일만으로 가능한 범위의 세 체계를 분석합니다.

- 핵심 키워드
- 강점 / 관계 스타일 / 일하는 방식
- 세 체계의 공통점과 차이
- 분석 근거

### Detailed Reading

출생시간과 출생지역을 추가하면 시간·위치 의존 계산을 확장합니다.

- 시주
- Moon / ASC / MC
- Whole Sign Houses
- 주요 행성 House
- Detailed Cross Analysis
- Destiny Timeline
- Solar Return
- AI 후속 질문

출생시간을 모르는 경우에는 시간 의존 항목을 추정하지 않고 제외합니다.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Supabase Auth / PostgreSQL
- Google OAuth
- Gemini API
- astronomy-engine
- lunar-javascript

## Local Development

```bash
npm install
npm run dev
```

검증:

```bash
npm run check
npm run build
```

환경변수 예시는 `.env.example`을 참고합니다.

## Validation Policy

기능 구현과 검증 완료를 구분합니다.

- 계산 결과는 기준값 테스트로 검증
- 인증/저장은 실제 Supabase 환경에서 검증
- Gemini 실패 시 결정론적 계산 결과는 유지
- 무료 티어/API 실패가 핵심 계산 흐름을 막지 않도록 분리
- 사용자 입력이 부족한 경우 값을 만들어내지 않음

진행 상황은 [docs/status.md](docs/status.md)에서 관리합니다.

## Documentation

- [Product Requirements](docs/PRD.md)
- [Project Status](docs/status.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Domain Depth Roadmap](docs/DOMAIN_DEPTH_ROADMAP.md)
- [Data Loop](docs/DATA_LOOP.md)

## Disclaimer

Prism의 결과는 전통적·문화적 해석 체계를 활용한 자기탐색 및 엔터테인먼트 목적의 참고 정보입니다.  
의료·법률·재정 등 중요한 의사결정에서 전문적인 판단을 대체하지 않습니다.
