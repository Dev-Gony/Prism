# Prism Validation Gate

Prism의 기능 확장 이후 계산 신뢰성과 회귀 방지를 위한 검증 기준입니다.

## 목표

새 기능을 추가하기 전에 다음 세 가지를 자동 검증합니다.

1. 계산 기준값이 알려진 reference와 일치하는가
2. 기존 입력/결과 계약이 기능 변경으로 깨지지 않는가
3. 모든 push / pull request가 동일한 typecheck, test, build gate를 통과하는가

## Validation Layers

### 1. Golden / Reference Tests

#### Saju / DaYun

- `lunar-javascript@1.7.7`를 계산 라이브러리 기준으로 사용
- 공개 README의 1986-05-29 사주 기준값을 Quick Reading golden case로 고정
  - 년주: 丙寅
  - 월주: 癸巳
  - 일주: 癸酉
- upstream `__tests__/Yun.test.js`의 sect 2 기준 사례를 대운 golden case로 고정
  - upstream civil time: 2022-03-09 20:51
  - gender: male
  - sect: 2
  - start offset: 8년 9개월 2일
  - start date: 2030-12-12
- Prism은 한국 입력을 KST로 받고 lunar-javascript 절기 계산 civil time에 맞춰 1시간 보정하므로 테스트 입력은 2022-03-09 21:51 KST를 사용

Reference:
- https://github.com/6tail/lunar-javascript
- https://github.com/6tail/lunar-javascript/blob/master/__tests__/Yun.test.js

#### Astrology

- `astronomy-engine@2.1.19`의 geocentric/ecliptic 계산을 사용
- KST → UTC 변환
- 0~360도 황경 범위
- Zodiac 30도 경계
- ASC/DSC 및 MC/IC 180도 대칭
- Whole Sign Houses 30도 간격
- Solar Return natal Sun residual orb
- 출생시간 미상 시 Moon/ASC/MC/Houses 미생성

Astronomy Engine 자체는 VSOP87/NOVAS 기반이며 upstream에서 JPL Horizons 등과 검증됩니다.

Reference:
- https://github.com/cosinekitty/astronomy

#### Numerology

독립 산술 기대값을 테스트에 고정합니다.

1995-10-24:
- Life Path: 4
- Birthday: 6
- Attitude: 7
- Period Cycles: 1 / 6 / 6
- Pinnacles: 7 / 3 / 1 / 7
- Challenges: 5 / 0 / 5 / 5

2026-09-24 기준:
- Personal Year: 8
- Personal Month: 8
- Personal Day: 5

Name Numerology fixture:
- ALAN TURING
- Life Path 4
- Expression 9
- Soul Urge 5
- Personality 4

## 2. Regression Tests

현재 자동 회귀 범위:

- 윤일 / 월말 date clamp
- 출생시간 미상
- 대운 기준 미입력
- Quick 동일 입력 결정론
- Numerology 동일 입력 결정론
- Astrology time-known / time-unknown contract
- Transit 고정 기준일 결정론
- Transit orb 정렬
- Destiny Timing의 Saju / Astrology / Numerology source 보존

향후 추가 대상:

- API route contract
- 저장 → 조회 → 재분석 snapshot
- Quick → Detailed upgrade
- Gemini success / timeout / fallback
- Supabase RLS integration
- 월간 exact-window snapshot fixture
- Solar Return year-flow snapshot

## 3. CI Gate

GitHub Actions는 다음 순서로 실행합니다.

```text
npm ci
  ↓
npm run typecheck
  ↓
npm test
  ↓
npm run build
```

CI가 실패한 commit은 Production-ready로 간주하지 않습니다.

## Completion Rule

계산 기능은 다음 조건을 모두 충족해야 완료로 표시합니다.

- reference 또는 invariant test 존재
- regression test 존재
- typecheck PASS
- test PASS
- production build PASS

실행하지 않은 검증은 PASS로 기록하지 않습니다.
