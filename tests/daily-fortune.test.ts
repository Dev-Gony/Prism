import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { hasValidCronAuthorization } from "../lib/cron-auth";
import {
  getKstDate,
} from "../lib/daily-fortune";

test("KST 날짜는 UTC 날짜 경계를 한국 시간으로 변환한다", () => {
  assert.equal(getKstDate(new Date("2026-09-27T15:00:00.000Z")), "2026-09-28");
});

test("Cron은 정확한 Bearer secret만 허용한다", () => {
  assert.equal(hasValidCronAuthorization(null, "cron-secret"), false);
  assert.equal(
    hasValidCronAuthorization("Bearer wrong-secret", "cron-secret"),
    false,
  );
  assert.equal(
    hasValidCronAuthorization("Bearer cron-secret", "cron-secret"),
    true,
  );
});

test("daily_fortunes migration은 RLS와 본인 조회 정책을 강제한다", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20260928061740_daily_fortunes.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on table public\.daily_fortunes from anon/i);
  assert.match(sql, /grant select on table public\.daily_fortunes to authenticated/i);
  assert.match(sql, /using \(user_id = \(select auth\.uid\(\)\)\)/i);
  assert.match(sql, /unique \(user_id, fortune_date\)/i);
});

test("생성 함수는 날짜·분석 ID의 결정론적 seed와 Detailed 우선 규칙을 사용한다", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20260928062041_daily_fortune_generation_function.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(sql, /md5\(preferred\.id::text \|\| '\|' \|\| target_date::text\)/i);
  assert.match(sql, /case when analysis\.analysis_type = 'detailed' then 0 else 1 end/i);
  assert.match(sql, /on conflict \(user_id, fortune_date\)/i);
  assert.doesNotMatch(sql, /random\s*\(/i);
  assert.match(sql, /grant execute on function public\.generate_daily_fortunes\(date\) to service_role/i);
});

test("첫 화면은 비로그인 사용자에게도 오늘의 운세 진입점을 보여준다", () => {
  const pageSource = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const panelSource = readFileSync(
    new URL("../app/daily-fortune-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    pageSource,
    /<DailyFortunePanel[\s\S]*isAuthenticated=\{Boolean\(user\)\}/,
  );
  assert.doesNotMatch(pageSource, /\{user && <DailyFortunePanel/);
  assert.match(panelSource, /if \(!isAuthenticated\)/);
  assert.match(panelSource, /Google로 로그인하고 보기/);
});
