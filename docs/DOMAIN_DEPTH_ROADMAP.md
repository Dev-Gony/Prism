# Prism Domain Depth Roadmap

## Product North Star

Prism의 목표는 세 체계를 얕게 섞는 것이 아니다.

**사주, 서양 점성술, 수비학 각각을 독립된 전문 앱 수준으로 계산하고, 그 방대한 결과를 마지막에 하나의 사람 기준으로 교차 분석한다.**

즉 구조는 다음과 같다.

1. Saju Expert Engine
2. Astrology Expert Engine
3. Numerology Expert Engine
4. Prism Cross-System Synthesis

각 엔진은 자체적으로 충분히 깊어야 하며, 교차 분석은 원본 엔진의 계산값을 덮어쓰지 않는다.

---

## 1. Saju Expert Engine

### Natal Core
- 사주 4주 8자
- 일간
- 오행
- 음양
- 천간 십신
- 지지 본기 십신
- 지장간
- 지장간 십신
- 합
- 충
- 형
- 파
- 해

### Strength / Structure
- 월령
- 일간 강약
- 통근
- 투간
- 득령 / 득지 / 득세
- 조후
- 용신 / 희신 / 기신 후보
- 격국 후보
- 공망
- 신살은 핵심 구조와 분리해 보조 정보로 취급

### Time / Destiny Flow
- 대운
- 세운
- 월운
- 일진
- 원국 ↔ 대운 상호작용
- 원국 ↔ 세운 상호작용
- 합충형파해의 시간축 변화

### Future
- 궁합
- 관계별 십신 구조
- 직업/재성/관성/인성 흐름
- 사건 예언이 아니라 전통 체계상의 시기적 강조점으로 표현

---

## 2. Astrology Expert Engine

### Natal Core
- Sun
- Moon
- Mercury
- Venus
- Mars
- Jupiter
- Saturn
- Uranus
- Neptune
- Pluto
- ASC
- MC / IC / DSC
- 12 Houses
- Whole Sign

### Aspects
- Conjunction
- Sextile
- Square
- Trine
- Opposition
- Orb
- Applying / Separating
- Angular planet emphasis

### Chart Structure
- Elements
- Modalities
- Polarities
- House emphasis
- Hemisphere emphasis
- Stellium
- Aspect patterns
- Chart ruler
- House rulers
- Planetary dignity
- Retrograde state

### Time / Destiny Flow
- Transits
- Secondary progressions
- Solar return
- Saturn return
- Jupiter cycle
- Nodes
- Major transit windows

### Future
- Synastry
- Composite chart
- Relationship aspect patterns

---

## 3. Numerology Expert Engine

### Birth-Date Core
- Life Path
- Birthday Number
- Attitude Number
- Master Numbers

### Long Cycles
- 3 Period Cycles
- 4 Pinnacles
- 4 Challenges

### Time Cycles
- Personal Year
- Personal Month
- Personal Day

### Name-Based Expansion
이름 입력은 별도 동의/선택 입력으로 분리한다.

- Expression / Destiny Number
- Soul Urge
- Personality Number
- Maturity Number
- Karmic Lessons
- Hidden Passion
- Balance Number

### Future
- Compatibility
- Personal cycle overlays

---

## 4. Prism Synthesis Layer

Prism의 핵심 차별화는 여기서 생긴다.

### Layer A — Raw Evidence
각 엔진의 원본 계산값을 보존한다.

### Layer B — Domain Interpretation
각 분야 내부에서만 해석한다.

예:
- 사주는 사주 논리만 사용
- 점성술은 점성술 논리만 사용
- 수비학은 수비학 논리만 사용

### Layer C — Normalized Traits
서로 다른 용어를 공통 축으로 변환한다.

예:
- 자기주도성
- 성찰
- 안정
- 관계
- 창의
- 적응
- 돌봄

### Layer D — Cross-System Analysis
- Agreement
- Complementary
- Divergence
- Insufficient

### Layer E — Destiny Synthesis
"어떤 체계가 맞다"가 아니라 아래를 설명한다.

- 세 체계가 반복해서 강조하는 핵심
- 서로 다른 체계가 다른 방식으로 설명하는 동일 패턴
- 한 체계에서만 강하게 나타나는 독립 신호
- 시간축에서 동시에 강조되는 구간
- 출생 데이터가 부족해 판단할 수 없는 부분

---

## 5. Data Architecture Principle

방대한 데이터를 만들더라도 모든 값을 한 JSON 덩어리에 무질서하게 넣지 않는다.

권장 구조:

```
analysis_results
  raw_engines
    saju
      natal
      strength
      relations
      cycles
    astrology
      natal
      houses
      aspects
      patterns
      timing
    numerology
      core
      cycles
      name_based
  domain_interpretations
  normalized_traits
  cross_analysis
  destiny_synthesis
```

엔진 계산 버전은 반드시 저장한다.

예:

```
saju_natal: prism-saju-v2
saju_strength: prism-saju-strength-v1
astrology_natal: astronomy-engine@...
astrology_aspects: prism-aspect-v1
numerology_core: prism-numerology-v2
cross: prism-cross-v2
```

그래야 과거 저장 결과와 새 알고리즘 결과를 비교할 수 있다.

---

## 6. Product Rule

깊이를 늘릴 때 지켜야 할 우선순위:

1. 계산 가능
2. 근거 표시 가능
3. 전문 분야 안에서 설명 가능
4. 교차 분석 가능
5. AI 문장화

LLM이 모르는 값을 채우거나 계산 결과를 발명하는 순서는 허용하지 않는다.

---

## 7. Current Implementation

현재 반영:

### Saju
- 4 Pillars
- 오행
- 일간
- 천간 십신
- 지장간
- 지장간 십신
- 합 / 충 / 형 / 파 / 해

### Astrology
- Sun ~ Pluto 10 planets
- ASC / MC / DSC / IC
- Whole Sign 12 Houses
- 행성별 House
- 5 Major Aspects + Orb

### Numerology
- Life Path
- Birthday Number
- Attitude Number
- 3 Period Cycles
- 4 Pinnacles
- 4 Challenges

---

## 8. Next Depth Order

1. 사주 월령 / 통근 / 투간 / 일간 강약
2. Astrology modalities / chart ruler / house ruler / dignity
3. Numerology Personal Year / Month / Day
4. 사주 대운 / 세운
5. Astrology transits
6. Cross-System Time Alignment
7. "나의 운명 지도" UI

최종 목표는 단순한 성향 리포트가 아니다.

**세 전문 체계의 원국/차트/수리 구조와 시간 흐름을 겹쳐서, 사용자가 자신의 반복 패턴과 시기적 변화를 탐색하는 통합 운명 지도.**
