import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

  const narrative =
    data.narrative && typeof data.narrative === "object"
      ? data.narrative as {
          summary?: string;
          keywords?: Array<{ title?: string; description?: string }>;
        }
      : {};

  return (
    <main className="saved-page">
      <header className="saved-header">
        <div>
          <a href="/my/results">← 내 프리즘 도감</a>
          <h1>{data.birth_date} 분석</h1>
          <p>{data.narrative_source === "gemini" ? "Gemini 설명" : "Fallback 설명"}</p>
        </div>
      </header>

      <section className="saved-detail-card">
        <h2>한눈에 보는 나</h2>
        <p>{narrative.summary ?? "요약이 없어요."}</p>
      </section>

      <section className="saved-detail-card">
        <h2>핵심 키워드</h2>
        <div className="saved-keywords">
          {(narrative.keywords ?? []).map((item, index) => (
            <article key={index}>
              <strong>{item.title ?? "키워드"}</strong>
              <p>{item.description ?? ""}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="saved-detail-card">
        <h2>계산 근거</h2>
        <pre>{JSON.stringify({
          saju: data.saju_result,
          astrology: data.astrology_result,
          numerology: data.numerology_result,
          cross: data.cross_analysis,
        }, null, 2)}</pre>
      </section>
    </main>
  );
}
