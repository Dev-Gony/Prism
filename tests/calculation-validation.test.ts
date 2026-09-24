import test from "node:test";
import assert from "node:assert/strict";
import { normalizeBirthInput } from "../lib/analysis/calendar";
import type { DetailedAnalysisResponse } from "../lib/analysis/detailed-types";
import { getBirthplace } from "../lib/analysis/birthplaces";
import {
  calculateAstrologyDetailed,
  signFromLongitude,
} from "../lib/astrology/detailed";
import {
  calculateWholeSignHouses,
  houseForLongitude,
} from "../lib/astrology/houses";
import { calculateSolarReturn } from "../lib/astrology/solar-return";
import { calculateNumerologyDetailed } from "../lib/numerology/detailed";
import { calculateNameNumerology } from "../lib/numerology/name";
import { calculateSajuDetailed } from "../lib/saju/detailed";
import { calculateSajuQuick } from "../lib/saju/quick";

function angularDistance(a: number, b: number) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

test("사주 Quick은 lunar-javascript 공개 기준 사례의 년월일주와 일치한다", () => {
  // lunar-javascript README reference:
  // 1986-05-29 => 丙寅 year / 癸巳 month / 癸酉 day.
  const result = calculateSajuQuick(1986, 5, 29);

  assert.deepEqual(
    result.pillars.map((pillar) => pillar.text),
    ["丙寅", "癸巳", "癸酉"],
  );
  assert.equal(result.dayMaster.character, "癸");
});

test("대운 sect 2는 upstream Yun golden case를 KST 보정 후 재현한다", () => {
  // lunar-javascript __tests__/Yun.test.js test5:
  // Solar 2022-03-09 20:51, male, sect=2
  // => 8y 9m 2d, start date 2030-12-12.
  // Prism accepts KST, so 21:51 KST is converted to the upstream 20:51 civil time.
  const result = calculateSajuDetailed(2022, 3, 9, 21, 51, "male");

  assert.equal(result.daYun.available, true);
  assert.equal(result.daYun.genderCode, 1);
  assert.equal(result.daYun.sect, 2);
  assert.ok(result.daYun.startOffset);
  assert.equal(result.daYun.startOffset.years, 8);
  assert.equal(result.daYun.startOffset.months, 9);
  assert.equal(result.daYun.startOffset.days, 2);
  assert.equal(result.daYun.startDateTime?.slice(0, 10), "2030-12-12");
  assert.equal(result.daYun.periods.length, 10);
});

test("음력 입력은 알려진 설날 기준일을 양력으로 변환한다", () => {
  const result = normalizeBirthInput("2024-01-01", "lunar", false);

  assert.equal(result.date, "2024-02-10");
  assert.equal(result.calendarType, "lunar");
  assert.equal(result.originalDate, "2024-01-01");
  assert.equal(result.isLeapMonth, false);
});

test("점성술 Detailed는 KST를 UTC로 변환하고 시간 의존 차트를 만든다", () => {
  const seoul = getBirthplace("seoul");
  assert.ok(seoul);

  const result = calculateAstrologyDetailed(
    1995,
    10,
    24,
    15,
    30,
    seoul,
  );

  assert.equal(result.instantUtc, "1995-10-24T06:30:00.000Z");
  assert.equal(result.bodies.length, 10);
  assert.equal(result.sunSign, "전갈자리");
  assert.equal(result.houseSystem, "whole-sign");
  assert.equal(result.houses.length, 12);
  assert.ok(result.ascendant);
  assert.ok(result.midheaven);
  assert.ok(result.descendant);
  assert.ok(result.imumCoeli);

  for (const body of result.bodies) {
    assert.ok(body.longitude >= 0 && body.longitude < 360);
    assert.ok(typeof body.house === "number");
    assert.ok(body.house >= 1 && body.house <= 12);
  }
});

test("Whole Sign 하우스의 축과 배정 규칙은 기하학적 불변조건을 지킨다", () => {
  const chart = calculateWholeSignHouses(
    new Date("2000-01-01T12:00:00.000Z"),
    37.5665,
    126.978,
  );

  assert.equal(chart.houses.length, 12);
  assert.ok(
    Math.abs(
      angularDistance(
        chart.ascendant.longitude,
        chart.descendant.longitude,
      ) - 180,
    ) < 0.001,
  );
  assert.ok(
    Math.abs(
      angularDistance(
        chart.midheaven.longitude,
        chart.imumCoeli.longitude,
      ) - 180,
    ) < 0.001,
  );

  assert.equal(
    houseForLongitude(
      chart.ascendant.longitude,
      chart.ascendant.longitude,
    ),
    1,
  );
  assert.equal(
    houseForLongitude(
      (chart.ascendant.longitude + 180) % 360,
      chart.ascendant.longitude,
    ),
    7,
  );

  chart.houses.forEach((house, index) => {
    assert.equal(house.house, index + 1);
    const next =
      chart.houses[(index + 1) % chart.houses.length].longitude;
    const step = (next - house.longitude + 360) % 360;
    assert.equal(step, 30);
  });
});

test("황경 별자리 경계는 0~360도 wrap을 안정적으로 처리한다", () => {
  assert.equal(signFromLongitude(0).sign, "양자리");
  assert.equal(signFromLongitude(29.999).sign, "양자리");
  assert.equal(signFromLongitude(30).sign, "황소자리");
  assert.equal(signFromLongitude(359.999).sign, "물고기자리");
  assert.equal(signFromLongitude(360).sign, "양자리");
  assert.equal(signFromLongitude(-0.001).sign, "물고기자리");
});

test("수비학 Detailed 기준값은 독립 계산값과 일치한다", () => {
  const result = calculateNumerologyDetailed(
    "1995-10-24",
    "2026-09-24",
  );

  assert.equal(result.lifePath, 4);
  assert.equal(result.birthdayNumber, 6);
  assert.equal(result.attitudeNumber, 7);
  assert.deepEqual(result.periodCycles, {
    first: 1,
    second: 6,
    third: 6,
  });
  assert.deepEqual(result.pinnacles, [7, 3, 1, 7]);
  assert.deepEqual(result.challenges, [5, 0, 5, 5]);
  assert.deepEqual(result.personalCycles, {
    asOfDate: "2026-09-24",
    personalYear: 8,
    personalMonth: 8,
    personalDay: 5,
  });
});

test("이름 수비학은 Pythagorean letter mapping 기준값을 유지한다", () => {
  const result = calculateNameNumerology("ALAN TURING", 4);

  assert.equal(result.normalizedName, "ALAN TURING");
  assert.equal(result.letterCount, 10);
  assert.equal(result.expression, 9);
  assert.equal(result.soulUrge, 5);
  assert.equal(result.personality, 4);
  assert.equal(result.maturity, 4);
  assert.equal(result.balance, 3);
  assert.deepEqual(result.hiddenPassion, [1, 3, 5, 9]);
  assert.deepEqual(result.karmicLessons, [4, 6, 8]);
  assert.equal(result.subconsciousSelf, 6);
});

test("Solar Return은 natal Sun으로 정확 복귀하고 장소 입력 시 12 Houses를 만든다", () => {
  const seoul = getBirthplace("seoul");
  assert.ok(seoul);

  const astrology = calculateAstrologyDetailed(
    1995,
    10,
    24,
    15,
    30,
    seoul,
  );

  const analysis = {
    input: {
      date: "1995-10-24",
      time: "15:30",
      timeKnown: true,
      birthplaceId: "seoul",
    },
    engines: {
      astrology,
    },
  } as unknown as DetailedAnalysisResponse;

  const result = calculateSolarReturn(analysis, 2026, {
    label: "서울",
    latitude: seoul.latitude,
    longitude: seoul.longitude,
    timezone: seoul.timezone,
  });

  assert.equal(result.year, 2026);
  assert.equal(result.precision, "exact-birth-time");
  assert.ok(result.residualOrb <= 0.01);
  assert.equal(result.bodies.length, 10);
  assert.equal(result.houses.length, 12);
  assert.ok(result.angles);
  assert.equal(result.location?.label, "서울");
});
