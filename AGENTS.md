# Prism Agent Guide

이 문서는 Prism 저장소에서 AI Agent가 작업할 때 지켜야 하는 기본 규칙입니다.

## 1. 작업 시작 전

항상 다음 문서를 먼저 확인합니다.

1. `docs/PRD.md`
2. `docs/status.md`
3. 관련 `docs/specs/*.md`
4. `docs/ARCHITECTURE.md`
5. UI 작업이면 `docs/UI_STITCH.md`

문서와 구현이 충돌하면 임의로 해석하지 말고 사용자와 범위를 다시 확인합니다.

## 2. 현재 개발 Flow

```text
PRD
 ↓
Prototype
 ↓
Local Technical Spike
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

제품 기능은 관련 Spec이 확정된 뒤 구현합니다.
환경 구성, 기술 검증, Prototype 반영처럼 현재 단계에서 승인된 작업은 예외입니다.

## 3. Scope Control

- PRD에 없는 기능을 편의상 추가하지 않습니다.
- MVP 제외 항목을 몰래 구현하지 않습니다.
- 한 번에 여러 Spec을 섞어 구현하지 않습니다.
- 미래 기능을 위해 불필요한 추상화를 먼저 만들지 않습니다.

## 4. Calculation vs LLM

Prism의 핵심 원칙은 계산과 설명의 분리입니다.

### 코드/검증된 엔진이 담당

- 사주 계산
- 점성술 천문 계산
- 수비학 계산
- 입력 검증
- 교차분석의 핵심 분류 규칙

### LLM이 담당

- 전문용어의 쉬운 설명
- 구조화된 결과 요약
- 계산된 결과의 공통점/차이점 설명
- Detailed Mode의 제한된 후속 질문

LLM이 계산값을 만들거나 누락된 출생정보를 추정해서는 안 됩니다.

## 5. Testing

결정론적 로직에는 자동 테스트를 작성합니다.

최소 검증 대상:

- 날짜 경계
- 윤년/윤일
- 사주 절기 및 일자 경계
- 점성술 기준 사례
- 수비학 기준 사례
- 누락 데이터 처리
- Cross Analysis 상태 분류
- 동일 입력 동일 계산 결과

실패한 테스트를 통과시키기 위해 테스트 기대값을 임의로 바꾸지 않습니다.

## 6. UI

- 확정된 Stitch 디자인을 구현 기준으로 사용합니다.
- Stitch 화면을 보지 못한 상태에서 비슷한 UI를 임의로 재창작하지 않습니다.
- Mobile First
- 가로 스크롤 금지
- 쉬운 설명을 전문용어보다 먼저 배치
- Color만으로 상태를 구분하지 않음
- Divergence를 실패/오류처럼 표현하지 않음

## 7. Security / Privacy

- 비밀키를 저장소에 커밋하지 않습니다.
- 실제 키는 환경변수로 관리합니다.
- 불필요한 개인정보를 수집하지 않습니다.
- LLM에는 필요한 분석 컨텍스트만 전달합니다.

## 8. Completion

기능 완료라고 표시하기 전:

1. 관련 테스트 실행
2. TypeScript typecheck
3. 필요한 경우 build
4. localhost 실제 흐름 확인
5. 관련 Spec의 Acceptance Criteria 확인
6. `docs/status.md` 갱신

실행하지 않은 검증은 PASS로 기록하지 않습니다.
