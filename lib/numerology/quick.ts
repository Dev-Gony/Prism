import type { NumerologyQuickResult } from "@/lib/analysis/types";

const MASTER_NUMBERS = new Set([11,22,33]);
const MEANING: Record<number,string> = {
  1:"자기주도",2:"협력과 조율",3:"표현과 창의",4:"구조와 안정",
  5:"변화와 자유",6:"돌봄과 책임",7:"탐구와 성찰",8:"성취와 실행",
  9:"이상과 공감",11:"직관과 영감",22:"큰 구조를 현실화",33:"돌봄과 헌신",
};

function reduceNumber(value:number, history:number[]):number {
  if (value < 10 || MASTER_NUMBERS.has(value)) return value;
  const next = String(value).split("").reduce((sum,digit)=>sum+Number(digit),0);
  history.push(next);
  return reduceNumber(next,history);
}

export function calculateNumerologyQuick(date:string):NumerologyQuickResult {
  const digits = date.replace(/\D/g,"").split("").map(Number);
  const initial = digits.reduce((sum,digit)=>sum+digit,0);
  const reduction = [initial];
  const lifePath = reduceNumber(initial,reduction);

  return {
    lifePath,
    reduction,
    meaningKey: MEANING[lifePath] ?? "개인적 성장",
    method: "생년월일 숫자를 모두 합산한 뒤 11·22·33을 제외하고 한 자리 수가 될 때까지 축약하는 MVP 규칙",
  };
}
