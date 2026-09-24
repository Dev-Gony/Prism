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
  keywordTitles: string[];
  reanalysisInput: ReanalysisInput;
};

type Filter = "all" | "quick" | "detailed";
type ViewMode = "cards" | "timeline";
type SortMode = "latest" | "agreement";

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
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [sortMode, setSortMode] = useState<SortMode>("latest");

  const counts = useMemo(
    () => ({
      all: results.length,
      quick: results.filter((item) => item.analysisType === "quick").length,
      detailed: results.filter((item) => item.analysisType === "detailed").length,
    }),
    [results],
  );

  const libraryInsights = useMemo(() => {
    if (results.length === 0) {
      return {
        averageAgreement: 0,
        highestAgreement: null as SavedResult | null,
        latest: null as SavedResult | null,
        repeatedKeywords: [] as Array<{ title: string; count: number }>,
      };
    }

    const averageAgreement = Math.round(
      results.reduce((sum, item) => sum + item.agreement, 0) / results.length,
    );

    const highestAgreement = [...results].sort(
      (a, b) => b.agreement - a.agreement,
    )[0] ?? null;

    const latest = [...results].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0] ?? null;

    const keywordCounts = new Map<string, number>();
    results.forEach((item) => {
      item.keywordTitles.forEach((title) => {
        keywordCounts.set(title, (keywordCounts.get(title) ?? 0) + 1);
      });
    });

    const repeatedKeywords = [...keywordCounts.entries()]
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
      .slice(0, 4)
      .map(([title, count]) => ({ title, count }));

    return {
      averageAgreement,
      highestAgreement,
      latest,
      repeatedKeywords,
    };
  }, [results]);

  const pairedComparisons = useMemo(() => {
    const byDate = new Map<
      string,
      { quick?: SavedResult; detailed?: SavedResult }
    >();

    [...results]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .forEach((item) => {
        const pair = byDate.get(item.birthDate) ?? {};

        if (item.analysisType === "quick" && !pair.quick) {
          pair.quick = item;
        }

        if (item.analysisType === "detailed" && !pair.detailed) {
          pair.detailed = item;
        }

        byDate.set(item.birthDate, pair);
      });

    return [...byDate.entries()]
      .filter(([, pair]) => pair.quick && pair.detailed)
      .map(([birthDate, pair]) => ({
        birthDate,
        quick: pair.quick!,
        detailed: pair.detailed!,
        agreementDelta: pair.detailed!.agreement - pair.quick!.agreement,
      }))
      .slice(0, 4);
  }, [results]);

  const visibleResults = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    const filtered = results.filter((item) => {
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

    return [...filtered].sort((a, b) => {
      if (sortMode === "agreement") {
        return (
          b.agreement - a.agreement ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [results, filter, query, sortMode]);

  const timelineGroups = useMemo(() => {
    const groups = new Map<string, SavedResult[]>();

    visibleResults.forEach((item) => {
      const date = new Date(item.createdAt);
      const key = Number.isNaN(date.getTime())
        ? "날짜 미상"
        : new Intl.DateTimeFormat("ko-KR", {
            year: "numeric",
            month: "long",
          }).format(date);

      const current = groups.get(key) ?? [];
      current.push(item);
      groups.set(key, current);
    });

    return [...groups.entries()];
  }, [visibleResults]);

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

  function upgradeToDetailed(item: SavedResult) {
    window.sessionStorage.setItem(
      "prism.reanalysis-input.v1",
      JSON.stringify({
        createdAt: Date.now(),
        input: {
          ...item.reanalysisInput,
          analysisType: "detailed",
          timeKnown: true,
          time: "",
          birthplaceId: item.reanalysisInput.birthplaceId || "seoul",
        },
      }),
    );

    router.push("/?upgrade=detailed");
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

      {results.length > 0 && (
        <section className="library-insight-board">
          <div className="library-insight-head">
            <div>
              <small>LIBRARY INSIGHTS</small>
              <h2>저장된 리포트에서 반복되는 흐름</h2>
            </div>
            <span>{counts.quick} Quick · {counts.detailed} Detailed</span>
          </div>

          <div className="library-insight-grid">
            <article>
              <small>평균 합의도</small>
              <strong>{libraryInsights.averageAgreement}%</strong>
              <p>저장된 리포트 전체의 세 관점 평균 합의도예요.</p>
            </article>

            <article>
              <small>가장 높은 합의도</small>
              <strong>{libraryInsights.highestAgreement?.agreement ?? 0}%</strong>
              <p>
                {libraryInsights.highestAgreement
                  ? libraryInsights.highestAgreement.birthDate.replaceAll("-", ".")
                  : "-"}
              </p>
            </article>

            <article>
              <small>최근 분석</small>
              <strong>
                {libraryInsights.latest
                  ? libraryInsights.latest.analysisType === "detailed"
                    ? "Detailed"
                    : "Quick"
                  : "-"}
              </strong>
              <p>
                {libraryInsights.latest
                  ? new Date(libraryInsights.latest.createdAt).toLocaleDateString("ko-KR")
                  : "-"}
              </p>
            </article>

            <article className="keyword-insight-card">
              <small>반복 키워드</small>
              {libraryInsights.repeatedKeywords.length > 0 ? (
                <div className="library-keyword-cloud">
                  {libraryInsights.repeatedKeywords.map((item) => (
                    <span key={item.title}>
                      {item.title}
                      <b>{item.count}</b>
                    </span>
                  ))}
                </div>
              ) : (
                <p>아직 두 번 이상 반복된 핵심 키워드가 없어요.</p>
              )}
            </article>
          </div>
        </section>
      )}

      {pairedComparisons.length > 0 && (
        <section className="library-pair-board">
          <div className="library-insight-head">
            <div>
              <small>QUICK → DETAILED</small>
              <h2>같은 생년월일의 확장 기록</h2>
            </div>
            <span>{pairedComparisons.length}개 비교 가능</span>
          </div>

          <div className="library-pair-list">
            {pairedComparisons.map((pair) => (
              <article key={pair.birthDate}>
                <div>
                  <small>생년월일</small>
                  <strong>{pair.birthDate.replaceAll("-", ".")}</strong>
                </div>

                <div className="library-pair-score">
                  <span>Quick {pair.quick.agreement}%</span>
                  <b>→</b>
                  <span>Detailed {pair.detailed.agreement}%</span>
                  <em className={pair.agreementDelta > 0 ? "up" : pair.agreementDelta < 0 ? "down" : "same"}>
                    {pair.agreementDelta > 0
                      ? `+${pair.agreementDelta}`
                      : pair.agreementDelta}
                  </em>
                </div>

                <div className="library-pair-actions">
                  <a href={`/my/results/${pair.quick.id}`}>Quick 보기</a>
                  <a href={`/my/results/${pair.detailed.id}`}>Detailed 보기</a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

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

        <label className="library-sort">
          <span>정렬</span>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <option value="latest">최신순</option>
            <option value="agreement">합의도 높은순</option>
          </select>
        </label>

        <div className="library-view-toggle" role="group" aria-label="보기 방식">
          <button
            type="button"
            className={viewMode === "cards" ? "active" : ""}
            onClick={() => setViewMode("cards")}
          >
            카드
          </button>
          <button
            type="button"
            className={viewMode === "timeline" ? "active" : ""}
            onClick={() => setViewMode("timeline")}
          >
            타임라인
          </button>
        </div>
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
      ) : viewMode === "timeline" ? (
        <div className="library-timeline">
          {timelineGroups.map(([month, items]) => (
            <section className="library-timeline-group" key={month}>
              <div className="library-timeline-month">
                <small>ARCHIVE</small>
                <strong>{month}</strong>
                <span>{items.length}개</span>
              </div>

              <div className="library-timeline-items">
                {items.map((item) => (
                  <article className="library-timeline-item" key={item.id}>
                    <div className="library-timeline-dot" />
                    <div className="library-timeline-card">
                      <div className="library-timeline-top">
                        <div>
                          <span className={`analysis-type-badge ${item.analysisType}`}>
                            {item.analysisType === "detailed" ? "Detailed" : "Quick"}
                          </span>
                          <strong>{item.birthDate.replaceAll("-", ".")}</strong>
                        </div>
                        <span>{item.agreement}%</span>
                      </div>

                      <p>{item.summary || "저장된 Prism 분석"}</p>

                      <div className="library-timeline-meta">
                        <span>{item.sajuLabel}</span>
                        <span>{item.astrologyLabel}</span>
                        <span>{item.numerologyLabel}</span>
                      </div>

                      <div className="library-timeline-actions">
                        {item.analysisType === "quick" && (
                          <button type="button" onClick={() => upgradeToDetailed(item)}>
                            Detailed로 확장
                          </button>
                        )}
                        <button type="button" onClick={() => reanalyze(item)}>
                          다시 분석
                        </button>
                        <a href={`/my/results/${item.id}`}>리포트 열기</a>
                        <button
                          type="button"
                          className="timeline-delete-btn"
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
            </section>
          ))}
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
                  {item.analysisType === "quick" && (
                    <button
                      type="button"
                      className="upgrade-detailed-btn"
                      onClick={() => upgradeToDetailed(item)}
                    >
                      Detailed로 확장
                    </button>
                  )}
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
