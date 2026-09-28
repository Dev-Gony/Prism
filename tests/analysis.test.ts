import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseBirthDate } from "../lib/analysis/input";
import { calculateNumerologyQuick } from "../lib/numerology/quick";
import { calculateSajuQuick } from "../lib/saju/quick";
import {
  buildCrossExplanation,
  crossAnalyze,
  sourceTraitSummary,
} from "../lib/analysis/cross";
import { fallbackNarrative } from "../lib/analysis/fallback";
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

test("같은 점수라도 교차영역에 따라 방향 설명이 달라진다",()=>{
  const stability=sourceTraitSummary("stability",4);
  const creativity=sourceTraitSummary("creativity",4);

  assert.match(stability,/구조와 지속성/);
  assert.match(creativity,/아이디어/);
  assert.notEqual(stability,creativity);
});

test("통합 해석은 교차 상태와 실제 엔진 점수를 반영한다",()=>{
  const traits:TraitScore[]=[
    {trait:"autonomy",score:4,source:"saju",evidence:[]},
    {trait:"autonomy",score:5,source:"astrology",evidence:[]},
    {trait:"autonomy",score:4,source:"numerology",evidence:[]},
    {trait:"care",score:1,source:"saju",evidence:[]},
    {trait:"care",score:5,source:"astrology",evidence:[]},
    {trait:"care",score:2,source:"numerology",evidence:[]},
  ];
  const result=crossAnalyze(traits);
  const autonomy=result.find((item)=>item.trait==="autonomy");
  const care=result.find((item)=>item.trait==="care");

  assert.ok(autonomy);
  assert.ok(care);
  assert.match(buildCrossExplanation(autonomy),/세 관점이 모두/);
  assert.match(buildCrossExplanation(care),/Stella는 5\/5, Modi는 1\/5/);
  assert.notEqual(buildCrossExplanation(autonomy),buildCrossExplanation(care));
});

test("fallback 교차 카드 설명은 서로 반복되지 않는다",()=>{
  const traits:TraitScore[]=["autonomy","stability","creativity"].flatMap((trait)=>([
    {trait,score:4,source:"saju",evidence:[]},
    {trait,score:4,source:"astrology",evidence:[]},
    {trait,score:5,source:"numerology",evidence:[]},
  ])) as TraitScore[];
  const narrative=fallbackNarrative(crossAnalyze(traits));
  const explanations=narrative.crossHighlights.map((item)=>item.explanation);

  assert.equal(new Set(explanations).size,3);
});

test("교차분석 화면은 쉬운 점수 설명과 접힌 계산 근거를 제공한다",()=>{
  const page=readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");

  assert.match(page,/sourceTraitSummary\(highlight\.trait, entry\.score\)/);
  assert.match(page,/<details className="evidence-details">/);
  assert.match(page,/<summary>계산 근거 보기<\/summary>/);
});
