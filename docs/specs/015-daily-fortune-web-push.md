# 015 Daily Fortune Guest Access & Web Push

## 목적

사용자가 로그인하지 않아도 방금 계산한 분석으로 오늘의 운세를 확인하고, 원할 때 매일 09:00 KST 웹 푸시 알림을 신청해 Prism으로 다시 돌아오게 한다.

## 사용자 시나리오

1. 비로그인 사용자가 생년월일로 Quick 분석을 완료한다.
2. 결과 화면에서 오늘 날짜와 현재 분석을 바탕으로 만든 오늘의 운세를 즉시 확인한다.
3. Prism이 "매일 아침 오늘의 운세를 받아보시겠어요?"라고 묻는다.
4. 사용자가 신청하면 Google 로그인으로 분석을 저장하고, 명시적인 버튼 조작 뒤 브라우저 알림 권한을 요청한다.
5. 구독한 사용자는 매일 09:00 KST에 "오늘의 운세가 도착했어요" 웹 푸시를 받는다.
6. 알림을 누르면 고정 운영 주소의 오늘의 운세 영역으로 이동한다.

## In Scope

- 비로그인 Quick 분석 결과 기반 당일 운세 표시
- 결과 완료 뒤 웹 푸시 신청 안내
- Google 로그인 뒤 기존 분석 저장 흐름과 알림 신청 의도 복원
- Service Worker와 PWA manifest
- 로그인 사용자별 Push API 구독 정보 저장 및 해제 API
- 기존 09:00 KST Cron에서 운세 생성 후 웹 푸시 발송
- 만료된 구독의 자동 비활성화
- iPhone/iPad의 홈 화면 추가 필요 안내

## Out of Scope

- SMS, 카카오 알림톡, 이메일 알림
- 네이티브 iOS/Android 앱
- 사용자가 알림 시각을 바꾸는 기능
- 브라우저가 차단한 알림 권한을 Prism이 임의로 해제하는 기능
- 미래 사건을 단정하는 문구

## 입력

- 비로그인: 현재 세션의 `QuickAnalysisResponse`와 KST 오늘 날짜
- 로그인: Supabase에 저장된 최신 분석과 `daily_fortunes`
- 알림 구독: 브라우저 PushSubscription의 endpoint, p256dh, auth
- 서버 설정: VAPID 공개키·비밀키·subject, 고정 운영 주소

## 출력

- 비로그인 결과 화면의 결정론적 `DailyFortunePayload`
- `push_subscriptions` 사용자별 구독 행
- 매일 09:00 KST 웹 푸시 알림
- 알림 클릭 시 `https://prism-nine-livid.vercel.app/?source=push#daily-fortune` 이동

## Business Rules

- 비로그인 운세는 생년월일·세 엔진의 핵심 계산값·KST 날짜를 seed로 사용하며 동일 입력과 날짜에는 동일한 결과를 반환한다.
- 비로그인 운세는 세션에서만 보여주며 Supabase에 익명 개인정보를 추가 저장하지 않는다.
- 알림 신청에는 로그인이 필요하다. 로그인 전 분석은 기존 pending snapshot으로 저장한다.
- 운영체제 알림 권한은 사용자가 "알림 켜기" 버튼을 누른 순간에만 요청한다.
- iOS/iPadOS에서는 홈 화면에 추가해 standalone으로 연 웹 앱에서만 푸시 신청을 진행한다.
- 구독 정보는 로그인한 본인의 행만 조회·추가·변경·삭제할 수 있다.
- Cron은 오늘의 운세 생성을 먼저 완료한 뒤 오늘 운세가 있는 활성 구독자에게만 알림을 보낸다.
- endpoint가 404 또는 410을 반환하면 해당 구독을 비활성화한다.
- VAPID 설정이 없으면 운세 생성은 성공으로 유지하고 알림만 `skipped`로 기록한다.

## 보안과 개인정보

- VAPID 비밀키와 Supabase server key는 서버 환경변수에만 둔다.
- 브라우저에는 VAPID 공개키만 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`로 제공한다.
- `push_subscriptions`는 RLS를 활성화하고 `auth.uid()` 소유권 정책을 적용한다.
- 공개 스키마 테이블의 anon 권한을 회수한다.
- 구독 endpoint와 암호화 키를 로그에 출력하지 않는다.
- 사용자 에이전트, 전화번호, 기기명 등 불필요한 기기 개인정보를 저장하지 않는다.

## Error Cases

- 브라우저가 Push API를 지원하지 않음: 지원하지 않는 기기 안내
- iOS 홈 화면 앱이 아님: 홈 화면 추가 방법 안내
- 알림 권한 거부: 브라우저 설정에서 다시 허용해야 한다는 안내
- VAPID 공개키 누락: 신청 실패 안내, 분석 결과는 유지
- 구독 저장 실패: 신청 실패 안내, 분석 결과는 유지
- 일부 푸시 발송 실패: Cron 전체 생성 결과와 성공·실패 수를 분리해 반환
- 인증 없는 구독 API 호출: 401
- 인증 없는 Cron 호출: 401

## Acceptance Criteria

- 로그인하지 않은 사용자가 Quick 분석 뒤 오늘의 운세 카드 전체를 볼 수 있다.
- 비로그인 동일 분석·동일 날짜의 운세는 항상 같다.
- 결과 완료 뒤 수신 동의 안내가 보이고 "나중에"로 닫을 수 있다.
- 로그인 전 신청 의도가 OAuth 왕복 뒤 유지된다.
- 브라우저 알림 권한은 사용자의 버튼 클릭 전에는 요청하지 않는다.
- 구독 테이블에 RLS와 본인 소유 정책이 적용된다.
- 매일 `0 0 * * *` UTC, 즉 09:00 KST Cron이 생성 뒤 알림을 발송한다.
- 알림 제목은 "오늘의 운세가 도착했어요"이고 클릭하면 고정 운영 주소로 열린다.
- 타입 검사, 단위 테스트, production build, localhost 화면 검증을 통과한다.
- Supabase migration과 Vercel 환경변수를 운영 환경에 적용하고 실제 배포 주소에서 기능을 확인한다.

## Test Cases

- KST 날짜 경계 변환
- guest seed의 결정론과 날짜 변경
- guest payload 점수 범위와 세 영역 구성
- 비로그인 카드가 로그인 버튼 대신 분석 시작 CTA를 제공
- Service Worker가 push payload를 notification으로 표시
- notification click URL이 고정 운영 주소의 오늘 운세 anchor를 사용
- 구독 migration의 RLS, anon 권한 회수, 본인 정책, 사용자·endpoint 유일 제약
- 구독 API의 인증 및 입력 검증
- Cron의 인증, 생성 선행, 발송 집계, 만료 구독 비활성화

## 관련 PRD 항목

- 비로그인 Quick Reading
- 결과 저장 시 로그인 유도
- 오늘/주간 흐름 및 알림은 기존 MVP 제외 항목이었으나, 2026-09-28 사용자 요청으로 본 Spec 범위에 한해 제품 확장 기능으로 승인한다.

## 구현 후 검증 결과

- 2026-09-28: 비로그인 Quick 분석 결과에서 오늘 운세 카드와 수신 동의 팝업이 표시되는 것을 localhost에서 확인했다.
- 375px 세로 화면에서 가로 넘침이 없고, 812×375 가로 화면에서 팝업이 내부 스크롤로 잘리지 않음을 확인했다.
- 키보드 Esc로 팝업을 닫은 뒤 결과와 재신청 CTA가 유지됨을 확인했다.
- `npm run check`: 타입 검사와 전체 테스트 32개 통과.
- `npm run build`: production build 통과.
- Supabase migration을 실제 프로젝트에 적용하고 본인 소유 SELECT/INSERT/UPDATE/DELETE 정책 4개를 확인했다.
- Vercel Production/Preview에 VAPID 공개키·비밀키·subject를 분리 등록했다.
- 실제 기기 알림 권한 허용과 수신은 사용자가 알림 신청 버튼을 누른 뒤 확인해야 하므로 아직 PASS로 기록하지 않는다.
