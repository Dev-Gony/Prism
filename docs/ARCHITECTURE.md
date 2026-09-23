# Architecture Draft

> 이 문서는 구현 확정본이 아니라 MVP 설계를 위한 초기 아키텍처 초안입니다.

## 1. 핵심 원칙

Prism은 **계산과 설명을 분리**합니다.

```text
User Input
   |
   v
Deterministic Engines
   |
   v
Structured Facts
   |
   v
Normalized Interpretation Layer
   |
   v
Cross Analysis
   |
   v
LLM Explanation
   |
   v
UI
```

LLM은 원천 계산을 수행하지 않습니다.

---

## 2. Engine Layer

MVP에는 세 엔진이 존재합니다.

### Saju Engine

책임:
- 입력 검증
- 기본 사주 계산
- Quick / Detailed 계산 범위 분리
- 계산 기준 및 엔진 버전 기록

### Astrology Engine

책임:
- 검증 가능한 Ephemeris 기반 천문 계산
- Quick에서 시간/지역 없이 확정 가능한 데이터만 제공
- Detailed에서 시간/지역 의존 데이터 확장

### Numerology Engine

책임:
- 생년월일 기반 계산
- 동일 입력에 대해 항상 동일 결과 반환
- MVP에서는 이름 기반 계산 제외

---

## 3. Structured Fact Layer

각 엔진은 자연어 해석 전에 계산 결과를 구조화합니다.

예시:

```json
{
  "engine": "saju",
  "version": "TBD",
  "inputCompleteness": "quick",
  "facts": [
    {
      "type": "day_master",
      "value": "..."
    }
  ]
}
```

원천 사실과 자연어 해석을 분리해야 이후 테스트가 가능합니다.

---

## 4. Normalized Interpretation Layer

서로 다른 체계의 데이터를 공통 Trait 구조로 변환합니다.

```json
{
  "domain": "decision_style",
  "trait": "independence",
  "direction": "high",
  "source": "astrology",
  "confidence": "supported",
  "evidence": []
}
```

### Domain 후보

- self_expression
- decision_style
- social_style
- relationship_style
- work_style
- motivation
- emotional_style
- strengths
- caution_tendencies

도메인 목록은 구현 전 Eval 가능성을 기준으로 다시 검토합니다.

---

## 5. Cross Analysis Layer

세 엔진의 Trait을 비교합니다.

출력 상태:

- `AGREEMENT`
- `COMPLEMENTARY`
- `DIVERGENCE`
- `INSUFFICIENT`

이 Layer는 가능한 한 규칙 기반으로 동작해야 하며, 핵심 분류를 LLM의 자유 판단에만 맡기지 않습니다.

---

## 6. LLM Layer

### 입력

- 계산된 사실
- 정규화된 Trait
- Cross Analysis 결과
- 사용할 수 없는 데이터 목록
- 사용자의 질문

### 출력

- 쉬운 설명
- 요약
- 공통점과 차이점 설명
- Detailed Mode 후속 질문 응답

### 금지

- 새로운 계산값 생성
- 누락 데이터 추정
- 충돌 결과 임의 선택
- 근거 없는 사실 추가

---

## 7. Quick vs Detailed

### Quick

입력:
- 생년월일

결과:
- 출생시간/위치 없이 확정 가능한 범위만 사용

### Detailed

추가 입력:
- 출생시간
- 출생지역

결과:
- 시간/장소 의존 계산 확장
- AI Question 활성화

---

## 8. Storage

초기 MVP는 분석 자체에 로그인을 요구하지 않습니다.

향후 저장 기능:

```text
Anonymous Result
      |
      v
Save CTA
      |
      v
Authentication
      |
      v
Persist Result
```

DB 스키마는 인증/저장 Spec에서 확정합니다.

---

## 9. Technical Decisions Not Yet Finalized

아래 항목은 아직 확정하지 않습니다.

- 웹 프레임워크 최종 버전
- DB 공급자
- 인증 공급자
- LLM 공급자/모델
- Astrology 계산 라이브러리
- 결과 캐시 방식
- 배포 인프라

제품 요구사항과 Technical Spike 검증 후 결정합니다.
