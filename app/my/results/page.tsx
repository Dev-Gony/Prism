import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SavedResultsList from "./saved-results-list";

export const dynamic = "force-dynamic";

export default async function SavedResultsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect("/");
  }

  const { data, error } = await supabase
    .from("analysis_results")
    .select("id, analysis_type, birth_date, narrative, narrative_source, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error("저장한 분석 결과를 불러오지 못했어요.");
  }

  const results = (data ?? []).map((row) => ({
    id: String(row.id),
    analysisType: String(row.analysis_type),
    birthDate: String(row.birth_date),
    summary:
      row.narrative && typeof row.narrative === "object" && "summary" in row.narrative
        ? String(row.narrative.summary)
        : "",
    narrativeSource: String(row.narrative_source),
    createdAt: String(row.created_at),
  }));

  return (
    <main className="saved-page">
      <header className="saved-header">
        <div>
          <a href="/">← Prism</a>
          <h1>내 프리즘 도감</h1>
          <p>{authData.user.email}</p>
        </div>
      </header>
      <SavedResultsList initialResults={results} />
    </main>
  );
}
