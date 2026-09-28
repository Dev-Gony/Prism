import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { hasValidCronAuthorization } from "../lib/cron-auth";
import {
  buildGuestDailyFortune,
  getKstDate,
} from "../lib/daily-fortune";

test("KST 날짜는 UTC 날짜 경계를 한국 시간으로 변환한다", () => {
  assert.equal(getKstDate(new Date("2026-09-27T15:00:00.000Z")), "2026-09-28");
});

const guestAnalysis = {
  input: { date: "1998-05-12" },
  engines: {
    saju: { dominantElement: "화" },
    astrology: { sunSign: "Taurus" },
    numerology: { lifePath: 8 },
  },
  narrative: { keywords: [{ title: "차분한 추진력" }] },
};

test("비로그인 오늘 운세는 같은 분석과 날짜에 결정론적으로 생성된다", () => {
  const first = buildGuestDailyFortune(guestAnalysis, "2026-09-28");
  const second = buildGuestDailyFortune(guestAnalysis, "2026-09-28");

  assert.deepEqual(first, second);
  assert.equal(first.source.analysisId, "guest-session");
  assert.equal(first.areas.length, 3);
  assert.ok(first.areas.every((area) => area.score >= 58 && area.score <= 92));
});

test("비로그인 오늘 운세는 날짜가 바뀌면 새 seed를 사용한다", () => {
  const today = buildGuestDailyFortune(guestAnalysis, "2026-09-28");
  const tomorrow = buildGuestDailyFortune(guestAnalysis, "2026-09-29");

  assert.notDeepEqual(today, tomorrow);
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
  assert.match(panelSource, /로그인 없이 오늘의 운세를 볼 수 있어요/);
  assert.match(panelSource, /오늘의 운세 분석하기/);
});

test("오늘 운세가 없으면 로그인 사용자의 저장 분석으로 즉시 생성한다", () => {
  const routeSource = readFileSync(
    new URL("../app/api/daily-fortune/route.ts", import.meta.url),
    "utf8",
  );
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20260928074903_daily_fortune_on_demand.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(routeSource, /if \(!data\)[\s\S]*rpc\([\s\S]*"generate_my_daily_fortune"/);
  assert.match(routeSource, /if \(generated\)[\s\S]*from\("daily_fortunes"\)/);
  assert.match(sql, /security definer/i);
  assert.match(sql, /current_user_id uuid := \(select auth\.uid\(\)\)/i);
  assert.match(sql, /where analysis\.user_id = current_user_id/i);
  assert.match(sql, /revoke all on function public\.generate_my_daily_fortune\(date\) from public/i);
  assert.match(sql, /grant execute on function public\.generate_my_daily_fortune\(date\) to authenticated/i);
});

test("웹 푸시 구독 migration은 RLS와 본인 소유 정책을 강제한다", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20260928090000_daily_fortune_push_subscriptions.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(sql, /create table if not exists public\.push_subscriptions/i);
  assert.match(sql, /unique \(user_id, endpoint\)/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on table public\.push_subscriptions from anon/i);
  assert.match(sql, /with check \(\(select auth\.uid\(\)\) = user_id\)/i);
  assert.match(sql, /using \(\(select auth\.uid\(\)\) = user_id\)/i);
});

test("Service Worker는 오늘의 운세 알림과 고정 운영 주소를 사용한다", () => {
  const worker = readFileSync(
    new URL("../public/push-sw.js", import.meta.url),
    "utf8",
  );

  assert.match(worker, /오늘의 운세가 도착했어요/);
  assert.match(worker, /notificationclick/);
  assert.match(worker, /https:\/\/prism-nine-livid\.vercel\.app\/\?source=push#daily-fortune/);
  assert.match(worker, /openWindow\(targetUrl\)/);
});

test("알림 구독 API는 로그인과 HTTPS endpoint를 검증한다", () => {
  const route = readFileSync(
    new URL("../app/api/push/subscriptions/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(route, /supabase\.auth\.getUser\(\)/);
  assert.match(route, /endpoint\.protocol !== "https:"/);
  assert.match(route, /onConflict: "user_id,endpoint"/);
  assert.doesNotMatch(route, /SUPABASE_SECRET_KEY/);
});

test("Cron은 생성 뒤 활성 구독자에게 알림을 보내고 만료 구독을 끈다", () => {
  const route = readFileSync(
    new URL("../app/api/cron/daily-fortune/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(route, /generate_daily_fortunes/);
  assert.match(route, /from\("push_subscriptions"\)/);
  assert.match(route, /sendDailyFortunePush/);
  assert.match(route, /status === 404 \|\| status === 410/);
  assert.match(route, /enabled: false/);
});
