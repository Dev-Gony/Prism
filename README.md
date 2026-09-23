# Prism

> 여러 관점으로 나를 보다.

Prism은 사용자의 생년월일을 바탕으로 **사주·서양 점성술·수비학**을 각각 분석하고,  
세 체계의 **공통점·보완점·차이점**을 하나의 흐름으로 보여주는 자기이해 서비스입니다.

단순히 세 종류의 운세 결과를 나열하는 것이 아니라, 서로 다른 해석 체계를 공통 구조로 정리한 뒤 사용자가 이해하기 쉬운 한국어로 설명하는 것을 목표로 합니다.

---

## Product Concept

```text
생년월일 입력
    |
    +----------------+----------------+----------------+
    |                |                |
    v                v                v
사주 분석        서양 점성술       수비학 분석
    |                |                |
    +----------------+----------------+----------------+
                     |
                     v
          Normalized Interpretation
                     |
                     v
              Cross Analysis
                     |
                     v
              LLM Explanation
                     |
                     v
                 Prism Result
```

Prism에서 LLM은 계산기가 아닙니다.

- 사주 계산은 결정론적 계산 엔진이 수행합니다.
- 천문/점성술 데이터는 검증 가능한 계산 엔진이 수행합니다.
- 수비학 숫자는 코드로 계산합니다.
- LLM은 계산된 사실을 바탕으로 **설명·요약·교차 해석**만 담당합니다.

---

## MVP

첫 번째 MVP는 최대한 작게 시작합니다.

### Quick Reading

사용자는 **생년월일만 입력**합니다.

Prism은 가능한 범위에서 다음 세 체계를 분석합니다.

- 사주
- 서양 점성술
- 수비학

결과 화면에서는 다음 내용을 제공합니다.

- 나를 설명하는 핵심 키워드
- 핵심 성향
- 강점
- 관계 스타일
- 일하는 방식
- 주의할 성향
- 세 분석이 비슷하게 바라보는 부분
- 세 분석이 다르게 바라보는 부분
- 각 해석의 근거

### Detailed Reading

더 자세한 분석을 원하는 경우 다음 정보를 추가할 수 있습니다.

- 출생시간
- 출생지역

Detailed Reading에서는 시간·지역에 의존하는 추가 계산과 분석 결과 기반 AI 질문 기능을 제공합니다.

---

## Cross Analysis

Prism의 핵심 차별점입니다.

각 분석 결과를 다음 네 상태로 비교합니다.

| 상태 | 의미 |
|---|---|
| **AGREEMENT** | 여러 체계가 비슷한 방향을 나타냄 |
| **COMPLEMENTARY** | 다른 측면을 설명하지만 함께 성립 가능 |
| **DIVERGENCE** | 체계별 해석 방향이 다름 |
| **INSUFFICIENT** | 입력 정보가 부족해 판단할 수 없음 |

서로 다른 결과가 나와도 하나를 임의로 정답으로 선택하지 않습니다.

---

## MVP Scope

### Included

- 한국어 UI
- 비로그인 Quick Reading
- 생년월일 입력
- 사주 기본 계산
- 서양 점성술 기본 계산
- 수비학 기본 계산
- 전문용어 + 쉬운 설명
- 공통 해석 데이터 구조
- 세 엔진 교차분석
- 분석 근거 보기
- 최소 Detailed Reading
- Detailed Mode AI 질문
- 반응형 웹

### Not Included

첫 MVP에서는 아래 기능을 제외합니다.

- 자미두수
- Human Design
- 궁합
- 오늘의 운세
- 장기 대운/세운 리포트
- 결제/구독
- 전문가 상담
- 커뮤니티
- 다국어
- 모바일 네이티브 앱
- 추천 시스템
- 이름 기반 수비학

---

## Product Principles

### 1. Easy First

전문용어를 숨기지는 않지만, 항상 쉬운 설명을 먼저 제공합니다.

```text
쉬운 설명
  ↓
전문용어
  ↓
분석 근거
```

### 2. Never Guess Missing Data

출생시간이나 위치가 없으면 해당 정보가 필요한 결과를 추정하지 않습니다.

### 3. Explain, Don't Invent

LLM은 계산된 결과를 설명하며 새로운 사주·행성 위치·수비학 숫자를 만들어내지 않습니다.

### 4. Show Disagreement

분석 체계가 서로 다른 해석을 내놓으면 차이를 숨기지 않습니다.

### 5. Progressive Disclosure

처음에는 읽기 쉬운 결과를 보여주고, 원하는 사용자만 전문 정보를 펼쳐볼 수 있도록 설계합니다.

---

## Current Phase

현재 Prism은 **제품 정의 및 UI Prototype 단계**입니다.

```text
PRD
 ↓
Prototype
 ↓
localhost 기술 검증
 ↓
Feedback
 ↓
Spec
 ↓
Implementation
 ↓
Test / Validation
 ↓
Deploy
```

구현 전에 제품 범위와 사용자 경험을 먼저 확정합니다.

진행 상황은 [docs/status.md](docs/status.md)를 기준으로 관리합니다.

---

## Documentation

- [Product Requirements](docs/PRD.md)
- [Project Status](docs/status.md)
- [Architecture](docs/ARCHITECTURE.md)
- [UI / Stitch Guide](docs/UI_STITCH.md)
- [Specs Guide](docs/specs/README.md)

---

## Reference

초기 사주 계산 구조와 Agent 기반 개발 프로세스는 다음 Starter 프로젝트를 참고합니다.

- `zzsza/saju-starter-code`

Prism은 해당 Starter를 그대로 복제하는 것이 아니라, 제품 요구사항과 구조를 Prism에 맞게 재설계해 구현합니다.

---

## Disclaimer

Prism의 결과는 전통적·문화적 해석 체계를 활용한 자기탐색 및 엔터테인먼트 목적의 참고 정보입니다.  
의료·법률·재정 등 중요한 의사결정에서 전문적인 판단을 대체하지 않습니다.

---

## Status

**Planning / Prototype**

아직 제품 코드는 구현하지 않았습니다.
