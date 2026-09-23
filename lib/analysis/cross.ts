import type { CrossInsight,CrossStatus,TraitKey,TraitScore } from "@/lib/analysis/types";

const LABELS:Record<TraitKey,string>={
  autonomy:"자기 주도성과 독립성",
  reflection:"깊이 생각하고 성찰하는 방식",
  stability:"안정과 구조를 중요하게 보는 정도",
  sociability:"사람과 관계 맺는 방식",
  creativity:"표현과 아이디어를 펼치는 방식",
  adaptability:"변화에 적응하는 방식",
  care:"돌봄과 공감의 방향",
};

export function traitLabel(trait:TraitKey){return LABELS[trait];}

function classify(scores:number[]):CrossStatus{
  if(scores.length<2)return "INSUFFICIENT";
  const range=Math.max(...scores)-Math.min(...scores);
  if(range<=1)return "AGREEMENT";
  if(range>=3)return "DIVERGENCE";
  return "COMPLEMENTARY";
}

export function crossAnalyze(traits:TraitScore[]):CrossInsight[]{
  const grouped=new Map<TraitKey,TraitScore[]>();
  traits.forEach((item)=>{
    const bucket=grouped.get(item.trait)??[];
    bucket.push(item);
    grouped.set(item.trait,bucket);
  });

  return Array.from(grouped.entries()).map(([trait,items])=>{
    const scores=items.map((item)=>item.score);
    const status=classify(scores);
    const range=scores.length?Math.max(...scores)-Math.min(...scores):5;
    return {
      trait,
      status,
      label:LABELS[trait],
      agreement:status==="INSUFFICIENT"?0:Math.max(0,100-range*22),
      sources:items.map((item)=>({source:item.source,score:item.score,evidence:item.evidence})),
    };
  }).sort((a,b)=>b.agreement-a.agreement);
}
