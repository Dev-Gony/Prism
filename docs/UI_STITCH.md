# Stitch UI Guide

Prism의 초기 UI Prototype을 Google Stitch에서 제작하기 위한 가이드입니다.

## Goal

단순한 "사주 사이트"가 아니라 **프리미엄 자기이해 서비스**처럼 보여야 합니다.

핵심 메시지:

> 세 가지 관점으로 나를 보고, 겹치는 부분과 다른 부분을 한눈에 이해한다.

---

## Platform

- Responsive Web
- Mobile First
- Desktop 확장
- Native App UI가 아니라 브라우저 기반 웹 서비스

---

## Visual Direction

원하는 인상:

- Premium
- Calm
- Editorial
- Modern
- Intelligent
- Minimal
- Warm
- Trustworthy

피해야 할 것:

- 과도한 보라색 우주 배경
- 별/달 아이콘 남발
- 무속적 이미지
- 금색/빨간색 중심 전통 운세 디자인
- 카드가 지나치게 많은 Dashboard
- AI 서비스에서 흔한 과한 Gradient
- 게임형 애니메이션

---

## Prototype Screens

1. Landing / Birth Date Input
2. Analysis Loading
3. Quick Result
4. Detailed Analysis Input
5. Detailed Result
6. AI Question
7. Save Result / Login Prompt

---

## Highest Priority Screens

### Landing

최소 입력:
- 생년월일

CTA:
- `나를 알아보기`

첫 진입에는 이름, 성별, 이메일, 로그인, 출생시간, 출생지역을 요구하지 않습니다.

### Quick Result

가장 중요한 화면입니다.

우선순위:
1. 핵심 키워드
2. 한 문장 종합 설명
3. 핵심 성향
4. Cross Analysis
5. 엔진별 상세 결과
6. 근거 보기
7. Detailed CTA

### Cross Analysis

Prism의 대표 UI가 되어야 합니다.

단순 점수판보다:
- 세 엔진의 방향
- 일치 여부
- 차이가 있는 이유
- 근거 펼치기

를 한눈에 이해할 수 있어야 합니다.

상태:
- Agreement
- Complementary
- Divergence
- Insufficient

Divergence를 실패나 오류처럼 표현하지 않습니다.

---

## Information Hierarchy

```text
쉬운 설명
  ↓
전문용어
  ↓
근거 데이터
```

초보 사용자에게 원국/천문 데이터부터 보여주지 않습니다.

---

## Suggested Stitch Prompt

```text
한국어 Responsive Web App UI를 디자인해주세요.

서비스 이름은 Prism입니다.
Prism은 사주, 서양 점성술, 수비학을 함께 분석하고
세 분석의 공통점과 차이점을 이해하기 쉽게 보여주는
Premium Self-Insight 서비스입니다.

Native mobile app이 아니라 브라우저 기반 Responsive Web이며,
Mobile First로 설계해주세요.

핵심 메시지:
"세 가지 관점으로 나를 보다."

운세 사이트처럼 보이기보다
차분하고 현대적인 자기이해 서비스처럼 보여야 합니다.

Premium, Calm, Editorial, Modern, Intelligent, Minimal,
Warm, Trustworthy한 방향으로 디자인해주세요.

과도한 우주 배경, 별과 달 장식, 무속 이미지,
금색/빨간색 운세 디자인, 과한 Gradient,
카드가 지나치게 많은 Dashboard는 피해주세요.

Landing과 Quick Result를 가장 높은 완성도로 만들고,
특히 사주/점성술/수비학이
Agreement / Complementary / Divergence / Insufficient
상태로 비교되는 Cross Analysis를
Prism만의 대표 UI로 디자인해주세요.

첫 입력은 생년월일 하나만 받습니다.
로그인, 이름, 성별, 이메일은 요구하지 않습니다.

Quick Result에서는
핵심 키워드 → 한 문장 설명 → 핵심 성향 → Cross Analysis →
엔진별 상세 → 근거 보기 → Detailed 분석 CTA
순서로 정보가 읽히게 해주세요.

전문용어는 숨기지 않되 쉬운 설명을 먼저 보여주고,
사용자가 원할 때 전문 정보와 근거를 펼칠 수 있는
Progressive Disclosure를 사용해주세요.

Desktop과 Mobile 화면 모두 고려해주세요.
```

---

## Review Checklist

Stitch 시안을 검토할 때 아래를 확인합니다.

- 첫 화면에서 5초 안에 서비스 목적을 이해할 수 있는가
- 생년월일 입력이 가장 눈에 띄는가
- "사주 사이트"보다 "자기이해 서비스"로 보이는가
- Cross Analysis가 차별점으로 보이는가
- 결과 페이지가 카드 더미처럼 보이지 않는가
- 모바일에서 세 분석 비교가 무너지지 않는가
- 전문용어가 쉬운 설명보다 먼저 튀어나오지 않는가
- Divergence가 부정적인 결과처럼 보이지 않는가
