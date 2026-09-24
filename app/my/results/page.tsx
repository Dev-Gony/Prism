import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SavedResultsList from "./saved-results-list";

export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

export default async function SavedResultsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect("/");
  }

  const { data, error } = await supabase
    .from("analysis_results")
    .select(
      "id, analysis_type, birth_date, birth_time, birth_place, input_snapshot, narrative, narrative_source, saju_result, astrology_result, numerology_result, cross_analysis, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error("저장한 분석 결과를 불러오지 못했어요.");
  }

  const results = (data ?? []).map((row) => {
    const narrative = record(row.narrative);
    const saju = record(row.saju_result);
    const astrology = record(row.astrology_result);
    const numerology = record(row.numerology_result);
    const cross = Array.isArray(row.cross_analysis) ? row.cross_analysis : [];

    const dayMaster = record(saju.dayMaster);
    const keywordTitles = Array.isArray(narrative.keywords)
      ? narrative.keywords
          .map((item) => {
            const keyword = record(item);
            return typeof keyword.title === "string" ? keyword.title : "";
          })
          .filter(Boolean)
      : [];
    const inputSnapshot = record(row.input_snapshot);
    const birthPlace = record(row.birth_place);
    const agreement =
      cross.length > 0
        ? Math.round(
            cross.reduce((sum, item) => {
              const value = record(item).agreement;
              return sum + (typeof value === "number" ? value : 0);
            }, 0) / cross.length,
          )
        : 0;

    return {
      id: String(row.id),
      analysisType: String(row.analysis_type),
      birthDate: String(row.birth_date),
      summary: typeof narrative.summary === "string" ? narrative.summary : "",
      narrativeSource: String(row.narrative_source),
      createdAt: String(row.created_at),
      sajuLabel:
        typeof dayMaster.korean === "string" && typeof dayMaster.element === "string"
          ? `${dayMaster.korean}${dayMaster.element}`
          : "사주",
      astrologyLabel:
        String(row.analysis_type) === "detailed" &&
        record(astrology.ascendant).sign
          ? `ASC ${String(record(astrology.ascendant).sign)}`
          : typeof astrology.sunSign === "string"
            ? String(astrology.sunSign)
            : "점성",
      numerologyLabel:
        typeof numerology.lifePath === "number"
          ? `Life Path ${numerology.lifePath}`
          : "수비",
      agreement,
      keywordTitles,
      reanalysisInput: {
        analysisType: String(row.analysis_type) === "detailed" ? "detailed" : "quick",
        date:
          typeof inputSnapshot.originalDate === "string"
            ? inputSnapshot.originalDate
            : String(row.birth_date),
        calendarType:
          inputSnapshot.calendarType === "lunar" ? "lunar" : "solar",
        isLeapMonth: Boolean(inputSnapshot.isLeapMonth),
        timeKnown:
          typeof inputSnapshot.timeKnown === "boolean"
            ? Boolean(inputSnapshot.timeKnown)
            : typeof row.birth_time === "string",
        time:
          typeof inputSnapshot.time === "string"
            ? inputSnapshot.time
            : typeof row.birth_time === "string"
              ? row.birth_time
              : "12:00",
        birthplaceId:
          typeof inputSnapshot.birthplaceId === "string"
            ? inputSnapshot.birthplaceId
            : typeof birthPlace.id === "string"
              ? String(birthPlace.id)
              : "seoul",
      },
    };
  });

  const displayName =
    typeof authData.user.user_metadata?.full_name === "string"
      ? authData.user.user_metadata.full_name
      : authData.user.email?.split("@")[0] ?? "Prism 친구";

  const avatarUrl =
    typeof authData.user.user_metadata?.avatar_url === "string"
      ? authData.user.user_metadata.avatar_url
      : null;

  return (
    <main className="library-page">
      <header className="library-header">
        <div className="library-brand">
          <a className="library-back" href="/">‹</a>
          <div>
            <small>PRISM REPORT LIBRARY</small>
            <h1>내 프리즘 도감</h1>
          </div>
        </div>

        <div className="library-profile">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>👤</span>}
          <div>
            <strong>{displayName}</strong>
            <small>{authData.user.email}</small>
          </div>
        </div>
      </header>

      <section className="library-intro">
        <span className="library-book">📖</span>
        <div>
          <small>나의 분석 기록 보관함</small>
          <h2>지금까지 저장한<br />Prism Report를 모아보는 곳</h2>
          <p>Quick과 Detailed 결과를 비교하고, 같은 입력으로 다시 분석해 변화된 해석을 확인할 수 있어요.</p>
        </div>
      </section>

      <SavedResultsList initialResults={results} />
    </main>
  );
}
