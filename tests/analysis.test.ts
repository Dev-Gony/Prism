import test from "node:test";
import assert from "node:assert/strict";
import { parseBirthDate } from "../lib/analysis/input";
import { calculateNumerologyQuick } from "../lib/numerology/quick";
import { calculateSajuQuick } from "../lib/saju/quick";
import { crossAnalyze } from "../lib/analysis/cross";
import type { TraitScore } from "../lib/analysis/types";

test("생년월일 입력을 검증한다",()=>{
  assert.deepEqual(parseBirthDate("1998-05-12"),{
    date:"1998-05-12",year:1998,month:5,day:12,
  });
  assert.throws(()=>parseBirthDate("1998-02-30"));
  assert.throws(()=>parseBirthDate("1899-12-31"));
});

test("수비학 Life Path를 결정론적으로 계산한다",()=>{
  assert.equal(calculateNumerologyQuick("1995-10-24").lifePath,4);
  assert.equal(calculateNumerologyQuick("1998-05-12").lifePath,8);
});

test("Quick 사주에서 시주를 제외하고 년월일주만 계산한다",()=>{
  const result=calculateSajuQuick(2024,2,3);
  assert.equal(result.pillars.length,3);
  assert.equal(result.pillars[2].text,"丁酉");
  assert.equal(Object.values(result.elements).reduce((sum,count)=>sum+count,0),6);
});

test("교차분석은 점수 범위로 상태를 분류한다",()=>{
  const traits:TraitScore[]=[
    {trait:"autonomy",score:4,source:"saju",evidence:[]},
    {trait:"autonomy",score:5,source:"astrology",evidence:[]},
    {trait:"autonomy",score:4,source:"numerology",evidence:[]},
    {trait:"care",score:1,source:"saju",evidence:[]},
    {trait:"care",score:5,source:"astrology",evidence:[]},
    {trait:"care",score:2,source:"numerology",evidence:[]},
  ];
  const result=crossAnalyze(traits);
  assert.equal(result.find((item)=>item.trait==="autonomy")?.status,"AGREEMENT");
  assert.equal(result.find((item)=>item.trait==="care")?.status,"DIVERGENCE");
});
