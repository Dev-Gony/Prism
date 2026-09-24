# Prism Data Loop

Prism은 기능을 계속 늘리는 것보다 **사용 → 측정 → 해석 → 개선** 루프를 제품 개발의 기본 흐름으로 둔다.

## 1. 핵심 퍼널

1. `landing_view`
2. `quick_started`
3. `quick_completed`
4. `detailed_opened`
5. `detailed_completed`
6. `save_clicked`
7. `result_saved`
8. `ask_prism_used`
9. `share_card_created`
10. `destiny_timeline_opened`
11. `destiny_date_inspected`
12. `feedback_submitted`

### 우선 보는 지표

- Landing → Quick 시작률
- Quick 시작 → 완료율
- Quick 완료 → Detailed 진입률
- Detailed 진입 → 완료율
- 결과 완료 → 저장 클릭률
- 저장 클릭 → 실제 저장 성공률
- Detailed 완료 → Ask Prism 사용률
- 저장 결과 → 공유 카드 생성률
- Helpful / Not helpful 비율

## 2. 이벤트 데이터 원칙

- 익명 사용자도 session_id 단위로 퍼널을 볼 수 있다.
- 로그인 사용자는 user_id가 함께 남는다.
- 이벤트에는 생년월일, 이메일, 이름 같은 직접 개인 정보를 properties로 넣지 않는다.
- 이벤트 수집 실패가 분석 기능을 막으면 안 된다.
- 실제 분석 결과는 기존 `analysis_results`에 별도로 저장한다.

## 3. 피드백

`product_feedback`:

- helpful: boolean
- reason: 최대 500자
- report_id: 로그인 사용자의 저장 리포트에서만 연결
- analysis_type: quick / detailed

### 해석 예시

Helpful 비율이 낮다고 곧바로 "AI 품질 문제"라고 결론 내리지 않는다.

함께 본다:

- narrative_source: Gemini / fallback
- Quick / Detailed
- Ask Prism 사용 여부
- 결과 저장 여부
- 공유 여부
- 자유 피드백 내용

예를 들어:

- Detailed Helpful은 높은데 Quick Helpful만 낮다
  → Quick 결과의 구체성이 부족할 가능성

- Gemini 결과 Helpful은 높은데 fallback 결과만 낮다
  → fallback narrative 개선 우선

- 완료율은 높은데 저장률이 낮다
  → 결과 가치, 저장 CTA, 로그인 장벽 중 무엇이 문제인지 추가 실험

## 4. 첫 번째 개선 실험

### 가설 A
Quick 결과에서 "세 관점이 왜 이렇게 나왔는지" 근거가 더 잘 보이면 Detailed 진입률이 올라간다.

측정:
- quick_completed
- detailed_opened
- 상세 CTA 위치/문구 변경 전후

### 가설 B
결과가 너무 일반적으로 느껴지면 Helpful 비율이 낮아진다.

측정:
- feedback_submitted
- reason 텍스트
- narrative_source
- analysis_type

### 가설 C
공유 카드가 있으면 저장 리포트 재방문 동기가 늘어난다.

측정:
- share_card_created
- result_saved
- 동일 user/session의 후속 방문

## 5. 운영 SQL 예시

### 최근 7일 이벤트 수

```sql
select
  event_name,
  count(*) as events,
  count(distinct session_id) as sessions
from public.product_events
where created_at >= now() - interval '7 days'
group by event_name
order by events desc;
```

### Quick 퍼널

```sql
with sessions as (
  select
    session_id,
    bool_or(event_name = 'landing_view') as landed,
    bool_or(event_name = 'quick_started') as quick_started,
    bool_or(event_name = 'quick_completed') as quick_completed,
    bool_or(event_name = 'detailed_opened') as detailed_opened
  from public.product_events
  where created_at >= now() - interval '7 days'
  group by session_id
)
select
  count(*) filter (where landed) as landing_sessions,
  count(*) filter (where quick_started) as quick_started_sessions,
  count(*) filter (where quick_completed) as quick_completed_sessions,
  count(*) filter (where detailed_opened) as detailed_opened_sessions
from sessions;
```

### Helpful 비율

```sql
select
  analysis_type,
  count(*) as responses,
  round(100.0 * avg(case when helpful then 1 else 0 end), 1) as helpful_rate
from public.product_feedback
where created_at >= now() - interval '30 days'
group by analysis_type;
```

### 아쉬운 피드백 보기

```sql
select
  created_at,
  analysis_type,
  reason
from public.product_feedback
where helpful = false
  and reason is not null
order by created_at desc
limit 100;
```

## 6. 의사결정 원칙

Prism의 다음 기능은 "생각해보니 있으면 좋아 보임"만으로 정하지 않는다.

1. 실제 사용 데이터에서 이탈 구간 확인
2. 사용자 피드백과 함께 원인 가설 작성
3. 한 번에 한 가지 핵심 변경
4. 변경 전/후 지표 비교
5. 유지 / 수정 / 제거 결정

이 문서 자체를 포트폴리오에서 **제품 분석 및 데이터 기반 의사결정 과정**의 기준 문서로 활용한다.
