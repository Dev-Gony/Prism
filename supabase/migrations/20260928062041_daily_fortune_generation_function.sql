create or replace function public.generate_daily_fortunes(
  target_date date default ((now() at time zone 'Asia/Seoul')::date)
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  affected_rows bigint;
begin
  with preferred as (
    select distinct on (analysis.user_id)
      analysis.id,
      analysis.user_id,
      analysis.analysis_type,
      analysis.saju_result,
      analysis.astrology_result,
      analysis.numerology_result,
      analysis.narrative
    from public.analysis_results as analysis
    order by
      analysis.user_id,
      case when analysis.analysis_type = 'detailed' then 0 else 1 end,
      analysis.created_at desc
  ),
  seeded as (
    select
      preferred.*,
      md5(preferred.id::text || '|' || target_date::text) as seed
    from preferred
  ),
  scored as (
    select
      seeded.*,
      58 + ((('x' || substr(seeded.seed, 1, 8))::bit(32)::bigint % 35)::integer) as focus_score,
      58 + ((('x' || substr(seeded.seed, 9, 8))::bit(32)::bigint % 35)::integer) as relationship_score,
      58 + ((('x' || substr(seeded.seed, 17, 8))::bit(32)::bigint % 35)::integer) as balance_score,
      1 + ((('x' || substr(seeded.seed, 25, 8))::bit(32)::bigint % 5)::integer) as headline_index
    from seeded
  )
  insert into public.daily_fortunes (
    user_id,
    source_analysis_id,
    fortune_date,
    fortune,
    updated_at
  )
  select
    scored.user_id,
    scored.id,
    target_date,
    jsonb_build_object(
      'schemaVersion', 'v1',
      'date', target_date::text,
      'overallScore', round((scored.focus_score + scored.relationship_score + scored.balance_score) / 3.0),
      'headline', (array[
        '작은 선택을 선명하게 만드는 날',
        '속도보다 방향을 살피기 좋은 날',
        '흩어진 생각을 한곳에 모으는 날',
        '익숙한 흐름에 새 관점을 더하는 날',
        '관계와 내 리듬의 균형을 맞추는 날'
      ])[scored.headline_index],
      'summary', case
        when scored.narrative->'keywords'->0->>'title' is not null
          then format(
            '내 분석의 핵심 키워드인 ‘%s’을 오늘의 선택에 가볍게 적용해 보세요.',
            scored.narrative->'keywords'->0->>'title'
          )
        else '저장된 세 가지 분석 신호를 바탕으로 오늘의 리듬을 정리했어요.'
      end,
      'areas', jsonb_build_array(
        jsonb_build_object(
          'key', 'focus',
          'label', '집중',
          'score', scored.focus_score,
          'guidance', '해야 할 일을 세 가지보다 적게 고르고, 가장 중요한 한 가지부터 마무리해 보세요.'
        ),
        jsonb_build_object(
          'key', 'relationship',
          'label', '관계',
          'score', scored.relationship_score,
          'guidance', '상대의 뜻을 추측하기보다 짧고 분명하게 확인하는 대화가 도움이 됩니다.'
        ),
        jsonb_build_object(
          'key', 'balance',
          'label', '균형',
          'score', scored.balance_score,
          'guidance', '짧은 산책이나 스트레칭으로 생각과 몸의 속도를 한 번 맞춰 보세요.'
        )
      ),
      'signals', jsonb_build_array(
        coalesce(scored.saju_result->>'dominantElement', '사주'),
        coalesce(scored.astrology_result->>'sunSign', '점성술'),
        coalesce(scored.numerology_result->>'lifePath', '수비학')
      ),
      'source', jsonb_build_object(
        'analysisId', scored.id,
        'analysisType', scored.analysis_type
      ),
      'disclaimer', '전통적·문화적 자기탐색을 위한 참고 정보이며 미래를 보장하지 않습니다.'
    ),
    now()
  from scored
  on conflict (user_id, fortune_date)
  do update set
    source_analysis_id = excluded.source_analysis_id,
    fortune = excluded.fortune,
    updated_at = excluded.updated_at;

  get diagnostics affected_rows = row_count;

  return jsonb_build_object(
    'fortuneDate', target_date::text,
    'processedUsers', affected_rows
  );
end;
$$;

revoke all on function public.generate_daily_fortunes(date) from public;
revoke all on function public.generate_daily_fortunes(date) from anon;
revoke all on function public.generate_daily_fortunes(date) from authenticated;
grant execute on function public.generate_daily_fortunes(date) to service_role;
