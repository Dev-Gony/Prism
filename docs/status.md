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
