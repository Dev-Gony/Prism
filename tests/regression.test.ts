import test from "node:test";
import assert from "node:assert/strict";
import {
  addMonthsClamped,
  addYearsClamped,
  parseDateParts,
} from "../lib/analysis/asof";
import { buildDestinyTiming } from "../lib/analysis/destiny-timing";
import { getBirthplace } from "../lib/analysis/birthplaces";
import {
  calculateAstrologyDetailed,
  calculateAstrologyTransits,
} from "../lib/astrology/detailed";
import { calculateNumerologyDetailed } from "../lib/numerology/detailed";
import {
  calculateSajuAnnualFlow,
  calculateSajuDetailed,
  calculateSajuMonthlyFlow,
} from "../lib/saju/detailed";
import { calculateSajuQuick } from "../lib/saju/quick";

test("날짜 보정 회귀: 윤일과 월말을 안전하게 clamp한다", () => {
  assert.deepEqual(parseDateParts("2024-02-29"), {
    year: 2024,
    month: 2,
    day: 29,
  });
  assert.equal(addYearsClamped("2024-02-29", 1), "2025-02-28");
  assert.equal(addMonthsClamped("2024-01-31", 1), "2024-02-29");
  assert.equal(addMonthsClamped("2024-03-31", -1), "2024-02-29");
  assert.throws(() => parseDateParts("2025-02-29"));
});

test("출생시간 미상 회귀: 시주와 대운을 임의 생성하지 않는다", () => {
  const result = calculateSajuDetailed(
    1995,
    10,
    24,
    null,
    null,
    "male",
  );

  assert.equal(result.pillars.length, 3);
  assert.equal(result.pillars.some((pillar) => pillar.label === "시주"), false);
  assert.equal(result.daYun.available, false);
  assert.match(result.daYun.pendingReason ?? "", /출생시간/);
});

test("대운 기준 미입력 회귀: 출생시간이 있어도 순역 기준을 추정하지 않는다", () => {
  const result = calculateSajuDetailed(
    1995,
    10,
    24,
    15,
    30,
    null,
  );

  assert.equal(result.pillars.length, 4);
  assert.equal(result.daYun.available, false);
  assert.match(result.daYun.pendingReason ?? "", /남\/여/);
});

test("점성술 출생시간 미상 회귀: Moon과 각도/하우스를 제외한다", () => {
  const seoul = getBirthplace("seoul");
  assert.ok(seoul);

  const result = calculateAstrologyDetailed(
    1995,
    10,
    24,
    null,
    null,
    seoul,
  );

  assert.equal(result.timeKnown, false);
  assert.equal(result.instantUtc, null);
  assert.equal(result.bodies.length, 9);
  assert.equal(result.bodies.some((body) => body.body === "Moon"), false);
  assert.equal(result.moonSign, null);
  assert.equal(result.ascendant, null);
  assert.equal(result.midheaven, null);
  assert.equal(result.houseSystem, null);
  assert.equal(result.houses.length, 0);
  assert.ok(result.pending.includes("Moon"));
  assert.ok(result.pending.includes("12 Houses"));
});

test("고정 입력 계산은 반복 실행해도 동일하다", () => {
  const sajuA = calculateSajuQuick(1998, 5, 12);
  const sajuB = calculateSajuQuick(1998, 5, 12);
  assert.deepEqual(sajuA, sajuB);

  const numerologyA = calculateNumerologyDetailed(
    "1998-05-12",
    "2026-09-24",
  );
  const numerologyB = calculateNumerologyDetailed(
    "1998-05-12",
    "2026-09-24",
  );
  assert.deepEqual(numerologyA, numerologyB);
});

test("Transit 회귀: 고정 기준일 결과는 결정론적이고 orb 순으로 정렬된다", () => {
  const seoul = getBirthplace("seoul");
  assert.ok(seoul);

  const natal = calculateAstrologyDetailed(
    1995,
    10,
    24,
    15,
    30,
    seoul,
  );

  const first = calculateAstrologyTransits(
    natal.bodies,
    natal.ascendant,
    natal.midheaven,
    "2026-09-24",
  );
  const second = calculateAstrologyTransits(
    natal.bodies,
    natal.ascendant,
    natal.midheaven,
    "2026-09-24",
  );

  assert.deepEqual(first, second);
  assert.equal(first.asOfDate, "2026-09-24");
  assert.equal(first.bodies.length, 5);

  for (let index = 1; index < first.aspects.length; index += 1) {
    assert.ok(first.aspects[index - 1].orb <= first.aspects[index].orb);
  }
});

test("Destiny Timing 회귀: 고정 날짜에서 세 엔진 신호를 모두 유지한다", () => {
  const seoul = getBirthplace("seoul");
  assert.ok(seoul);

  const asOfDate = "2026-09-24";
  const sajuBase = calculateSajuDetailed(
    1995,
    10,
    24,
    15,
    30,
    "male",
  );
  const astrologyBase = calculateAstrologyDetailed(
    1995,
    10,
    24,
    15,
    30,
    seoul,
  );

  const saju = {
    ...sajuBase,
    annualFlow: calculateSajuAnnualFlow(
      sajuBase.pillars,
      sajuBase.dayMaster.character,
      asOfDate,
    ),
    monthlyFlow: calculateSajuMonthlyFlow(
      sajuBase.pillars,
      sajuBase.dayMaster.character,
      asOfDate,
    ),
  };

  const astrology = {
    ...astrologyBase,
    transits: calculateAstrologyTransits(
      astrologyBase.bodies,
      astrologyBase.ascendant,
      astrologyBase.midheaven,
      asOfDate,
    ),
  };

  const numerology = calculateNumerologyDetailed(
    "1995-10-24",
    asOfDate,
  );
  const timing = buildDestinyTiming(saju, astrology, numerology);

  assert.equal(timing.asOfDate, asOfDate);
  const sources = new Set(timing.signals.map((signal) => signal.source));
  assert.deepEqual(
    [...sources].sort(),
    ["astrology", "numerology", "saju"],
  );

  for (const convergence of timing.convergences) {
    assert.ok(convergence.sources.length >= 2);
    assert.ok(convergence.strength >= 67 && convergence.strength <= 100);
  }
});
