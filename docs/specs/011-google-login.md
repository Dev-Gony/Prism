# 011 — Google Login with Supabase Auth

- Status: Implemented / Pending local validation
- Product area: Authentication
- Priority: MVP support feature
- Related PRD: 로그인 없이 분석 가능, 결과 저장 시 로그인
- Depends on: Supabase project, Google OAuth client, `.env.local`
- Does not implement: email/password signup, social providers other than Google

---

## 1. 목적

Prism의 핵심 분석 경험은 로그인 없이 사용할 수 있어야 한다.

로그인은 **분석 결과를 저장하려는 순간에만 요구**한다.

Google Login의 목적은 다음과 같다.

1. 사용자가 별도의 비밀번호를 만들지 않고 빠르게 인증한다.
2. 로그인한 사용자의 저장 결과를 `auth.users.id` 기준으로 안전하게 소유권 연결한다.
3. 이후 "내 분석 보관함"에서 본인 결과만 조회할 수 있게 한다.

---

## 2. 현재 확인된 인프라 상태

Supabase live project 기준:

- Project name: `Prism`
- Project status: `ACTIVE_HEALTHY`
- Region: Tokyo (`ap-northeast-1`)
- Project API URL: 존재 및 조회 가능
- Publishable key: 활성 상태
- `public` schema table: 현재 없음
- `auth.users`: 현재 0명
- Google identity: 현재 0개

따라서 **Supabase 프로젝트와 API 기본 연결 준비는 정상**이다.

단, 현재 관리 도구에서는 Supabase Dashboard의 Google Provider 설정값(Client ID / enabled 여부)을 직접 읽을 수 없다.
또한 아직 Google 로그인을 완료한 사용자가 없으므로 실제 OAuth 성공 여부는 사용자 로그인 플로우 테스트 전까지 최종 확인할 수 없다.

---

## 3. 사용자 시나리오

### 3.1 비로그인 분석

```text
Landing
  ↓
생년월일 입력
  ↓
Quick Reading
  ↓
결과 확인
```

여기까지 로그인 요구 없음.

### 3.2 저장 시 로그인

```text
Quick Result
  ↓
[내 분석 저장하기]
  ↓
로그인 여부 확인
  ├─ 로그인 상태 → 결과 저장
  └─ 비로그인 → Google Login
                  ↓
             OAuth Callback
                  ↓
             세션 생성
                  ↓
        대기 중이던 결과 저장
                  ↓
             저장 완료 표시
```

---

## 4. UX 요구사항

### 4.1 저장 버튼

결과 화면 하단 CTA:

```text
[내 분석 저장하기]
```

비로그인 상태에서 누르면 전체 로그인 페이지로 강제 이동하기보다 Prism 디자인의 Bottom Sheet 또는 Modal을 우선 사용한다.

메시지:

> 이 결과를 계속 보관하려면 로그인해 주세요.

버튼:

```text
[G] Google로 계속하기
[나중에 할게요]
```

### 4.2 로그인 완료 후

성공 시:

> 내 프리즘 도감에 저장했어요 ✨

기존 분석 결과 화면으로 돌아와야 하며, 분석을 다시 입력하게 해서는 안 된다.

### 4.3 로그인 상태 표시

로그인 후 최소 UI:

- Google profile image가 있으면 avatar 사용 가능
- 표시명 또는 이메일 일부
- 로그아웃
- "내 분석" 진입점

MVP에서는 별도 프로필 편집 화면은 구현하지 않는다.

---

## 5. 기술 방향

### 5.1 Auth Provider

- Supabase Auth
- Provider: Google
- OAuth flow: Authorization Code + PKCE
- Next.js App Router
- Server-side session: Cookie 기반

### 5.2 권장 패키지

현재:

- `@supabase/supabase-js`

Google Auth 구현 시 추가:

- `@supabase/ssr`

Supabase 공식 Next.js 패턴에 따라 Browser Client와 Server Client를 분리한다.

예상 구조:

```text
lib/supabase/
├─ client.ts
├─ server.ts
└─ proxy.ts

proxy.ts
app/auth/callback/route.ts
```

---

## 6. 환경변수

Prism 애플리케이션:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Google OAuth Client Secret은 Prism의 `.env.local`에 넣지 않는다.

Google Client ID / Secret은 **Supabase Auth Google Provider 설정에서 관리**한다.

금지:

```env
GOOGLE_CLIENT_SECRET=...
```

를 브라우저에 노출하거나 `NEXT_PUBLIC_*` 이름으로 저장하는 것.

---

## 7. Google Cloud 설정 기준

Google Auth Platform에서 Web Application OAuth Client를 사용한다.

최소 Scope:

- `openid`
- `userinfo.email`
- `userinfo.profile`

MVP에서는 Gmail, Calendar, Drive 등 추가 Scope를 요청하지 않는다.

### Authorized JavaScript Origins

개발:

```text
http://localhost:3000
```

운영:

```text
https://<production-domain>
```

### Google Authorized Redirect URI

Google Cloud에는 애플리케이션 callback이 아니라 Supabase Auth callback을 등록한다.

```text
https://<supabase-project-ref>.supabase.co/auth/v1/callback
```

Prism 프로젝트에서는 실제 Supabase project ref를 사용한다.

---

## 8. Supabase Redirect 설정

Supabase Auth Redirect URLs Allow List:

개발:

```text
http://localhost:3000/auth/callback
```

운영:

```text
https://<production-domain>/auth/callback
```

로그인 호출 예시 논리:

```ts
supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: origin + "/auth/callback?next=/",
  },
})
```

`next` 값은 반드시 내부 상대 경로만 허용한다.

외부 URL을 허용하면 Open Redirect 취약점이 생길 수 있다.

---

## 9. Callback

경로:

```text
GET /auth/callback
```

책임:

1. Query string의 `code` 확인
2. `exchangeCodeForSession(code)`
3. 세션 쿠키 저장
4. `next` 경로 검증
5. 원래 Prism 화면으로 redirect
6. pending save가 있으면 저장 플로우 재개

실패 시:

```text
/auth/error
```

또는 Prism Modal 오류 표시.

---

## 10. Pending Save 정책

로그인 전 사용자가 이미 Quick Analysis 결과를 가지고 있을 수 있다.

OAuth redirect 전에 브라우저에 임시 보관:

```text
sessionStorage key:
prism.pending-analysis.v1
```

저장 항목:

- 현재 분석 API 응답
- 저장 시도 시각

저장하지 않을 항목:

- API Key
- OAuth token
- Google token
- Supabase access token
- LLM 내부 Prompt

Callback 후:

1. session 확인
2. pending analysis 확인
3. 결과 저장 API 호출
4. 성공 시 sessionStorage 삭제

TTL:

- 30분을 초과한 pending result는 자동 폐기

---

## 11. 인증 판단

Client UI에서 로그인 여부 표시에는 session 사용 가능.

그러나 서버에서 사용자 소유 데이터 접근 권한을 결정할 때는 클라이언트가 전달한 `user_id`를 신뢰하지 않는다.

서버는 Supabase Auth에서 검증된 사용자 identity를 사용한다.

권장:

- `getClaims()`
- 또는 최신 user record가 필요한 경우 `getUser()`

저장 API Body에 `user_id`를 받지 않는다.

---

## 12. 로그아웃

Google 계정 자체를 로그아웃시키지 않는다.

Prism Supabase Session만 종료:

```text
supabase.auth.signOut()
```

로그아웃 이후:

- Quick Reading 사용 가능
- 저장된 분석 조회 불가
- 현재 화면의 비저장 분석은 사용자 선택에 따라 유지 가능

---

## 13. Error Cases

### Google Provider disabled

표시:

> Google 로그인을 시작할 수 없어요. 잠시 후 다시 시도해 주세요.

### Redirect URL mismatch

개발 단계에서 즉시 실패 처리하고 URL 설정 점검.

### OAuth 취소

사용자를 분석 결과 화면으로 돌려보내며 결과는 그대로 유지.

### Session exchange failure

- 저장 실행 금지
- 오류 메시지 표시
- 재로그인 CTA 제공

### pending result 없음

정상 로그인만 완료하고 홈/결과 페이지로 이동.

---

## 14. Security Requirements

- Google Client Secret은 Supabase에서만 관리
- `.env.local` Git 커밋 금지
- Supabase publishable key는 RLS를 전제로 브라우저 사용 가능
- Service/Secret key는 Client Component에서 절대 사용 금지
- Redirect `next`는 relative path만 허용
- 서버 authorization에 client-supplied user id 사용 금지
- OAuth Token을 application DB에 저장하지 않음
- Google 추가 Scope 요청 금지

---

## 15. Acceptance Criteria

- [ ] 비로그인 상태에서도 Quick Reading 사용 가능
- [ ] "내 분석 저장하기"를 누르면 Google Login 유도
- [ ] Google 로그인 성공 후 Prism으로 복귀
- [ ] Supabase session cookie 생성
- [ ] 서버에서 로그인 사용자 확인 가능
- [ ] 로그인 이전 결과가 유지됨
- [ ] pending result 저장 플로우가 자동 재개됨
- [ ] 로그인 취소 시 기존 분석 결과가 사라지지 않음
- [ ] 로그아웃 가능
- [ ] 로그아웃 후 본인의 저장 데이터 API 접근 차단
- [ ] 다른 사용자의 저장 결과 조회 불가
- [ ] Google Client Secret / access token이 브라우저나 로그에 노출되지 않음

---

## 16. Test Cases

### AUTH-001
비로그인 홈 접근 → 성공.

### AUTH-002
비로그인 Quick Analysis → 성공.

### AUTH-003
비로그인 Save 클릭 → Google Login UI 노출.

### AUTH-004
Google OAuth 성공 → `/auth/callback` → session 생성 → 원 화면 복귀.

### AUTH-005
Google OAuth 취소 → 분석 결과 유지.

### AUTH-006
잘못된 callback code → 저장되지 않음 + 오류 UI.

### AUTH-007
`next=https://evil.example` → 외부 redirect 거부.

### AUTH-008
로그인 후 로그아웃 → 세션 제거.

### AUTH-009
서버 API에 임의 `user_id` 전송 → authorization에 사용되지 않음.

### AUTH-010
Google Login 1회 성공 후 Supabase `auth.identities.provider = google` 확인.

---

## 17. 완료 후 검증 기록

구현 전이므로 아직 없음.

구현 후 반드시 기록:

- localhost Google login 성공 여부
- `auth.users` 생성 여부
- Google identity 생성 여부
- callback URL
- OAuth 취소 케이스
- production redirect 검증


---

## 구현 상태

구현 코드는 GitHub `main`에 반영됨.

아직 완료 처리하지 않은 이유:

- 실제 localhost Google OAuth 성공 테스트가 필요함
- 실제 사용자 session으로 RLS 저장/조회/삭제 테스트가 필요함
- 로컬 `npm run check` / `npm run build` 재검증이 필요함
