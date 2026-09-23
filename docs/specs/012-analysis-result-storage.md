# 012 — Analysis Result Persistence

- Status: Implemented / Pending local validation
- Product area: Database / Saved Results
- Priority: MVP support feature
- Depends on: 011 Google Login
- Storage: Supabase Postgres
- Core policy: 분석은 비로그인 가능, 저장은 로그인 필요

---

## 1. 목적

Prism의 Quick/Detailed 분석 결과를 로그인 사용자가 나중에 다시 확인할 수 있도록 저장한다.

이 Spec은 **분석 계산 자체를 변경하지 않는다.**

저장 대상은 이미 계산·검증된 Prism Analysis Result다.

---

## 2. 사용자 시나리오

```text
비로그인
  ↓
Quick Reading 실행
  ↓
결과 확인
  ↓
[내 분석 저장하기]
  ↓
Google Login
  ↓
분석 결과 저장
  ↓
내 분석 보관함
  ↓
과거 결과 다시 열기
```

로그인한 사용자:

```text
Quick Reading
  ↓
[내 분석 저장하기]
  ↓
즉시 저장
```

---

## 3. 저장 정책

### 로그인 전

서버 DB에 사용자의 분석 결과를 자동 저장하지 않는다.

현재 결과는:

- React state
- 필요 시 `sessionStorage` pending save

수준에서만 임시 유지한다.

### 로그인 후

사용자가 명시적으로 `내 분석 저장하기`를 선택했을 때만 DB에 저장한다.

자동 저장 금지.

---

## 4. 테이블

MVP Table:

```text
public.analysis_results
```

프로필 테이블은 이 기능 구현의 필수 조건이 아니다.

사용자 소유권은 Supabase `auth.users.id`를 직접 참조한다.

---

## 5. Database Schema

제안 DDL:

```sql
create table public.analysis_results (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  analysis_type text not null default 'quick'
    check (analysis_type in ('quick', 'detailed')),

  birth_date date not null,
  birth_time time null,
  birth_place jsonb null,

  input_snapshot jsonb not null,

  engine_versions jsonb not null default '{}'::jsonb,

  saju_result jsonb not null,
  astrology_result jsonb not null,
  numerology_result jsonb not null,

  normalized_traits jsonb not null,
  cross_analysis jsonb not null,
  narrative jsonb not null,

  narrative_source text not null
    check (narrative_source in ('gemini', 'fallback')),

  llm_model text null,

  warnings jsonb not null default '[]'::jsonb,

  schema_version text not null default 'v1',

  created_at timestamptz not null default now()
);

create index analysis_results_user_created_idx
  on public.analysis_results(user_id, created_at desc);
```

MVP에서는 `updated_at`을 두지 않는다.

저장된 분석 결과는 **immutable snapshot**으로 취급한다.

다시 분석하면 새로운 row를 생성한다.

---

## 6. 컬럼 의미

### id

저장 결과의 공개 식별자.

URL 예:

```text
/my/results/<id>
```

단, UUID를 안다고 조회할 수 있어서는 안 된다. RLS가 반드시 적용되어야 한다.

### user_id

DB Insert 시 Client가 임의 지정하지 않는다.

인증된 Supabase user id를 사용한다.

### analysis_type

- `quick`
- `detailed`

### birth_date / birth_time / birth_place

사용자 입력을 재현하기 위한 최소 입력.

Quick:

- birth_date: required
- birth_time: null
- birth_place: null

Detailed:

- birth_date: required
- birth_time: nullable if user selected unknown
- birth_place: structured JSON

예:

```json
{
  "label": "서울특별시, 대한민국",
  "timezone": "Asia/Seoul",
  "latitude": 37.5665,
  "longitude": 126.978
}
```

### input_snapshot

실제 Analysis API에 사용된 입력 구조 전체.

향후 입력 구조가 변경되어도 당시 분석을 추적하기 위한 용도.

### engine_versions

예:

```json
{
  "saju": "lunar-javascript@1.7.7",
  "astrology": "astronomy-engine@2.1.19",
  "numerology": "prism-numerology-v1",
  "cross": "prism-cross-v1"
}
```

### *_result

각 계산 엔진의 구조화 결과.

### normalized_traits

Normalized Interpretation Layer 결과.

### cross_analysis

Agreement / Complementary / Divergence / Insufficient 결과.

### narrative

최종 사용자 표시용 해석.

### narrative_source

- Gemini 호출 성공: `gemini`
- deterministic fallback: `fallback`

### llm_model

Gemini 사용 시 모델 ID.

Fallback이면 null 허용.

### schema_version

DB에 저장된 result JSON 구조 버전.

---

## 7. 저장하지 않는 데이터

다음 값은 `analysis_results`에 저장하지 않는다.

- GEMINI_API_KEY
- Supabase secret key
- Google OAuth access token
- Google refresh token
- Supabase access token
- Supabase refresh token
- Gemini 시스템 Prompt 원문
- Chain-of-thought
- 불필요한 Request Header
- IP Address
- User-Agent

---

## 8. RLS

`analysis_results`는 반드시 Row Level Security를 활성화한다.

```sql
alter table public.analysis_results
  enable row level security;
```

### SELECT

본인 데이터만:

```sql
create policy "users_select_own_analysis"
on public.analysis_results
for select
to authenticated
using ((select auth.uid()) = user_id);
```

### INSERT

본인 row만:

```sql
create policy "users_insert_own_analysis"
on public.analysis_results
for insert
to authenticated
with check ((select auth.uid()) = user_id);
```

### DELETE

본인 row만:

```sql
create policy "users_delete_own_analysis"
on public.analysis_results
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

### UPDATE

MVP에서는 제공하지 않는다.

저장 결과는 immutable snapshot이다.

---

## 9. 권한

DB 권한:

```sql
grant select, insert, delete
on public.analysis_results
to authenticated;
```

`anon` role에는 table CRUD 권한을 부여하지 않는다.

비로그인 사용자 분석은 `/api/analyze`에서만 수행한다.

---

## 10. API

### POST /api/results

로그인 필수.

Request:

```json
{
  "analysis": "<QuickAnalysisResponse or DetailedAnalysisResponse>"
}
```

서버 책임:

1. 로그인 사용자 검증
2. Request shape 검증
3. Body size 제한
4. server user id를 사용
5. 허용된 필드만 mapping
6. DB insert
7. result id 반환

Response:

```json
{
  "id": "uuid",
  "saved": true
}
```

### GET /api/results

로그인 필수.

최근 저장 결과 목록.

Default:

- created_at DESC
- limit 20

목록에서는 큰 JSON payload 전체를 반환하지 않는다.

반환:

- id
- analysis_type
- birth_date
- narrative summary
- created_at

### GET /api/results/:id

본인 결과 1건.

RLS + 서버 인증 둘 다 적용.

### DELETE /api/results/:id

본인 결과 삭제.

---

## 11. Client 저장 Flow

### 이미 로그인

```text
Save
 ↓
POST /api/results
 ↓
Success
 ↓
"내 프리즘 도감에 저장했어요"
```

### 비로그인

```text
Save
 ↓
sessionStorage pending result
 ↓
Google OAuth
 ↓
Callback
 ↓
session 확인
 ↓
POST /api/results
 ↓
pending result 제거
```

---

## 12. Data Validation

클라이언트 JSON을 그대로 DB에 INSERT하지 않는다.

서버에서 최소한 다음을 확인한다.

- input.date format
- analysis_type
- engines.saju 존재
- engines.astrology 존재
- engines.numerology 존재
- normalized array
- cross array
- narrative object
- generatedBy enum
- JSON payload max size

권장 Body Limit:

```text
<= 256 KB
```

MVP JSON이 이를 초과하면 구조를 재검토한다.

---

## 13. Integrity Policy

DB 저장 결과는 "사용자에게 당시 보여준 snapshot"을 보존하는 목적이다.

따라서 이후:

- Gemini 모델 변경
- 교차분석 Rule 변경
- 사주 Engine 변경

이 발생해도 기존 row를 자동 업데이트하지 않는다.

대신:

- engine_versions
- schema_version
- narrative_source
- llm_model

로 당시 상태를 추적한다.

---

## 14. 개인정보 정책

저장되는 출생정보는 개인 데이터로 취급한다.

MVP 원칙:

- 저장은 명시적 사용자 행동으로만 수행
- 본인만 조회 가능
- 사용자가 삭제 가능
- 계정 삭제 시 `on delete cascade`로 결과 삭제
- 광고/추천용 2차 사용 금지
- 공개 공유 기능은 별도 Spec 전까지 금지

---

## 15. Supabase 상태

현재 Prism Supabase 프로젝트의 `public` schema에는 테이블이 없다.

따라서 본 Spec 승인 후 migration으로 `analysis_results`를 생성한다.

DDL 변경은 Supabase migration으로 수행한다.

SQL Editor에서 임시로 만들고 끝내지 않는다.

예상 migration name:

```text
create_analysis_results
```

---

## 16. Error Cases

### 401 Unauthorized

로그인 세션 없음.

처리:

- Google Login CTA
- 결과 자체는 화면에서 유지

### 403 / RLS

다른 사용자 row 접근.

사용자에게 일반적인 Not Found 메시지 제공 가능.

### Database unavailable

저장 실패.

분석 결과는 화면에 그대로 유지하고 재시도 버튼 제공.

### Duplicate save

MVP에서는 동일 결과 중복 저장을 허용한다.

중복 방지는 후속 기능으로 둔다.

### Oversized payload

400 처리.

---

## 17. Acceptance Criteria

- [ ] 로그인하지 않아도 분석 가능
- [ ] 로그인하지 않은 상태에서는 DB row 자동 생성 안 됨
- [ ] 로그인 사용자만 결과 저장 가능
- [ ] 저장 row의 user_id는 서버가 인증 사용자로 설정
- [ ] Quick result 저장 가능
- [ ] engine_versions 저장
- [ ] cross analysis 저장
- [ ] Gemini/fallback source 저장
- [ ] 저장된 결과 목록 조회 가능
- [ ] 저장된 결과 상세 조회 가능
- [ ] 본인 결과 삭제 가능
- [ ] 타 사용자 결과 조회 불가
- [ ] anon role로 table 조회 불가
- [ ] 계정 삭제 시 저장 결과 cascade delete
- [ ] 기존 저장 결과는 엔진 버전 변경 후에도 수정되지 않음

---

## 18. Test Cases

### DB-001
비로그인 분석 → `analysis_results` row 0개 증가.

### DB-002
로그인 후 Save → row 1개 증가.

### DB-003
저장 row user_id == 현재 auth.uid().

### DB-004
User A가 User B result id SELECT → 결과 없음/권한 거부.

### DB-005
User A가 User B result DELETE → 삭제 실패.

### DB-006
Quick result 저장 시 birth_time / birth_place null.

### DB-007
Gemini result → narrative_source=`gemini`, llm_model 기록.

### DB-008
Fallback result → narrative_source=`fallback`.

### DB-009
사용자 삭제 → 해당 user의 analysis_results 삭제.

### DB-010
잘못된 payload → 400, DB insert 없음.

### DB-011
DB 장애 → 화면의 현재 분석 결과 유지.

### DB-012
동일 분석 2회 저장 → MVP에서는 두 snapshot 모두 유지.

---

## 19. Migration 후 필수 검증

Migration 적용 직후:

1. `list_tables`로 schema 확인
2. Security Advisor 실행
3. RLS enabled 확인
4. policy 확인
5. anon 접근 차단 확인
6. authenticated 본인 CRUD 확인

검증 전에는 완료 처리하지 않는다.

---

## 20. 완료 후 검증 기록

구현 전이므로 아직 없음.


---

## 구현 상태

구현 코드는 GitHub `main`에 반영됨.

아직 완료 처리하지 않은 이유:

- 실제 localhost Google OAuth 성공 테스트가 필요함
- 실제 사용자 session으로 RLS 저장/조회/삭제 테스트가 필요함
- 로컬 `npm run check` / `npm run build` 재검증이 필요함
