# Project Status

Prism의 현재 개발 상태를 추적합니다.

## Current Phase

**Phase 3 — Auth / Persistence Implementation**

- [x] 제품 방향 정의
- [x] MVP 범위 정의
- [x] README 초기화
- [x] PRD v0.1 작성
- [x] Stitch 기반 UI Prototype
- [x] Prototype 피드백 및 디자인 방향 확정
- [x] GitHub / 로컬 저장소 연결
- [x] Next.js + TypeScript 프로젝트 초기 설정
- [x] localhost Bootstrap 실행 확인
- [x] Stitch HTML / DESIGN 소스 확보
- [x] Landing → Loading → Quick Result React Prototype 구현
- [x] Prototype localhost 시각 검증
- [x] 1차 UI 피드백 반영 (desktop scale / ambient canvas)
- [ ] 2차 UI 시각 검증
- [x] Local Technical Spike 코드 작성
- [x] Google Login / Analysis Result Storage Spec 작성
- [x] Google OAuth + Supabase SSR auth 구현
- [x] 분석 결과 저장/목록/상세/삭제 구현
- [x] Supabase `analysis_results` migration + RLS 적용
- [x] Security Advisor 경고 0건 확인
- [ ] 실제 엔진 기능 구현
- [ ] Test / Validation
- [ ] Deploy

---

## MVP Decisions

- 한국어로 시작
- Quick 입력은 생년월일만 사용
- 성별 미수집
- MVP 엔진: 사주 / 서양 점성술 / 수비학
- 자미두수: 다음 버전
- Human Design: MVP 제외
- 교차 분석: Agreement / Complementary / Divergence / Insufficient
- AI 대화: Detailed Mode에서만
- 기본 분석: 비로그인
- 결과 저장: 로그인 필요
- 핵심 경험과 무관한 기능은 MVP에서 제외

---

## Design Decisions

- Current Direction: Warm Editorial Insight
- Previous Tactile Soft-Pop / Tamagotchi-heavy direction retired
- Editorial serif headings + analytical sans-serif body
- Warm ivory / coral / dusty lavender / sage palette
- Companions: Modi(사주) / Stella(점성학) / Pico(수비학), now used as restrained analytical guides
- Desktop result layout: editorial report stream + sticky anchor rail
- Mobile result layout: single-column report + bottom navigation
- Meaningful body text target: 12px+ / primary reading text 14–16px
- Rectangular report cards keep radius at or below 20px
- New Stitch sources received and applied to Landing / Loading / Quick Result

---

## Development Environment

- Node.js: >= 22.9
- User local environment verified: Node 24.19.0 / npm 11.17.0
- Framework scaffold: Next.js 16 + React 19 + TypeScript
- Localhost bootstrap: verified on `http://localhost:3000`
- Repository: `Dev-Gony/Prism`

---

## Specs

실제 분석 엔진용 Spec은 Prototype localhost 검증과 Local Technical Spike 이후 작성합니다.

- [ ] `001-quick-input.md`
- [ ] `002-saju-quick-engine.md`
- [ ] `003-astrology-quick-engine.md`
- [ ] `004-numerology-engine.md`
- [ ] `005-normalized-traits.md`
- [ ] `006-cross-analysis.md`
- [ ] `007-quick-result-ui.md`
- [ ] `008-detailed-input.md`
- [ ] `009-detailed-analysis.md`
- [ ] `010-ai-question.md`
- [x] `011-google-login.md`
- [x] `012-analysis-result-storage.md`


---

## Environment / Backend Preparation

- `.env.example` 추가
- 실제 키는 `.env.local`에만 저장
- `.env*`는 Git에서 제외하며 `.env.example`만 예외
- Gemini 실제 API 연결: 아직 미구현
- Supabase SSR/Auth 코드 연결: 구현 완료, 로컬 환경변수 입력 필요
- 분석 결과 저장 DB/RLS: migration 적용 완료
- Google OAuth 실제 로그인 성공 여부: localhost 검증 필요


---

## Validation Gate

현재 GitHub 코드 작성은 완료했지만 로컬 의존성 설치 후 실제 검증은 아직 필요하다.

- [ ] npm install
- [ ] npm run check
- [ ] npm run build
- [x] /api/health 확인 (Gemini/Supabase configured=true)
- [ ] 실제 생년월일 Quick Reading 확인
- [ ] GEMINI_API_KEY 설정 후 generatedBy=gemini 확인

로컬 실행 검증 전에는 해당 항목을 PASS로 간주하지 않는다.


---

## Supabase / Google OAuth Verification

Supabase live project 확인:

- Project: Prism
- Project status: ACTIVE_HEALTHY
- Region: ap-northeast-1
- Project API URL: 확인 완료
- Publishable key: 활성 상태
- public schema tables: 0
- auth users: 0
- Google identities: 0

판정:

- Supabase 프로젝트 자체는 정상 연결 준비 상태
- DB 저장 테이블은 아직 생성되지 않음
- 실제 Google OAuth 성공 여부는 아직 미검증
- 현재 사용 가능한 관리 도구에서는 Google Provider의 enabled/client 설정을 직접 조회할 수 없어 Google Cloud ↔ Supabase Provider 설정 완료 여부를 확정하지 않음

구현 및 실제 Google 로그인 1회 성공 후 auth.users / auth.identities로 재검증한다.


---

## Auth / Persistence Implementation

구현 완료:

- `@supabase/ssr` 기반 Browser / Server client
- Next.js `proxy.ts` session refresh
- Google OAuth callback: `/auth/callback`
- OAuth error page
- 비로그인 저장 시 pending analysis를 `sessionStorage`에 30분 보관
- 로그인 복귀 후 pending result 자동 저장
- `POST /api/results`
- `GET /api/results`
- `GET /api/results/:id`
- `DELETE /api/results/:id`
- `/my/results` 저장 목록
- `/my/results/:id` 저장 결과 상세
- Supabase `public.analysis_results` 생성
- RLS SELECT/INSERT/DELETE 정책 적용
- authenticated role의 UPDATE/TRUNCATE/REFERENCES/TRIGGER 권한 제거
- 기존 `public.rls_auto_enable()` SECURITY DEFINER 함수의 anon/authenticated EXECUTE 권한 제거
- Supabase Security Advisor: 현재 0건

남은 검증:

- 로컬 Supabase 환경변수 설정
- 실제 Google OAuth 1회 성공
- `auth.users` / `auth.identities(provider=google)` 생성 확인
- 실제 Quick Result 저장 및 재조회
- npm check / build 재검증


---

## Latest Local Verification

- Supabase env health: verified
- Gemini env health: verified
- `/api/health`: Gemini configured=true / Supabase configured=true
- Supabase live counts at this point: auth.users=0 / google identities=0 / analysis_results=0

다음 검증은 실제 Google OAuth 로그인 1회와 분석 결과 저장이다.


---

## UI Readability Pass

- [x] 2차 가독성 개선
- Desktop companion shell: 480px → 최대 580px
- 본문 / 설명 / 보조 텍스트 크기 상향
- Muted text 대비 강화
- Landing 카드 내부 패딩 및 정보 위계 개선
- Result / Loading 텍스트 가독성 동시 보정

다음 UI 단계:

1. Stitch `code(1).html` 기반 Loading 재구성
2. Stitch `code(2).html` 기반 Result 전면 재구성
3. 실제 분석 데이터를 해당 UI에 주입
4. `/my/results`를 Prism 도감 스타일로 재설계


---

## Latest UI Rebuild

- [x] Loading / Result Stitch 재구성 완료
- Loading: Fairy Console, 단계별 프로토콜, 조율 게이지, 요정 상태 반영
- Result: Soul Tamagotchi, 실제 계산값 요정 카드, Summary, Keyword, Cross Analysis, Observation Diary, Detailed CTA 재구성
- 실제 `/api/analyze` 결과를 새 Result UI에 연결
- 계산 근거는 접을 수 있는 Evidence Drawer로 이동
- 로그인/저장 플로우 유지

다음 구현 우선순위:

1. Gemini fallback 원인 수정 및 `generatedBy=gemini` 검증
2. `/my/results` 도감 UI 재설계
3. Detailed Reading Spec/입력 화면 구현 시작


---

## Gemini / Library Follow-up

- [x] Gemini structured output을 current Interactions API로 전환
- [x] JSON schema 강제
- [x] fallback reason server log 추가
- [x] 개발 전용 `/api/health/gemini` probe 추가
- [x] `/my/results` Prism 도감 UI 재설계
- [x] 저장 결과 상세 화면 재설계

로컬 확인 필요:

1. `/api/health/gemini` → `ok: true`
2. 새 Quick Reading → Result 상단 `Gemini 해석`
3. 새 결과 저장 → `/my/results`에서 Gemini badge 확인
4. `npm run check`
5. `npm run build`

기존 Fallback 저장 row는 immutable snapshot이므로 자동 변경하지 않는다.


---

## Gemini Model Change

- [x] Default Gemini model changed to `gemini-3.5-flash`
- Reason: lower-tier usage testing and user preference
- Local `.env.local` must also use `GEMINI_MODEL=gemini-3.5-flash`


---

## Detailed Reading v1

구현 완료:

- [x] 출생시간 입력
- [x] 대한민국 주요 도시 출생지역 선택
- [x] 시주 포함 사주 8자 계산
- [x] 실제 출생시각 기준 Sun / Moon / Mercury / Venus / Mars / Jupiter / Saturn 계산
- [x] Detailed 전용 정규화 및 교차분석
- [x] `POST /api/analyze/detailed`
- [x] Result 화면에서 Detailed Reading 입력 Modal 연결
- [x] Quick 결과 아래 Detailed 요약 카드 노출

다음 구현:

1. ASC
2. MC
3. 12 Houses
4. Detailed 결과 전용 해석 UI
5. 저장 스키마에서 analysis_type=detailed 지원
6. 전체 UI를 새 Professional + Warm Prism 디자인으로 리디자인


---

## ASC / MC / Whole Sign Houses

구현 완료:

- [x] local apparent sidereal time 기반 RAMC
- [x] ASC 계산
- [x] MC 계산
- [x] DSC / IC 계산
- [x] Whole Sign 12 Houses
- [x] 주요 행성별 house 배정
- [x] Detailed Result에 각도/하우스 노출

현재 house system은 Whole Sign으로 고정.
다음 단계에서 필요하면 Placidus 선택지를 추가한다.

남은 작업:
- 기준 차트와 수치 교차검증
- tests 추가
- detailed 저장 지원
- 새 Stitch 시안 반영


---

## Warm Editorial Insight Redesign

User-provided Stitch package set reviewed:

- Landing / Quick input
- Analysis loading
- Quick cross-report result
- Shared `Warm Editorial Insight` design system

Applied:

- [x] Landing redesigned from mascot/game layout to editorial self-insight product
- [x] Prism still-life visual and three restrained system guides
- [x] Birth input rebuilt as structured report input
- [x] Loading rebuilt as analytical synthesis pipeline
- [x] Quick Result rebuilt as editorial report
- [x] Desktop sticky report anchor navigation
- [x] Cross-analysis evidence rows retained with real calculated data
- [x] Three-lens section connected to live Saju/Astrology/Numerology engine values
- [x] Observation log connected to live narrative
- [x] Detailed Reading CTA/modal kept and restyled
- [x] Detailed ASC / MC / Whole Sign Houses result kept and restyled
- [x] Login / save / archive links preserved
- [x] Gemini async enrichment preserved
- [x] Editorial web fonts loaded before CSS rules

Local visual/build validation still required after `git pull`.


---

## Saved Detailed Report Archive

구현 완료:

- [x] 저장된 Quick / Detailed 결과 상세 화면 분리 렌더링
- [x] Detailed 저장 결과에서 출생시간 / 출생지역 / timezone 표시
- [x] ASC / MC / DSC / IC 표시
- [x] Whole Sign 12 Houses 표시
- [x] 주요 행성별 sign / longitude / house 표시
- [x] 시주 포함 사주 8자 표시
- [x] Quick/Detailed 모두 Warm Editorial Insight 상세 화면 적용
- [x] 당시 engine_versions / raw snapshot 확인용 evidence drawer 유지

다음 우선순위:

1. Detailed 계산 엔진 기준값 테스트 추가
2. Quick ↔ Detailed 차이 비교 섹션 구현
3. Detailed 전용 Gemini narrative 생성
4. `npm run check` / `npm run build` 로컬 검증


---

## Account / Comparison Follow-up

구현 완료:

- [x] 메인/결과 화면 사용자 계정 메뉴 추가
- [x] 계정 메뉴에서 내 프리즘 도감 진입
- [x] Supabase signOut 기반 로그아웃
- [x] 로그아웃 시 pending analysis / 저장 상태 초기화
- [x] Quick ↔ Detailed 비교 섹션 추가
- [x] 시주 추가 여부 설명
- [x] ASC / Moon / MC 추가 정보 설명
- [x] Life Path 불변 설명
- [x] Quick 대비 Detailed 교차 합의도 변화 표시

다음 우선순위:

1. Detailed 전용 Gemini narrative
2. ASC / MC / House 기준값 테스트
3. Production 회귀 테스트
4. 모바일 UI 최종 점검


---

## Detailed Gemini Narrative

구현 완료:

- [x] Detailed 전용 Gemini narrative 함수
- [x] Detailed 전용 API `POST /api/narrative/detailed`
- [x] 시주 / Moon / ASC / MC / Houses / 행성 House 정보를 프롬프트 근거로 전달
- [x] Quick과 동일하게 비동기 enrichment
- [x] 15초 timeout 후 fallback 유지
- [x] Detailed 결과 화면에 AI summary + 핵심 3개 노출
- [x] 무료 티어/API 실패 시 계산 결과 화면은 막지 않음

다음 우선순위:

1. ASC / MC / Houses 기준값 테스트
2. Production 회귀 테스트
3. 모바일 최종 점검


---

## Calendar Input / Collision Fix

구현 완료:

- [x] Result desktop grid 충돌 방지
- [x] Sidebar / report stream 중간 폭에서 겹치지 않도록 1180px 이전 단일 컬럼 전환
- [x] Header legend / section heading / cross card flex wrap 안전 처리
- [x] Evidence / Lens / CTA overflow 방지
- [x] 양력 / 음력 토글 실제 동작
- [x] 음력 입력을 lunar-javascript로 양력 변환 후 기존 계산 엔진에 전달
- [x] 윤달 입력 옵션 추가
- [x] Quick / Detailed 모두 calendar metadata 유지
- [x] 예시 날짜 선택 시 양력으로 명확히 복귀

사용자 결정에 따라 계산 기준값 테스트와 전체 회귀 테스트는 기능 구현 후 일괄 진행.


---

## Unknown Birth Time

구현 완료:

- [x] Detailed Reading에서 "태어난 시간을 몰라요" 지원
- [x] 시간 미상 시 사주 시주 제외
- [x] 시간 미상 시 Moon / ASC / MC / DSC / IC / 12 Houses 제외
- [x] 시간 미상 시 행성별 House 미계산
- [x] 시간 비민감 행성은 정오 스냅샷 기준으로 유지
- [x] Detailed-lite 결과/저장/API 지원
- [x] Detailed Gemini가 누락된 시간 의존 값을 추측하지 않도록 프롬프트 분기
- [x] 저장 결과 상세 화면에서도 "시간 미상" 상태 표현

사용자 결정에 따라 전체 계산값 테스트와 회귀 테스트는 기능 구현 완료 후 일괄 진행.


---

## Birthplace Search / Detailed AI Question

구현 완료:

- [x] 대한민국 주요 출생도시 preset 확장
- [x] 출생지역 검색형 picker
- [x] 지역명 / 광역단위 / alias 검색
- [x] 선택 지역의 좌표 표시
- [x] Detailed Reading 전용 AI 질문 API
- [x] 현재 Detailed 계산 결과 안에서만 답하도록 Gemini 제약
- [x] 300자 질문 제한
- [x] Gemini 실패 시 fallback 답변
- [x] 근거(evidence) 1~4개 표시
- [x] 추천 질문 4개
- [x] 세션 내 최근 질문 스레드 표시

사용자 결정에 따라 계산값 테스트와 회귀 테스트는 기능 구현 완료 후 일괄 진행.


---

## Saved Report Reanalysis UX

구현 완료:

- [x] 저장 결과 목록 Quick / Detailed 필터
- [x] 생년월일 / 요약 / 엔진 라벨 검색
- [x] 저장된 input_snapshot 기반 "다시 분석"
- [x] Quick 재분석 시 생년월일 / 양력·음력 / 윤달 복원
- [x] Detailed 재분석 시 출생시간 / 시간 미상 / 출생지역까지 복원
- [x] Detailed 저장 결과에서 재분석 시 입력 모달 자동 오픈
- [x] 도감 카피를 Warm Editorial Prism 방향으로 정리
- [x] 기존 저장 결과 삭제 / 열기 / 로그아웃 유지

다음 기능 구현 후보:

1. 저장된 Detailed 리포트에서도 AI 질문 이어가기
2. 최근 분석 / 가장 높은 합의도 등 라이브러리 요약
3. 공유용 결과 카드 생성
4. 기능 구현 마감 후 일괄 Test / Validation


---

## Saved Detailed Q&A Continuation

구현 완료:

- [x] 저장된 Detailed 리포트 상세 화면에서 Ask Prism 재사용
- [x] 저장된 snapshot을 그대로 질문 근거로 전달
- [x] 질문 스레드 브라우저 localStorage 유지
- [x] 리포트별 별도 질문 기록
- [x] 최근 10개 질문/답변 유지
- [x] 질문 기록 삭제 기능
- [x] 기존 /api/ask 제약 및 fallback 재사용
- [x] 저장된 계산값 자체는 수정하지 않음

다음 기능 구현 후보:

1. 라이브러리 요약 인사이트
2. 공유용 결과 카드
3. 저장된 Quick 리포트의 Detailed 업그레이드 진입
4. 기능 구현 완료 후 일괄 Test / Validation


---

## Library Insight Summary

구현 완료:

- [x] 저장 리포트 전체 평균 합의도
- [x] 가장 높은 합의도 리포트
- [x] 최근 분석 유형 / 날짜 요약
- [x] Quick / Detailed 저장 개수 요약
- [x] 저장된 narrative keyword 반복 빈도 집계
- [x] 2회 이상 반복된 핵심 키워드 최대 4개 표시
- [x] 결과 삭제 시 인사이트 즉시 재계산
- [x] 반응형 insight board

다음 기능 구현 후보:

1. Quick 저장 결과에서 바로 Detailed 업그레이드
2. 공유용 결과 카드
3. 라이브러리 기간별/타임라인 보기
4. 기능 구현 완료 후 일괄 Test / Validation


---

## Quick to Detailed Upgrade

구현 완료:

- [x] 라이브러리 Quick 카드에서 Detailed로 확장 CTA
- [x] Quick 리포트 상세 화면에서 Detailed 확장 CTA
- [x] 저장된 생년월일 / 양력·음력 / 윤달 입력 복원
- [x] Detailed 확장 시 출생시간은 비워둔 상태로 입력 유도
- [x] 출생지역 기본값 유지
- [x] Detailed 입력 모달 자동 오픈
- [x] 기존 Quick snapshot은 수정하지 않고 새 Detailed 분석으로 생성

사용자 결정에 따라 전체 Test / Validation은 기능 구현 종료 후 일괄 진행.


---

## Share / Timeline / Paired Archive

구현 완료:

- [x] 저장된 Quick / Detailed 리포트 공유 이미지 카드 생성
- [x] 공유 이미지에 이메일 / 계정 정보 제외
- [x] Web Share API 지원 환경에서는 네이티브 공유
- [x] 미지원 환경에서는 PNG 저장 fallback
- [x] 라이브러리 카드 / 타임라인 보기 전환
- [x] 최신순 / 합의도 높은순 정렬
- [x] 월 단위 타임라인 그룹
- [x] 타임라인에서도 재분석 / Detailed 확장 / 열기 / 삭제
- [x] 같은 생년월일의 Quick / Detailed 저장본 자동 페어링
- [x] Quick 대비 Detailed 평균 합의도 변화 표시
- [x] 각 페어의 Quick / Detailed 저장 리포트 바로가기

사용자 결정에 따라 전체 Test / Validation은 기능 구현 종료 후 일괄 진행.


---

## Product Data Loop

우리팔자 사례에서 얻은 제품 운영 관점을 Prism에 반영.

구현 완료:

- [x] Supabase `product_events` 이벤트 테이블
- [x] Supabase `product_feedback` 피드백 테이블
- [x] 익명 session_id 기반 퍼널 추적
- [x] 로그인 시 user_id 연결
- [x] Landing / Quick start / Quick complete 이벤트
- [x] Detailed open / complete 이벤트
- [x] Save click / save success 이벤트
- [x] Ask Prism / 공유 카드 / Quick→Detailed 업그레이드 이벤트
- [x] Quick / Detailed 결과 Helpful / Not helpful 피드백
- [x] 아쉬운 이유 500자 수집
- [x] 이벤트/피드백 insert-only RLS
- [x] 분석·피드백 수집 실패가 핵심 분석 기능을 막지 않도록 분리
- [x] `docs/DATA_LOOP.md`에 핵심 퍼널, 가설, 운영 SQL, 의사결정 규칙 문서화
- [x] Supabase performance advisor의 신규 RLS/initplan 및 FK index 이슈 수정

다음 단계:

1. 실제 사용자 유입 후 1차 퍼널 baseline 수집
2. Quick 완료 → Detailed 진입률 확인
3. Helpful 비율을 Gemini/Fallback, Quick/Detailed로 나눠 비교
4. 데이터 기반으로 첫 UI/카피 실험 진행


---

## Expert Engine Depth Expansion

제품 방향 재정의:

Prism은 사주/점성술/수비학을 얕게 조합하는 앱이 아니라,
**각 체계를 단일 전문 서비스 수준으로 깊게 계산한 뒤 마지막에 교차 분석하는 통합 운명 분석 서비스**를 목표로 한다.

이번 구현:

- [x] Saju: 천간 십신
- [x] Saju: 지장간 및 지장간 십신
- [x] Saju: 합 / 충 / 형 / 파 / 해 탐지
- [x] Astrology: Uranus / Neptune / Pluto 추가
- [x] Astrology: Sun~Pluto 10 Planets
- [x] Astrology: conjunction / sextile / square / trine / opposition
- [x] Astrology: aspect orb 계산
- [x] Numerology: Birthday Number
- [x] Numerology: Attitude Number
- [x] Numerology: 3 Period Cycles
- [x] Numerology: 4 Pinnacles
- [x] Numerology: 4 Challenges
- [x] Detailed UI에 각 전문 엔진의 심층 근거 노출
- [x] `docs/DOMAIN_DEPTH_ROADMAP.md` 작성

다음 심화 순서:

1. 사주 월령 / 통근 / 투간 / 일간 강약
2. Astrology modality / chart ruler / house rulers / dignity
3. Numerology Personal Year / Month / Day
4. 사주 대운 / 세운 설계
5. Astrology Transit
6. 세 체계 시간축 Cross-System Alignment
7. 최종 "나의 운명 지도" UI


---

## Destiny Intelligence v1

전문 엔진 깊이 확장과 현재 시점 시간축 교차를 구현.

### Saju Expert v2

- [x] 월령
- [x] 통근 단서
- [x] 투간
- [x] 일간 강약 휴리스틱
- [x] 현재 세운 연주
- [x] 세운 천간 십신
- [x] 세운 지지 ↔ 원국 합충형파해

주의:
- 강약 점수는 Prism 휴리스틱이며 정통 명리의 단일 확정 판정으로 표현하지 않음
- 대운은 성별/음양 순역 및 기산 학파 결정이 필요하므로 아직 임의 계산하지 않음

### Astrology Expert v2

- [x] 10 Planets
- [x] Elements balance
- [x] Modalities balance
- [x] Chart Ruler
- [x] House Rulers
- [x] 기본 dignity 상태
- [x] Jupiter / Saturn / Uranus / Neptune / Pluto 현재 transit 위치
- [x] Transit ↔ Natal 주요 각 + orb

### Numerology Expert v2

- [x] Personal Year
- [x] Personal Month
- [x] Personal Day
- [x] 기준일 snapshot 저장

### Prism Destiny Timing

- [x] 세운 / Transit / Personal Cycle 신호를 공통 theme으로 변환
- [x] 2개 이상 체계가 같은 theme을 강조할 때 convergence 생성
- [x] Detailed 결과에 DESTINY NOW 섹션
- [x] 저장 Detailed snapshot에 destiny_timing 보존
- [x] DB `analysis_results.destiny_timing` 컬럼 추가
- [x] 저장 리포트에서도 당시 Destiny Now snapshot 표시
- [x] 특정 사건 예언/보장이 아니라 시기적 강조점으로 표현

다음 구현 축:

1. Destiny Timeline 날짜 탐색
2. 대운 규칙 결정 전까지 세운 다년도 탐색 우선
3. Astrology transit 패턴 확장
4. 이름 기반 Numerology 선택 입력
5. 장기 운명 지도 UI


---

## Destiny Timeline Explorer v1

구현 완료:

- [x] Target-date Saju annual flow 계산
- [x] Target-date Astrology outer-planet transit 계산
- [x] Target-date Numerology Personal Cycle 계산
- [x] `POST /api/destiny/timeline`
- [x] 현재 -1년 / 미래 +3·+5·+10년 범위 선택
- [x] 연도별 dominant convergence / strength 표시
- [x] 특정 날짜 직접 분석
- [x] Detailed Result에 인터랙티브 운명 지도
- [x] 저장 Detailed Report에서도 동일 탐색
- [x] timeline open / exact date inspect analytics
- [x] Supabase product_events constraint 확장 및 migration versioning

다음 구현:

1. Astrology applying / separating 및 retrograde
2. Aspect pattern / stellium / angular emphasis
3. Numerology 이름 기반 선택 분석
4. 대운 규칙 결정
5. Destiny Timeline 월/분기 단위 확대


---

## Astrology Motion / Pattern Expansion

구현 완료:

- [x] 행성 일일 황경 속도 계산
- [x] direct / retrograde / stationary 상태
- [x] Natal aspect applying / separating / exact
- [x] 별자리 3행성 이상 Stellium 탐지
- [x] 1 / 4 / 7 / 10 House angular planet 강조
- [x] Detailed UI에 motion / speed / pattern 표시
- [x] 저장 Detailed 리포트에 aspect phase 표시
- [x] Gemini Detailed narrative 근거에 motion / pattern 추가

다음 심화 후보:

1. 분기/월 단위 Destiny Timeline
2. Transit applying/separating
3. Solar Return
4. Numerology 이름 기반 코어 넘버
5. 대운 규칙 결정


---

## Destiny Timeline v2

구현 완료:

- [x] 연 / 분기 / 월 해상도 전환
- [x] 월운 사주 천간 십신 및 원국 지지 관계
- [x] Target-date 월운 재계산
- [x] Transit applying / separating / exact
- [x] Destiny Timing에 세운 + 월운 신호 동시 반영
- [x] Astrology 상위 3개 transit aspect 신호
- [x] Numerology Personal Year + Personal Month 분리 신호
- [x] 월/분기별 cross-system convergence
- [x] strongest convergence 상위 3개 기간 빠른 탐색
- [x] 연간 +3/+5/+10년, 분기 8개, 월 12개 스냅샷

다음 심화 후보:

1. Transit monthly exact-window 탐색
2. Solar Return
3. Numerology 이름 기반 코어 넘버
4. 대운 규칙 결정 및 구현
5. 장기 타임라인 저장/비교


---

## Transit Motion Metadata

구현 완료:

- [x] Jupiter / Saturn / Uranus / Neptune / Pluto transit 일일 황경 속도 계산
- [x] transit direct / retrograde / stationary 판정
- [x] 기존 Transit applying / separating / exact 결과와 motion 결합
- [x] DESTINY NOW 점성술 근거에 phase / motion 반영
- [x] Detailed 결과에 transit motion / speed 노출
- [x] 저장된 Detailed 리포트에 transit phase / motion snapshot 노출
- [x] 기존 저장본에 motion 필드가 없어도 렌더링 유지

다음 심화 후보:

1. Transit monthly exact-window 탐색
2. Solar Return
3. Numerology 이름 기반 코어 넘버
4. 대운 규칙 결정 및 구현
5. 장기 타임라인 저장 / 비교


---

## Transit Monthly Exact Window

구현 완료:

- [x] 월간 Timeline 선택 시 해당 달 전체를 일 단위로 Transit 재계산
- [x] Transit body × Natal point × aspect 조합별 최소 orb 날짜 탐색
- [x] orb 1° 이내만 정밀 구간으로 채택
- [x] 최대 3개 정밀 구간 표시
- [x] exact-window에 applying / separating / exact 표시
- [x] direct / retrograde / stationary 및 일일 속도 표시
- [x] 연 / 분기 Timeline에는 추가 스캔을 수행하지 않도록 계산 범위 제한
- [x] 특정 사건 발생일이 아니라 천문 계산상 aspect 근접 시점으로만 표현

다음 심화 후보:

1. Solar Return
2. Numerology 이름 기반 코어 넘버
3. 대운 규칙 결정 및 구현
4. 장기 타임라인 저장 / 비교
5. 기능 마감 후 계산 기준값 / 회귀 테스트 일괄 수행


---

## Solar Return v1

구현 완료:

- [x] natal Sun 황경을 기준으로 연도별 정확 복귀 시각 탐색
- [x] astronomy-engine SearchSunLongitude 사용
- [x] Solar Return 순간 Sun~Pluto 10행성 스냅샷
- [x] natal Sun ↔ return Sun residual orb 표시
- [x] 출생지역 timezone 기준 시각 표시
- [x] 연도 이전 / 올해 / 다음 탐색
- [x] Detailed 결과와 저장 Detailed 리포트에서 재계산 가능
- [x] 출생시간 미상 시 정오 natal Sun 기준 근사값임을 명시
- [x] Solar Return 당시 실제 체류 장소 미입력 상태에서는 ASC / Houses를 계산하지 않음

다음 심화 후보:

1. Solar Return 장소 선택 후 ASC / Houses 확장
2. Numerology 이름 기반 코어 넘버
3. 대운 규칙 결정 및 구현
4. 장기 타임라인 저장 / 비교
5. 기능 마감 후 계산 기준값 / 회귀 테스트 일괄 수행


---

## Solar Return v2 · Location Houses

구현 완료:

- [x] Solar Return 당시 체류 장소 선택
- [x] 기존 대한민국 출생지역 데이터셋 재사용
- [x] 선택 장소 기준 ASC / MC 계산
- [x] Whole Sign 12 Houses 계산
- [x] Return 순간 10행성 House 배정
- [x] 장소 변경 시 이전 계산 snapshot 즉시 초기화
- [x] 실시간 Detailed / 저장 Detailed 모두 동일 기능
- [x] 실제 체류 장소가 달라지면 ASC / Houses도 달라진다는 안내

다음 심화 후보:

1. Numerology 이름 기반 코어 넘버
2. 대운 규칙 결정 및 구현
3. 장기 타임라인 저장 / 비교
4. Solar Return ↔ Natal aspect overlay
5. 기능 마감 후 계산 기준값 / 회귀 테스트 일괄 수행


---

## Solar Return v3 · Prism Year Matrix

구현 완료:

- [x] Solar Return 장소 기준 ASC / MC / Whole Sign Houses
- [x] Solar Return 내부 주요 aspect 계산
- [x] Solar Return ↔ Natal aspect overlay
- [x] return body ↔ natal planet / ASC / MC 교차
- [x] natal overlay는 orb 3° 이내만 노출
- [x] 선택 연도의 Solar Return 정확 복귀일을 기준으로 Prism Destiny Timing 재계산
- [x] Solar Return + 세운 / 월운 / Transit / Personal Cycle 통합 Year Matrix
- [x] Solar Return 계산 이벤트 수집
- [x] Supabase product_events constraint 확장

다음 심화 후보:

1. Solar Return 월별 활성 구간
2. Numerology 이름 기반 코어 넘버
3. 대운 규칙 결정 및 구현
4. 장기 타임라인 저장 / 비교
5. 기능 마감 후 계산 기준값 / 회귀 테스트 일괄 수행


---

## Prism Expansion Batch · Name Numerology / Year Flow / Saved Moments

이번 대형 확장 구현:

### Numerology Expert · Name Layer

- [x] 영문/로마자 이름 기반 Pythagorean Numerology
- [x] Expression / Destiny Number
- [x] Soul Urge
- [x] Personality Number
- [x] Maturity Number
- [x] Balance Number
- [x] Cornerstone / Capstone
- [x] First Vowel
- [x] Hidden Passion
- [x] Karmic Lessons
- [x] Subconscious Self
- [x] 1~9 문자값 분포
- [x] 이름 수비학은 자동 저장하지 않는 선택 입력
- [x] 한글 자동 음역 금지, 사용자가 실제 로마자 표기를 직접 입력

### Solar Return Year Flow

- [x] Solar Return 내부 major aspects
- [x] Solar Return ↔ Natal planet / ASC / MC overlay
- [x] orb 3° 이내 natal overlay
- [x] Solar Return 정확 복귀일 기준 12개월 Year Flow
- [x] 매월 세운 / 월운 / Transit / Personal Cycle 재계산
- [x] 월별 dominant convergence / strength
- [x] strongest 3 months 표시
- [x] 기존 Prism Year Matrix와 함께 노출

### Destiny Timeline Comparison

- [x] 날짜 A / 날짜 B 직접 선택
- [x] 각 시점 Cross-System Timing 병렬 계산
- [x] 두 시점 dominant theme / convergence 비교
- [x] 같은 사람의 시간 변화 탐색

### Saved Destiny Moments

- [x] Supabase `destiny_bookmarks`
- [x] 로그인 사용자 전용 저장
- [x] birth_date + as_of_date + timing immutable snapshot
- [x] 저장한 시점 다시 열기
- [x] 저장한 시점 삭제
- [x] RLS select / insert / delete own
- [x] bookmark save/delete product analytics

제품 구조는 이제 단순 리포트 저장에서
**출생 원본 → 전문 엔진 → 시간 탐색 → 특정 시점 비교 → 중요한 시점 보관**
흐름으로 확장됨.

다음 대형 축:

1. 사주 대운 규칙 확정 및 대운 10년 주기 엔진
2. Solar Return / Transit / 대운을 한 장의 장기 타임라인으로 병합
3. Name Numerology 결과를 선택적으로 Cross-System 정규화
4. 연도별 Prism Year Book / Archive
5. 기능 구현 종료 후 계산 기준값 및 회귀 테스트 일괄 수행


---

## Validation & CI Gate

2026-09-24 검증 단계 구현 완료:

- [x] `tests/calculation-validation.test.ts` 추가
- [x] `tests/regression.test.ts` 추가
- [x] Saju Quick upstream reference case 고정
- [x] DaYun sect 2 upstream Yun reference case + Prism KST 보정 검증
- [x] 음력 → 양력 알려진 기준일 검증
- [x] Astrology KST → UTC / Zodiac boundary / Whole Sign invariant 검증
- [x] Solar Return natal Sun residual orb / House 생성 검증
- [x] Numerology birth-date / name fixture 검증
- [x] 출생시간 미상 / 대운 기준 미입력 회귀 테스트
- [x] Transit 결정론 / orb 정렬 회귀 테스트
- [x] Destiny Timing의 Saju / Astrology / Numerology source 보존 회귀 테스트
- [x] GitHub Actions CI 추가
- [x] CI: `npm ci → npm run typecheck → npm test → npm run build`
- [x] PR #6에서 TypeScript 기존 오류 3개 수정
- [x] PR #6 CI에서 typecheck / calculation+regression tests / production build PASS
- [x] PR #6 main merge 완료

추가된 문서:
- `docs/VALIDATION.md`

이번 검증 과정에서 수정한 기존 타입 문제:
- Solar Return API의 DetailedAnalysis type narrowing
- 저장 리포트 cross-analysis reducer implicit any
- 저장 재분석 input의 literal type widening

남은 Release Gate:

1. main push CI 최종 확인
2. Vercel build-rate-limit 해소
3. 최신 main Production 배포
4. 배포 환경 Smoke Test
5. 실제 Supabase / OAuth / 저장 / 재분석 흐름 검증

검증되지 않은 항목은 PASS로 표시하지 않는다.
