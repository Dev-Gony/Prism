import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

export default async function SavedResultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect("/");
  }

  const { data, error } = await supabase
    .from("analysis_results")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const narrative = record(data.narrative);
  const keywords = Array.isArray(narrative.keywords) ? narrative.keywords.map(record) : [];
  const observations = Array.isArray(narrative.observations) ? narrative.observations.map(record) : [];
  const crossHighlights = Array.isArray(narrative.crossHighlights) ? narrative.crossHighlights.map(record) : [];
  const saju = record(data.saju_result);
  const astrology = record(data.astrology_result);
  const numerology = record(data.numerology_result);
  const dayMaster = record(saju.dayMaster);

  const summary =
    typeof narrative.summary === "string" ? narrative.summary : "요약이 없어요.";

  return (
    <main className="library-detail-page">
      <header className="library-detail-header">
        <a href="/my/results">‹ 내 프리즘 도감</a>
        <span className={`source-badge ${data.narrative_source === "gemini" ? "gemini" : "fallback"}`}>
          {data.narrative_source === "gemini" ? "✨ Gemini" : "🫧 Fallback"}
        </span>
      </header>

      <section className="detail-cover">
        <div className="detail-cover-top">
          <div>
            <small>SOUL TAMAGOTCHI ARCHIVE</small>
            <h1>{String(data.birth_date).replaceAll("-", ".")}의 도감</h1>
          </div>
          <span className="detail-cover-book">📖</span>
        </div>

        <div className="detail-fairies">
          <span className="fairy-chip modi"><i>🔥</i><b>모디</b><small>{String(dayMaster.korean ?? "사주")}{String(dayMaster.element ?? "")}</small></span>
          <span className="fairy-chip stella"><i>✨</i><b>스텔라</b><small>{String(astrology.sunSign ?? "점성")}</small></span>
          <span className="fairy-chip pico"><i>🌱</i><b>피코</b><small>Life Path {String(numerology.lifePath ?? "-")}</small></span>
        </div>

        <p>{summary}</p>
      </section>

      <section className="detail-section">
        <div className="detail-section-title"><span>📚</span><h2>핵심 키워드</h2></div>
        <div className="detail-keyword-grid">
          {keywords.map((item, index) => (
            <article key={index} className={`detail-keyword tone-${["peach","lavender","mint"][index] ?? "peach"}`}>
              <strong>{String(item.title ?? "키워드")}</strong>
              <p>{String(item.description ?? "")}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="detail-section">
        <div className="detail-section-title"><span>🔮</span><h2>교차 분석 메모</h2></div>
        <div className="detail-cross-list">
          {crossHighlights.map((item, index) => (
            <article key={index}>
              <span>{String(item.label ?? "교차 분석")}</span>
              <strong>{String(item.title ?? "")}</strong>
              <p>{String(item.explanation ?? "")}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="detail-section">
        <div className="detail-section-title"><span>📝</span><h2>요정들의 관찰 일기</h2></div>
        <div className="detail-observation-list">
          {observations.map((item, index) => (
            <article key={index}>
              <span>{String(item.label ?? `${index + 1}. 관찰`)}</span>
              <div>
                <strong>{String(item.title ?? "")}</strong>
                <p>{String(item.description ?? "")}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <details className="detail-evidence">
        <summary>계산 근거 원본 보기</summary>
        <pre>{JSON.stringify({
          saju: data.saju_result,
          astrology: data.astrology_result,
          numerology: data.numerology_result,
          cross: data.cross_analysis,
        }, null, 2)}</pre>
      </details>

      <p className="library-disclaimer">저장된 결과는 당시 분석 스냅샷이며 자동으로 다시 계산되지 않습니다.</p>
    </main>
  );
}
