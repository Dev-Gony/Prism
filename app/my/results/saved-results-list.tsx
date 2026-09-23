"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ReanalysisInput = {
  analysisType: "quick" | "detailed";
  date: string;
  calendarType: "solar" | "lunar";
  isLeapMonth: boolean;
  timeKnown: boolean;
  time: string;
  birthplaceId: string;
};

type SavedResult = {
  id: string;
  analysisType: string;
  birthDate: string;
  summary: string;
  narrativeSource: string;
  createdAt: string;
  sajuLabel: string;
  astrologyLabel: string;
  numerologyLabel: string;
  agreement: number;
  reanalysisInput: ReanalysisInput;
};

type Filter = "all" | "quick" | "detailed";

export default function SavedResultsList({
  initialResults,
}: {
  initialResults: SavedResult[];
}) {
  const router = useRouter();
  const [results, setResults] = useState(initialResults);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      all: results.length,
      quick: results.filter((item) => item.analysisType === "quick").length,
      detailed: results.filter((item) => item.analysisType === "detailed").length,
    }),
    [results],
  );

  const visibleResults = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return results.filter((item) => {
      if (filter !== "all" && item.analysisType !== filter) return false;
      if (!keyword) return true;

      const haystack = [
        item.birthDate,
        item.summary,
        item.sajuLabel,
        item.astrologyLabel,
        item.numerologyLabel,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [results, filter, query]);

  async function removeResult(id: string) {
    if (!window.confirm("이 프리즘 리포트를 삭제할까요?")) return;

    setDeletingId(id);
    setMessage("");

    try {
      const response = await fetch(`/api/results/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setMessage("삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }

      setResults((current) => current.filter((item) => item.id !== id));
      setMessage("리포트 한 권을 정리했어요.");
    } finally {
      setDeletingId(null);
    }
  }

  function reanalyze(item: SavedResult) {
    window.sessionStorage.setItem(
      "prism.reanalysis-input.v1",
      JSON.stringify({
        createdAt: Date.now(),
        input: item.reanalysisInput,
      }),
    );

    router.push("/?reanalyze=1");
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <section className="library-results">
      <div className="library-toolbar">
        <div>
          <span className="library-count">{results.length}</span>
          <strong>개의 Prism Report</strong>
        </div>
        <button type="button" onClick={signOut}>로그아웃</button>
      </div>

      <div className="library-controls">
        <div className="library-filter-tabs" role="tablist" aria-label="분석 유형">
          {([
            ["all", "전체", counts.all],
            ["quick", "Quick", counts.quick],
            ["detailed", "Detailed", counts.detailed],
          ] as const).map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
            >
              {label} <span>{count}</span>
            </button>
          ))}
        </div>

        <label className="library-search">
          <span>검색</span>
          <input
            type="search"
            placeholder="생년월일, 요약, 사주·점성·수비 결과 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      {message && <p className="library-message">{message}</p>}

      {results.length === 0 ? (
        <div className="library-empty">
          <h2>아직 저장한 리포트가 없어요.</h2>
          <p>Quick Reading을 마치고 저장하면 여기에서 다시 볼 수 있어요.</p>
          <a href="/">첫 리포트 만들기</a>
        </div>
      ) : visibleResults.length === 0 ? (
        <div className="library-empty compact">
          <h2>조건에 맞는 리포트가 없어요.</h2>
          <p>검색어나 필터를 바꿔보세요.</p>
        </div>
      ) : (
        <div className="library-grid">
          {visibleResults.map((item, index) => (
            <article className="library-card" key={item.id}>
              <div className="library-card-top">
                <div className="library-card-kickers">
                  <span className="volume-number">REPORT {String(index + 1).padStart(2, "0")}</span>
                  <span className={`analysis-type-badge ${item.analysisType}`}>
                    {item.analysisType === "detailed" ? "Detailed" : "Quick"}
                  </span>
                </div>
                <span className={`source-badge ${item.narrativeSource === "gemini" ? "gemini" : "fallback"}`}>
                  {item.narrativeSource === "gemini" ? "Gemini" : "Fallback"}
                </span>
              </div>

              <div className="library-date-row">
                <div>
                  <small>생년월일</small>
                  <strong>{item.birthDate.replaceAll("-", ".")}</strong>
                </div>
                <span className="agreement-orb">{item.agreement}%</span>
              </div>

              <div className="library-fairy-strip editorial">
                <span className="fairy-chip modi"><b>Modi</b><small>{item.sajuLabel}</small></span>
                <span className="fairy-chip stella"><b>Stella</b><small>{item.astrologyLabel}</small></span>
                <span className="fairy-chip pico"><b>Pico</b><small>{item.numerologyLabel}</small></span>
              </div>

              <p className="library-summary">{item.summary || "저장된 Prism 분석"}</p>

              <div className="library-card-footer">
                <small>{new Date(item.createdAt).toLocaleString("ko-KR")}</small>
                <div>
                  <button type="button" className="reanalyze-btn" onClick={() => reanalyze(item)}>
                    다시 분석
                  </button>
                  <a href={`/my/results/${item.id}`}>리포트 열기</a>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => removeResult(item.id)}
                  >
                    {deletingId === item.id ? "정리 중" : "삭제"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
