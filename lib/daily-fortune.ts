export const KST_TIME_ZONE = "Asia/Seoul";

export type DailyFortunePayload = {
  schemaVersion: "v1";
  date: string;
  overallScore: number;
  headline: string;
  summary: string;
  areas: Array<{
    key: "focus" | "relationship" | "balance";
    label: string;
    score: number;
    guidance: string;
  }>;
  signals: string[];
  source: {
    analysisId: string;
    analysisType: string;
  };
  disclaimer: string;
};

export function getKstDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
