# Specs

이 폴더에는 Prism 기능이 **어떻게 동작해야 하는지** 정의하는 구현 단위 Spec을 관리합니다.

## 작성 시점

현재는 Product Definition / Prototype 단계이므로 아직 기능 Spec을 작성하지 않습니다.

다음 조건이 충족된 뒤 작성합니다.

1. PRD 범위 검토 완료
2. Stitch Prototype 검토 완료
3. Local Technical Spike 완료
4. 주요 기술적 제약 확인

## Naming

파일 이름은 작성 순서대로 세 자리 번호를 사용합니다.

예:

- `001-quick-input.md`
- `002-saju-quick-engine.md`
- `003-astrology-quick-engine.md`

기존 Spec의 번호는 나중에 변경하지 않습니다.

## Spec에 반드시 포함할 항목

- 목적
- 사용자 시나리오
- In Scope
- Out of Scope
- 입력
- 출력
- Business Rules
- Error Cases
- Acceptance Criteria
- Test Cases
- 관련 PRD 항목
- 구현 후 검증 결과

## Rule

한 번에 여러 기능을 묶어 구현하지 않습니다.

```text
Spec 작성
  ↓
구현
  ↓
Test / Validation
  ↓
localhost 확인
  ↓
완료 처리
```

완료되지 않은 기능은 `docs/status.md`에서 체크하지 않습니다.
