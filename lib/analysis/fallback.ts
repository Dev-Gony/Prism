import { traitLabel } from "@/lib/analysis/cross";
import type { AnalysisNarrative,CrossInsight,TraitKey } from "@/lib/analysis/types";

const WORDS:Record<TraitKey,string>={
  autonomy:"내 기준을 세우는 힘",
  reflection:"깊이 생각하는 눈",
  stability:"차분하게 기반을 다지는 힘",
  sociability:"사람과 연결되는 방식",
  creativity:"새롭게 표현하는 감각",
  adaptability:"흐름에 맞춰 움직이는 유연함",
  care:"다정하게 살피는 마음",
};

export function fallbackNarrative(cross:CrossInsight[]):AnalysisNarrative{
  const strongest=cross.slice(0,3);
  return {
    summary: strongest.length
      ? "세 관점을 함께 보면 "+strongest.map((item)=>WORDS[item.trait]).join(", ")+"이(가) 눈에 띄어요. 서로 다른 체계의 해석은 하나의 정답이 아니라 나를 바라보는 여러 렌즈로 보여드려요."
      : "세 관점의 결과를 계산했지만 아직 충분한 교차 해석을 만들지 못했어요.",
    keywords: strongest.map((item)=>({
      title:WORDS[item.trait],
      description:item.status==="AGREEMENT"
        ?"세 분석에서 비교적 비슷한 방향으로 반복해서 나타난 특징이에요."
        :item.status==="DIVERGENCE"
          ?"분석 체계마다 조금 다르게 바라보는 부분이라 한쪽으로 단정하지 않아요."
          :"서로 다른 관점이지만 함께 놓고 보면 입체적으로 이해할 수 있는 특징이에요.",
      tags:["#"+item.status.toLowerCase(),"#합의도"+item.agreement],
    })),
    observations: strongest.map((item,index)=>({
      label:(index+1)+". 관찰",
      title:traitLabel(item.trait),
      description:"현재 교차 상태는 "+item.status+"이며, 근거를 펼치면 각 엔진의 점수와 계산 근거를 확인할 수 있어요.",
    })),
    crossHighlights: strongest.map((item)=>({
      trait:item.trait,
      title:item.label,
      label:item.status==="AGREEMENT"?"비슷하게 보여요":item.status==="COMPLEMENTARY"?"서로 보완돼요":item.status==="DIVERGENCE"?"조금 다르게 보여요":"더 알아야 해요",
      explanation:"세 체계의 점수 범위를 기준으로 "+item.status+"로 분류했어요. 하나의 체계를 정답으로 선택하지 않습니다.",
    })),
    generatedBy:"fallback",
  };
}
