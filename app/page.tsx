"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { QuickAnalysisResponse } from "@/lib/analysis/types";
import type { DetailedAnalysisResponse } from "@/lib/analysis/detailed-types";
import { BIRTHPLACES } from "@/lib/analysis/birthplaces";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Phase = "landing" | "loading" | "result";

const presetDates = [
  { label: "✨ 1995.10.24", y: "1995", m: "10", d: "24" },
  { label: "🌸 1998.05.12", y: "1998", m: "05", d: "12" },
  { label: "🍀 2001.12.03", y: "2001", m: "12", d: "03" },
];

const loadingSteps = [
  ["사주 명리 기운 조각 추출", "년주·월주·일주와 기본 오행을 확인하고 있어요."],
  ["별빛 기본 데이터 대조", "생년월일로 확인 가능한 행성 위치를 살펴보고 있어요."],
  ["피타고라스 숫자 퍼즐 맞추기", "생년월일 숫자 패턴과 Life Path를 계산하고 있어요."],
  ["세 요정의 의견 모으기", "세 관점의 공통점과 차이점을 정리하고 있어요."],
];

const loadingQuotes = [
  "모디가 태어난 날의 기운을 하나씩 꺼내보고 있어요 🔥",
  "스텔라가 같은 날의 별빛 위치를 조심조심 맞춰보는 중이에요 🪐",
  "피코가 숫자 조각을 모아 Life Path를 만들고 있어요 🌱",
  "세 요정이 서로 다른 말을 한 장의 도감으로 정리하고 있어요 ✨",
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [year, setYear] = useState("1998");
  const [month, setMonth] = useState("05");
  const [day, setDay] = useState("12");
  const [error, setError] = useState("");
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [analysis, setAnalysis] = useState<QuickAnalysisResponse | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [narrativeState, setNarrativeState] = useState<"idle" | "loading" | "gemini" | "fallback">("idle");
  const [detailedOpen, setDetailedOpen] = useState(false);
  const [birthTime, setBirthTime] = useState("12:00");
  const [birthplaceId, setBirthplaceId] = useState("seoul");
  const [detailedStatus, setDetailedStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [detailedError, setDetailedError] = useState("");
  const [detailedAnalysis, setDetailedAnalysis] = useState<DetailedAnalysisResponse | null>(null);

  const birthday = useMemo(
    () => `${year || "----"}.${month.padStart(2, "0") || "--"}.${day.padStart(2, "0") || "--"}`,
    [year, month, day],
  );


  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createSupabaseBrowserClient();
    let active = true;
    let pendingHandled = false;

    const syncUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;

      const currentUser = data.user ?? null;
      setUser(currentUser);

      if (!currentUser || pendingHandled) return;

      const pendingRaw = window.sessionStorage.getItem("prism.pending-analysis.v1");
      if (!pendingRaw) return;

      try {
        const pending = JSON.parse(pendingRaw) as {
          createdAt: number;
          analysis: QuickAnalysisResponse;
        };

        if (
          !pending?.analysis ||
          typeof pending.createdAt !== "number" ||
          Date.now() - pending.createdAt > 30 * 60 * 1000
        ) {
          window.sessionStorage.removeItem("prism.pending-analysis.v1");
          return;
        }

        pendingHandled = true;
        setAnalysis(pending.analysis);
        const [pendingYear, pendingMonth, pendingDay] = pending.analysis.input.date.split("-");
        setYear(pendingYear);
        setMonth(pendingMonth);
        setDay(pendingDay);
        setPhase("result");

        try {
          await saveAnalysisToServer(pending.analysis);
          window.sessionStorage.removeItem("prism.pending-analysis.v1");
          setSaveStatus("saved");
          setSaveMessage("내 프리즘 도감에 저장했어요 ✨");
        } catch (pendingError) {
          pendingHandled = false;
          setSaveStatus("error");
          setSaveMessage(
            pendingError instanceof Error
              ? pendingError.message
              : "저장하지 못했어요.",
          );
        }
      } catch {
        window.sessionStorage.removeItem("prism.pending-analysis.v1");
      }
    };

    void syncUser();

    const handlePageShow = () => void syncUser();
    const handleFocus = () => void syncUser();
    const handlePopState = () => void syncUser();

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("popstate", handlePopState);

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("popstate", handlePopState);
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;
    setLoadingIndex(0);
    const timers = [
      window.setTimeout(() => setLoadingIndex(1), 700),
      window.setTimeout(() => setLoadingIndex(2), 1450),
      window.setTimeout(() => setLoadingIndex(3), 2200),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [phase]);


  async function saveAnalysisToServer(result: QuickAnalysisResponse) {
    const response = await fetch("/api/results", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ analysis: result }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "분석 결과를 저장하지 못했어요.");
    }

    return payload as { id: string; saved: true };
  }

  async function saveCurrentAnalysis() {
    if (!analysis) return;

    setSaveMessage("");

    if (!user) {
      window.sessionStorage.setItem(
        "prism.pending-analysis.v1",
        JSON.stringify({
          createdAt: Date.now(),
          analysis,
        }),
      );
      setAuthPromptOpen(true);
      return;
    }

    try {
      setSaveStatus("saving");
      await saveAnalysisToServer(analysis);
      setSaveStatus("saved");
      setSaveMessage("내 프리즘 도감에 저장했어요 ✨");
    } catch (saveError) {
      setSaveStatus("error");
      setSaveMessage(
        saveError instanceof Error
          ? saveError.message
          : "분석 결과를 저장하지 못했어요.",
      );
    }
  }

  async function startGoogleLogin() {
    if (!analysis) return;

    if (!isSupabaseConfigured()) {
      setAuthPromptOpen(false);
      setSaveStatus("error");
      setSaveMessage("Supabase 환경변수를 먼저 설정해 주세요.");
      return;
    }

    window.sessionStorage.setItem(
      "prism.pending-analysis.v1",
      JSON.stringify({
        createdAt: Date.now(),
        analysis,
      }),
    );

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });

    if (signInError) {
      setAuthPromptOpen(false);
      setSaveStatus("error");
      setSaveMessage("Google 로그인을 시작하지 못했어요.");
    }
  }


  async function enrichNarrative(result: QuickAnalysisResponse) {
    setNarrativeState("loading");

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);

      const response = await fetch("/api/narrative", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          engines: result.engines,
          cross: result.cross,
        }),
        signal: controller.signal,
      });

      window.clearTimeout(timeout);

      if (!response.ok) {
        setNarrativeState("fallback");
        return;
      }

      const payload = (await response.json()) as {
        narrative?: QuickAnalysisResponse["narrative"];
      };

      if (!payload.narrative) {
        setNarrativeState("fallback");
        return;
      }

      setAnalysis((current) =>
        current ? { ...current, narrative: payload.narrative! } : current,
      );
      setNarrativeState(
        payload.narrative.generatedBy === "gemini" ? "gemini" : "fallback",
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        console.warn("Gemini narrative timed out; keeping fallback narrative.");
      }
      setNarrativeState("fallback");
    }
  }


  async function runDetailedAnalysis() {
    setDetailedStatus("loading");
    setDetailedError("");

    try {
      const response = await fetch("/api/analyze/detailed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
          time: birthTime,
          birthplaceId,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "상세 분석에 실패했어요.");
      }

      setDetailedAnalysis(payload as DetailedAnalysisResponse);
      setDetailedStatus("done");
      setDetailedOpen(false);
      window.setTimeout(() => {
        document.getElementById("detailed-result")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    } catch (error) {
      setDetailedStatus("error");
      setDetailedError(
        error instanceof Error ? error.message : "상세 분석에 실패했어요.",
      );
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    const date = new Date(Date.UTC(y, m - 1, d));
    const valid =
      /^\d{4}$/.test(year) &&
      /^\d{1,2}$/.test(month) &&
      /^\d{1,2}$/.test(day) &&
      date.getUTCFullYear() === y &&
      date.getUTCMonth() === m - 1 &&
      date.getUTCDate() === d;

    if (!valid) {
      setError("생년월일을 다시 확인해 주세요.");
      return;
    }

    setError("");
    setAnalysis(null);
    setPhase("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "분석 요청에 실패했어요.");
      }
      const quickResult = payload as QuickAnalysisResponse;
      setLoadingIndex(3);
      setAnalysis(quickResult);
      setNarrativeState("loading");
      window.setTimeout(() => {
        setPhase("result");
        void enrichNarrative(quickResult);
      }, 250);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "분석 중 문제가 생겼어요.",
      );
      setPhase("landing");
    }
  }

  if (phase === "loading") {
    const progress = analysis ? 100 : ([28, 52, 78, 94][loadingIndex] ?? 94);

    return (
      <Shell>
        <div className="loading-screen">
          <header className="lab-header stitch-lab-header">
            <div className="lab-brand">
              <span className="lab-heart">♡</span>
              <div>
                <small>TAMAGOTCHI LAB</small>
                <strong>꼬마 요정 연구소</strong>
              </div>
            </div>
            <span className="sync-pill"><i />SYNC {progress}%</span>
          </header>

          <section className="stitch-loading-card">
            <span className="loading-glow loading-glow-peach" />
            <span className="loading-glow loading-glow-lavender" />

            <div className="loading-title center">
              <span className="loading-chip">🫧 심층 운명 데이터 조합 중</span>
              <h1>세 꼬마 요정이<br />내 마음을 모으는 중... 🫧</h1>
              <p>사주, 별자리, 수비학 요정들이 머리를 맞대고 있어요!</p>
            </div>

            <div className="fairy-console">
              <div className="console-top">
                <span className="console-lights"><i /><i /><i /></span>
                <small>FAIRY CONSOLE v2.4</small>
              </div>

              <div className="stitch-fairy-stage">
                <LoadingFairy
                  tone="peach"
                  icon="🔥"
                  badge="+ 기운"
                  name="불꼬미 모디"
                  state={loadingIndex === 0 ? "측정 중 🔥" : "기운 확인 완료"}
                  active={loadingIndex === 0}
                />
                <LoadingFairy
                  tone="lavender"
                  icon="✨"
                  badge="궤도 🔭"
                  name="별빛냥 스텔라"
                  state={loadingIndex === 1 ? "행성 대조 중 🪐" : loadingIndex > 1 ? "별빛 확인 완료" : "차례 기다리는 중"}
                  active={loadingIndex === 1}
                />
                <LoadingFairy
                  tone="mint"
                  icon="🌱"
                  badge="숫자"
                  name="숫자새싹 피코"
                  state={loadingIndex === 2 ? "조약돌 계산 중 🌱" : loadingIndex > 2 ? "숫자 확인 완료" : "차례 기다리는 중"}
                  active={loadingIndex === 2}
                />
              </div>

              <div className="console-buttons" aria-hidden="true">
                <b /><b className="active">◉</b><b />
              </div>
            </div>

            <div className="progress-block stitch-progress">
              <div>
                <span>⌛ 요정 조율 완료도</span>
                <strong>{progress}%</strong>
              </div>
              <div className="progress-track">
                <i style={{ width: `${progress}%` }} />
              </div>
            </div>
          </section>

          <section className="loading-list stitch-loading-list">
            <div className="section-head">
              <span>분석 진행 프로토콜</span>
              <b>{Math.min(loadingIndex + 1, 4)} / 4 작업 중</b>
            </div>

            {loadingSteps.map(([title, desc], index) => {
              const state = index < loadingIndex ? "done" : index === loadingIndex ? "active" : "wait";
              const tones = ["peach", "lavender", "mint", "neutral"];

              return (
                <div className={`loading-row stitch-loading-row ${state} ${tones[index]}`} key={title}>
                  <span className="step-icon">
                    {state === "done" ? "✓" : state === "active" ? "↻" : "…"}
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <small>{desc}</small>
                  </div>
                  <span className="state-chip">
                    {state === "done" ? "완료 💖" : state === "active" ? "분석 중 ⏳" : "대기 중 💭"}
                  </span>
                </div>
              );
            })}
          </section>

          <div className="whisper stitch-whisper">
            <span className="whisper-avatar">💬</span>
            <div>
              <small>요정들의 귓속말 · 실시간 속닥속닥</small>
              <p>“{loadingQuotes[loadingIndex] ?? loadingQuotes[3]}”</p>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (phase === "result") {
    const harmony = analysis?.cross.length
      ? Math.round(
          analysis.cross.reduce((sum, item) => sum + item.agreement, 0) /
            analysis.cross.length,
        )
      : 0;
    const leadKeyword = analysis?.narrative.keywords[0]?.title ?? "나만의 빛을 찾는 탐색자";
    const generatedLabel =
      narrativeState === "loading"
        ? "AI 해석 정리 중"
        : analysis?.narrative.generatedBy === "gemini"
          ? "Gemini 해석"
          : "Rule Fallback";

    return (
      <Shell>
        <div className="result-screen">
          <header className="result-top stitch-result-top">
            <div className="brand-line">
              <span className="brand-gem">✦</span>
              <strong>Prism ✦</strong>
              <span className="tiny-pill lavender">나 알아보기 ✨</span>
            </div>
            <button
              className="profile-btn"
              aria-label={user ? "내 프리즘 도감" : "로그인 전"}
              title={user ? "내 프리즘 도감" : "로그인 전"}
              onClick={user ? () => { window.location.href = "/my/results"; } : undefined}
            >
              {user?.user_metadata?.avatar_url ? (
                <img src={String(user.user_metadata.avatar_url)} alt="" />
              ) : user ? "✓" : "👤"}
            </button>
          </header>

          <section className="result-hero stitch-result-hero">
            <div className="result-meta">
              <span className="result-date-pill">📖 {birthday} 친구의 프리즘 도감 ✨</span>
              <span className="result-number-pill"><i />{generatedLabel}</span>
            </div>

            <div className="soul-pod">
              <div className="soul-pod-head">
                <div>
                  <span className="soul-icon">🐾</span>
                  <div>
                    <small>SOUL TAMAGOTCHI</small>
                    <strong>{leadKeyword}</strong>
                  </div>
                </div>
                <span className="harmony-pill">조율도 {harmony}%</span>
              </div>

              <div className="soul-screen">
                <div className="screen-stats">
                  <span>빛의 조화도 <b>{harmony}%</b></span>
                  <span>♡ 3요정 동행 중</span>
                </div>

                <div className="result-fairy-row">
                  <ResultFairy
                    tone="peach"
                    icon="🔥"
                    name="모디"
                    value={analysis ? `일간 ${analysis.engines.saju.dayMaster.korean}${analysis.engines.saju.dayMaster.element}` : "사주"}
                  />
                  <ResultFairy
                    tone="lavender"
                    icon="✨"
                    name="스텔라"
                    value={analysis ? `태양 ${analysis.engines.astrology.sunSign}` : "점성"}
                    featured
                  />
                  <ResultFairy
                    tone="mint"
                    icon="🌱"
                    name="피코"
                    value={analysis ? `Life Path ${analysis.engines.numerology.lifePath}` : "수비"}
                  />
                </div>

                <p className="fairy-mini-bubble">
                  ✨ 세 요정이 실제 계산 결과를 한 장의 도감으로 모았어요!
                </p>
              </div>
            </div>
          </section>

          <section className="summary stitch-summary">
            <span className="summary-icon">💭</span>
            <div>
              <small>SUMMARY DIALOGUE · {generatedLabel}</small>
              <p>{analysis?.narrative.summary ?? "세 가지 관점을 한 문장으로 정리하고 있어요."}</p>
            </div>
          </section>

          <section className="result-section">
            <div className="result-section-head">
              <div>
                <span>📚</span>
                <h2>3대 핵심 키워드 카드</h2>
              </div>
              <small>터치해서 보는 나의 핵심 조각</small>
            </div>

            <div className="keyword-list stitch-keyword-list">
              {(analysis?.narrative.keywords ?? []).map((item, index) => (
                <Keyword
                  key={item.title + index}
                  tone={["peach", "lavender", "mint"][index] ?? "peach"}
                  emoji={["🦁", "🔍", "🌿"][index] ?? "✨"}
                  title={item.title}
                  pick={index === 0 ? "교차분석 핵심" : index === 1 ? "깊이 탐구" : "3요정 관찰"}
                  text={item.description}
                  tags={item.tags}
                />
              ))}
            </div>
          </section>

          <section className="result-section cross-section">
            <div className="result-section-head stacked">
              <div>
                <span>🔮</span>
                <h2>세 요정의 교차 분석</h2>
              </div>
              <p>사주(모디) · 점성(스텔라) · 수비학(피코)이 각자의 돋보기로 함께 살펴본 나만의 입체적 지도예요.</p>
            </div>

            <div className="cross-list stitch-cross-list">
              {(analysis?.narrative.crossHighlights ?? []).map((item, index) => {
                const source = analysis?.cross.find((cross) => cross.trait === item.trait);
                return (
                  <CrossCard
                    key={item.trait}
                    tone={["peach", "lavender", "mint"][index] ?? "peach"}
                    badge={item.label + (source ? ` · ${source.agreement}%` : "")}
                    title={item.title}
                  >
                    {source?.sources.map((entry) => (
                      <Dialogue
                        key={entry.source}
                        name={entry.source === "saju" ? "모디(사주)" : entry.source === "astrology" ? "스텔라(점성)" : "피코(수비학)"}
                        tone={entry.source === "saju" ? "peach" : entry.source === "astrology" ? "lavender" : "mint"}
                      >
                        {entry.evidence.join(" · ")}
                      </Dialogue>
                    ))}
                    <Conclusion>{item.explanation}</Conclusion>
                  </CrossCard>
                );
              })}
            </div>
          </section>

          <section className="result-section diary-section">
            <div className="result-section-head">
              <div>
                <span>📝</span>
                <h2>요정들의 5가지 관찰 일기</h2>
              </div>
              <small>소장용 메모</small>
            </div>

            <div className="diary-list">
              {(analysis?.narrative.observations ?? []).map((item, index) => (
                <article className="diary-row stitch-diary-row" key={item.label + index}>
                  <span className={`diary-label tone-${["peach","lavender","mint","peach","lavender"][index] ?? "peach"}`}>
                    {item.label}
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="deep-card stitch-deep-card">
            <div className="deep-title">
              <span className="deep-key">🔑</span>
              <div>
                <strong>더 깊은 비밀이 궁금해? 🗝️</strong>
                <p>출생시간과 출생지역을 더하면 숨겨진 2층 다락방이 열려요.</p>
              </div>
            </div>

            <div className="deep-preview">
              <div>
                <span>◷ 정확한 태어난 시간</span>
                <small>Detailed Reading에서 입력</small>
              </div>
              <div className="deep-preview-grid">
                <span>시주 <b>잠금</b></span>
                <span>ASC / Houses <b>잠금</b></span>
              </div>
            </div>

            <button
              className="squishy"
              type="button"
              onClick={() => setDetailedOpen(true)}
            >
              🔓 상세 분석 잠금 해제 준비하기
            </button>
          </section>

          {detailedAnalysis && (
            <section id="detailed-result" className="detailed-result-card">
              <div className="detailed-result-head">
                <div>
                  <small>DETAILED READING v1</small>
                  <h2>출생시간을 반영한 두 번째 프리즘</h2>
                  <p>{birthTime} · {BIRTHPLACES.find((place) => place.id === birthplaceId)?.label ?? birthplaceId}</p>
                </div>
                <span className="detailed-badge">확장 분석</span>
              </div>

              <div className="detailed-engine-grid">
                <article>
                  <span>사주</span>
                  <strong>{detailedAnalysis.engines.saju.pillars.map((item) => item.text).join(" · ")}</strong>
                  <small>시주 포함 8자</small>
                </article>
                <article>
                  <span>점성</span>
                  <strong>태양 {detailedAnalysis.engines.astrology.sunSign}</strong>
                  <small>달 {detailedAnalysis.engines.astrology.moonSign}</small>
                </article>
                <article>
                  <span>수비학</span>
                  <strong>Life Path {detailedAnalysis.engines.numerology.lifePath}</strong>
                  <small>{detailedAnalysis.engines.numerology.meaningKey}</small>
                </article>
              </div>

              <div className="detailed-note">
                <strong>이번 단계에서 추가된 것</strong>
                <p>사주 시주와 실제 출생시각 기준 주요 행성 위치를 반영했어요. ASC · MC · 12 Houses는 다음 구현에서 추가됩니다.</p>
              </div>
            </section>
          )}

          {detailedOpen && (
            <div className="auth-sheet-backdrop" role="presentation" onClick={() => setDetailedOpen(false)}>
              <section className="detailed-sheet" role="dialog" aria-modal="true" aria-labelledby="detailed-title" onClick={(event) => event.stopPropagation()}>
                <div className="detailed-sheet-head">
                  <div>
                    <small>DETAILED READING</small>
                    <h2 id="detailed-title">태어난 시간과 지역을 더해볼게요.</h2>
                  </div>
                  <button type="button" onClick={() => setDetailedOpen(false)}>×</button>
                </div>

                <label className="detailed-field">
                  <span>태어난 시간</span>
                  <input type="time" value={birthTime} onChange={(event) => setBirthTime(event.target.value)} />
                </label>

                <label className="detailed-field">
                  <span>태어난 지역</span>
                  <select value={birthplaceId} onChange={(event) => setBirthplaceId(event.target.value)}>
                    {BIRTHPLACES.map((place) => (
                      <option key={place.id} value={place.id}>{place.label}</option>
                    ))}
                  </select>
                </label>

                <div className="detailed-sheet-preview">
                  <span>시주</span>
                  <span>달 별자리</span>
                  <span>정확한 행성 위치</span>
                </div>

                {detailedError && <p className="form-error">{detailedError}</p>}

                <button
                  className="dark-btn detailed-run-btn"
                  type="button"
                  disabled={detailedStatus === "loading"}
                  onClick={runDetailedAnalysis}
                >
                  {detailedStatus === "loading" ? "상세 분석 중..." : "상세 분석 시작"}
                </button>

                <p className="detailed-sheet-foot">대한민국 주요 도시 기준 · ASC/MC/Houses는 다음 단계에서 추가</p>
              </section>
            </div>
          )}

          <section className="result-actions">
            <button className="bubble-btn" onClick={() => setPhase("landing")}>← 처음으로</button>
            <button
              className="dark-btn"
              onClick={saveCurrentAnalysis}
              disabled={saveStatus === "saving"}
            >
              {saveStatus === "saving"
                ? "저장 중..."
                : saveStatus === "saved"
                  ? "도감 저장 완료 ✓"
                  : "내 도감에 저장"}
            </button>
          </section>

          {saveMessage && (
            <p className={`save-message ${saveStatus}`}>
              {saveMessage}
              {user && saveStatus === "saved" && (
                <> · <a href="/my/results">내 도감 보기</a></>
              )}
            </p>
          )}

          {authPromptOpen && (
            <div className="auth-sheet-backdrop" role="presentation" onClick={() => setAuthPromptOpen(false)}>
              <section className="auth-sheet toy-card" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={(event) => event.stopPropagation()}>
                <span className="round-icon peach">🔐</span>
                <h2 id="auth-title">이 결과를 계속 보관할까요?</h2>
                <p>Google로 로그인하면 지금 보고 있는 분석을 그대로 내 프리즘 도감에 저장해요.</p>
                <button className="google-login-btn" type="button" onClick={startGoogleLogin}>
                  <span>G</span>
                  Google로 계속하기
                </button>
                <button className="auth-later-btn" type="button" onClick={() => setAuthPromptOpen(false)}>
                  나중에 할게요
                </button>
              </section>
            </div>
          )}

          <details className="evidence-drawer">
            <summary>실제 계산 근거 보기</summary>
            <div className="engine-proof-grid">
              <span>사주 <b>{analysis?.engines.saju.pillars.map((item) => item.text).join(" · ")}</b></span>
              <span>점성 <b>태양 {analysis?.engines.astrology.sunSign}</b></span>
              <span>수비 <b>Life Path {analysis?.engines.numerology.lifePath}</b></span>
            </div>
            <p>계산 엔진 값과 교차분석을 먼저 만든 뒤, 설명 레이어가 이를 사람이 읽기 쉬운 문장으로 바꿉니다.</p>
          </details>

          <p className="prototype-note">
            계산 엔진은 실제 값이며, 해석은 전통적·문화적 자기탐색을 위한 참고 정보입니다.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="intro center">
        <span className="soft-pill">✨ 프리즘 꼬마 연구소 v1.2 <i /></span>
        <h1>세 꼬마 요정이 읽어주는<br />나의 비밀 노트 ✨</h1>
        <p>사주 꼬미, 별빛 냥이, 숫자 새싹이 속닥속닥 모여<br />나를 가장 다정하고 입체적으로 비춰줘요.</p>
      </section>

      <section className="pet-pod">
        <div className="pod-status"><span>♡ 하트 동기화 99%</span><span><i /> 온라인 연결됨</span></div>
        <div className="pet-screen">
          <div className="speech">💬 “너의 생일을 쏙 넣으면 비밀이 열려!”</div>
          <div className="fairy-room">
            <img
              className="fairy-art"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwOBHFgMplF4-GckqC4SJONOGgj9LzIScOah9ieTXhKLy_F3IL_NjTPgbX2cJrJoWpWOptuxHzX-AiFf9HF_iOnv91TfF8ZIY8izAEeLUpNXQfk2XmW3uY2XfgD_1c-WUO_O24Ci17QESN4svfnm4Ny7C6d_9pLvxOQyEuYq3lRirD7PgYrZ_MlzpFSGEhF7-R4Rd3LgVrHvDCsA6Co74YKsXV69H3JoECFxNwCcOT1R0WbTjWUJx-"
              alt="파스텔 방에서 쉬고 있는 모디, 스텔라, 피코"
            />
          </div>
          <div className="fairy-meters">
            <Meter tone="peach" label="🔥 사주 모디" width="82%" />
            <Meter tone="lavender" label="✨ 별빛 스텔라" width="96%" />
            <Meter tone="mint" label="🌱 숫자 피코" width="75%" />
          </div>
        </div>
      </section>

      <form className="birthday-card toy-card" onSubmit={submit}>
        <div className="birthday-head"><h2>🎂 생년월일 쏙 넣기</h2><div className="segment"><b>☀️ 양력</b><span title="MVP 이후 지원 예정">🌙 음력</span></div></div>
        <div className="preset-block"><small>빠른 생일 픽! 🎂 탭해서 채우기</small><div>{presetDates.map((p) => <button key={p.label} type="button" onClick={() => {setYear(p.y); setMonth(p.m); setDay(p.d); setError("");}}>{p.label}</button>)}</div></div>
        <div className="date-grid">
          <DateField label="태어난 해" value={year} setValue={setYear} suffix="년" maxLength={4} />
          <DateField label="월" value={month} setValue={setMonth} suffix="월" maxLength={2} />
          <DateField label="일" value={day} setValue={setDay} suffix="일" maxLength={2} />
        </div>
        <div className="time-option" aria-disabled="true">
          <div><span>◷</span><b>태어난 시간 알기</b></div>
          <div><small>상세 분석에서 입력</small><span className="fake-toggle"><i /></span></div>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="squishy" type="submit"><span>‹</span> 내 꼬마 요정들 깨우기 (무료로 알아보기)</button>
        <p className="privacy">🔒 Quick Reading은 생년월일만 사용해요. 로그인은 필요 없어요.</p>
      </form>

      <div className="reassure"><span>🐣</span><div><strong>무서운 점괘나 어려운 한자는 전혀 없어요</strong><p>전문용어는 숨기지 않되, 먼저 이해하기 쉬운 말로 번역해 들려줄게요.</p></div></div>

      <SectionTitle title="세 요정은 나를 어떻게 볼까?" sub="3대 프리즘 렌즈" />
      <section className="perspectives">
        <Perspective tone="peach" icon="🔥" title="사주 꼬미 모디" chip="동양의 기운">내가 태어난 계절과 날씨의 흐름을 통해 <b>타고난 마음의 온도와 활력의 흐름</b>을 솔직하게 짚어줘요.</Perspective>
        <Perspective tone="lavender" icon="🪐" title="별빛 냥이 스텔라" chip="서양 점성">생년월일로 확인 가능한 별빛 데이터를 엮어 <b>관계를 맺는 방식과 드러나는 매력</b>을 비춰줘요.</Perspective>
        <Perspective tone="mint" icon="🌱" title="숫자 새싹 피코" chip="생애 수비학">생년월일 숫자를 하나하나 모아 <b>고유한 나침반 번호와 성장 키워드</b>를 싹틔워요.</Perspective>
      </section>
      <footer className="fairy-footer">© PRISM FAIRY COMPANION<br /><span>✨ 모디 · 🌙 스텔라 · 🌿 피코</span></footer>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="prism-shell">{children}</main>;
}

function DateField({ label, value, setValue, suffix, maxLength }: { label: string; value: string; setValue: (v: string) => void; suffix: string; maxLength: number }) {
  return <label className="date-field"><span>{label}</span><div><input inputMode="numeric" value={value} maxLength={maxLength} onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, maxLength))} /><em>{suffix}</em></div></label>;
}

function Fairy({ tone, icon, name, sub, big = false }: { tone: string; icon: string; name: string; sub: string; big?: boolean }) {
  return <div className={`fairy fairy-${tone} ${big ? "big" : ""}`}><div>{icon}</div><strong>{name}</strong><small>{sub}</small></div>;
}

function LoadingFairy({
  tone,
  icon,
  badge,
  name,
  state,
  active,
}: {
  tone: string;
  icon: string;
  badge: string;
  name: string;
  state: string;
  active?: boolean;
}) {
  return (
    <div className={`loading-fairy loading-fairy-${tone} ${active ? "active" : ""}`}>
      <div className="loading-fairy-orb">
        <span className="loading-fairy-icon">{icon}</span>
        <span className="loading-fairy-badge">{badge}</span>
      </div>
      <strong>{name}</strong>
      <small>{state}</small>
    </div>
  );
}

function ResultFairy({
  tone,
  icon,
  name,
  value,
  featured = false,
}: {
  tone: string;
  icon: string;
  name: string;
  value: string;
  featured?: boolean;
}) {
  return (
    <div className={`result-fairy result-fairy-${tone} ${featured ? "featured" : ""}`}>
      <div>{icon}</div>
      <strong>{name}</strong>
      <small>{value}</small>
    </div>
  );
}

function Meter({ tone, label, width }: { tone: string; label: string; width: string }) {
  return <div className={`meter tone-${tone}`}><strong>{label}</strong><span><i style={{ width }} /></span></div>;
}

function SectionTitle({ icon, title, sub }: { icon?: string; title: string; sub: string }) {
  return <div className="section-title"><h2>{icon && <span>{icon}</span>}{title}</h2><small>{sub}</small></div>;
}

function Perspective({ tone, icon, title, chip, children }: { tone: string; icon: string; title: string; chip: string; children: React.ReactNode }) {
  return <article className="perspective toy-card"><span className={`perspective-icon tone-${tone}`}>{icon}</span><div><div className="perspective-title"><strong>{title}</strong><span className={`tiny-pill tone-${tone}`}>{chip}</span></div><p>{children}</p></div></article>;
}

function Keyword({ tone, emoji, title, pick, text, tags }: { tone: string; emoji: string; title: string; pick: string; text: string; tags: string[] }) {
  return <article className={`keyword toy-card keyword-${tone}`}><div className="keyword-title"><div><span>{emoji}</span><strong>{title}</strong></div><span className={`tiny-pill tone-${tone}`}>{pick}</span></div><p>{text}</p><div className="tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div></article>;
}

function CrossCard({ tone, badge, title, children }: { tone: string; badge: string; title: string; children: React.ReactNode }) {
  return <article className={`cross-card toy-card cross-${tone}`}><div className="cross-title"><span className={`tiny-pill tone-${tone}`}>{badge}</span><strong>{title}</strong></div><div className="dialogue-thread">{children}</div></article>;
}

function Dialogue({ name, tone, children }: { name: string; tone: string; children: React.ReactNode }) {
  return <div className="dialogue"><span className={`avatar tone-${tone}`}>{name.slice(0, 1)}</span><p><b className={`text-${tone}`}>{name}:</b> “{children}”</p></div>;
}

function Conclusion({ children }: { children: React.ReactNode }) {
  return <div className="conclusion">💡 <span>{children}</span></div>;
}
