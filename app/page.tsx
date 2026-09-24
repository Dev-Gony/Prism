"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { QuickAnalysisResponse } from "@/lib/analysis/types";
import type { DetailedAnalysisResponse } from "@/lib/analysis/detailed-types";
import { BIRTHPLACES } from "@/lib/analysis/birthplaces";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics/client";
import ResultFeedback from "@/app/result-feedback";
import DestinyTimelineExplorer from "@/app/destiny-timeline-explorer";

type Phase = "landing" | "loading" | "result";

const presetDates = [
  { label: "1995.10.24", y: "1995", m: "10", d: "24" },
  { label: "1998.05.12", y: "1998", m: "05", d: "12" },
  { label: "2001.03.15", y: "2001", m: "03", d: "15" },
];

const TRAIT_LABELS: Record<string, string> = {
  autonomy: "자기 주도성",
  reflection: "사고의 깊이",
  stability: "안정 지향",
  sociability: "관계 확장성",
  creativity: "표현과 창의성",
  adaptability: "변화 적응력",
  care: "돌봄과 배려",
};

const DESTINY_THEME_LABELS: Record<string, string> = {
  self: "자기 방향",
  expression: "표현과 생산",
  relationships: "관계와 조율",
  resources: "자원과 성취",
  responsibility: "책임과 구조",
  learning: "학습과 성찰",
  expansion: "확장과 기회",
  change: "변화와 전환",
  transformation: "정리와 재구성",
};

const loadingSteps = [
  {
    key: "saju",
    tone: "saju",
    eyebrow: "사주명식 (Saju)",
    companion: "Modi",
    title: "년주 · 월주 · 일주 계산",
    detail: "일간 및 십신 오행 매핑 완료",
  },
  {
    key: "astro",
    tone: "astro",
    eyebrow: "점성학 (Astrology)",
    companion: "Stella",
    title: "천체 좌표 및 하우스 확인",
    detail: "태양 · 달 · 수성 황도 12궁 좌표 동기화",
  },
  {
    key: "numero",
    tone: "numero",
    eyebrow: "수비학 (Numerology)",
    companion: "Pico",
    title: "Life Path 계산",
    detail: "생명수 및 피타고라스 매트릭스 도출",
  },
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [year, setYear] = useState("1998");
  const [month, setMonth] = useState("05");
  const [day, setDay] = useState("12");
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [error, setError] = useState("");
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [analysis, setAnalysis] = useState<QuickAnalysisResponse | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [narrativeState, setNarrativeState] = useState<
    "idle" | "loading" | "gemini" | "fallback"
  >("idle");
  const [detailedOpen, setDetailedOpen] = useState(false);
  const [birthTime, setBirthTime] = useState("12:00");
  const [birthTimeKnown, setBirthTimeKnown] = useState(true);
  const [birthplaceId, setBirthplaceId] = useState("seoul");
  const [birthplaceQuery, setBirthplaceQuery] = useState("");
  const [detailedStatus, setDetailedStatus] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [detailedError, setDetailedError] = useState("");
  const [detailedSaveStatus, setDetailedSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [detailedSaveMessage, setDetailedSaveMessage] = useState("");
  const [detailedNarrativeState, setDetailedNarrativeState] = useState<"idle" | "loading" | "gemini" | "fallback">("idle");
  const [detailedAnalysis, setDetailedAnalysis] =
    useState<DetailedAnalysisResponse | null>(null);

  const birthDate = useMemo(
    () =>
      `${year || "----"}.${month.padStart(2, "0") || "--"}.${
        day.padStart(2, "0") || "--"
      }`,
    [year, month, day],
  );

  useEffect(() => {
    void trackEvent("landing_view");
  }, []);

  useEffect(() => {
    const raw = window.sessionStorage.getItem("prism.reanalysis-input.v1");
    if (!raw) return;

    try {
      const payload = JSON.parse(raw) as {
        createdAt?: number;
        input?: {
          analysisType?: "quick" | "detailed";
          date?: string;
          calendarType?: "solar" | "lunar";
          isLeapMonth?: boolean;
          timeKnown?: boolean;
          time?: string;
          birthplaceId?: string;
        };
      };

      if (
        typeof payload.createdAt !== "number" ||
        Date.now() - payload.createdAt > 30 * 60 * 1000 ||
        !payload.input?.date
      ) {
        window.sessionStorage.removeItem("prism.reanalysis-input.v1");
        return;
      }

      const [nextYear, nextMonth, nextDay] = payload.input.date.split("-");
      setYear(nextYear);
      setMonth(nextMonth);
      setDay(nextDay);
      setCalendarType(payload.input.calendarType ?? "solar");
      setIsLeapMonth(Boolean(payload.input.isLeapMonth));
      setBirthTimeKnown(payload.input.timeKnown ?? true);
      setBirthTime(
        typeof payload.input.time === "string" ? payload.input.time : "12:00",
      );
      setBirthplaceId(payload.input.birthplaceId || "seoul");
      setBirthplaceQuery("");

      if (payload.input.analysisType === "detailed") {
        setDetailedOpen(true);
      }

      window.sessionStorage.removeItem("prism.reanalysis-input.v1");
    } catch {
      window.sessionStorage.removeItem("prism.reanalysis-input.v1");
    }
  }, []);

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

      const pendingRaw = window.sessionStorage.getItem(
        "prism.pending-analysis.v1",
      );
      if (!pendingRaw) return;

      try {
        const pending = JSON.parse(pendingRaw) as {
          createdAt: number;
          kind?: "quick" | "detailed";
          analysis: QuickAnalysisResponse | DetailedAnalysisResponse;
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
        const sourceDate =
          pending.analysis.input.originalDate ?? pending.analysis.input.date;
        const [pendingYear, pendingMonth, pendingDay] = sourceDate.split("-");
        setYear(pendingYear);
        setMonth(pendingMonth);
        setDay(pendingDay);
        setCalendarType(pending.analysis.input.calendarType ?? "solar");
        setIsLeapMonth(Boolean(pending.analysis.input.isLeapMonth));
        setPhase("result");

        const isDetailedPending =
          pending.kind === "detailed" || "time" in pending.analysis.input;

        if (isDetailedPending) {
          setDetailedAnalysis(pending.analysis as DetailedAnalysisResponse);
        } else {
          setAnalysis(pending.analysis as QuickAnalysisResponse);
        }

        try {
          await saveAnalysisToServer(pending.analysis);
          void trackEvent(
            "result_saved",
            { source: "oauth-return" },
            isDetailedPending ? "detailed" : "quick",
          );
          window.sessionStorage.removeItem("prism.pending-analysis.v1");

          if (isDetailedPending) {
            setDetailedSaveStatus("saved");
            setDetailedSaveMessage("상세 리포트를 내 프리즘 도감에 저장했어요.");
          } else {
            setSaveStatus("saved");
            setSaveMessage("내 프리즘 도감에 저장했어요.");
          }
        } catch (pendingError) {
          pendingHandled = false;

          if (isDetailedPending) {
            setDetailedSaveStatus("error");
            setDetailedSaveMessage(
              pendingError instanceof Error
                ? pendingError.message
                : "상세 리포트를 저장하지 못했어요.",
            );
          } else {
            setSaveStatus("error");
            setSaveMessage(
              pendingError instanceof Error
                ? pendingError.message
                : "저장하지 못했어요.",
            );
          }
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

    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) setUser(session?.user ?? null);
      },
    );

    return () => {
      active = false;
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("popstate", handlePopState);
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!detailedOpen) return;
    void trackEvent("detailed_opened", {
      source: "detailed-modal",
    }, "detailed");
  }, [detailedOpen]);

  useEffect(() => {
    if (phase !== "loading") return;

    setLoadingIndex(0);
    const timers = [
      window.setTimeout(() => setLoadingIndex(1), 550),
      window.setTimeout(() => setLoadingIndex(2), 1100),
      window.setTimeout(() => setLoadingIndex(3), 1650),
    ];

    return () => timers.forEach(window.clearTimeout);
  }, [phase]);

  async function saveAnalysisToServer(result: QuickAnalysisResponse | DetailedAnalysisResponse) {
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

    void trackEvent("save_clicked", {}, "quick");
    setSaveMessage("");

    if (!user) {
      window.sessionStorage.setItem(
        "prism.pending-analysis.v1",
        JSON.stringify({
          createdAt: Date.now(),
          kind: "quick",
          analysis,
        }),
      );
      setAuthPromptOpen(true);
      return;
    }

    try {
      setSaveStatus("saving");
      await saveAnalysisToServer(analysis);
      void trackEvent("result_saved", {}, "quick");
      setSaveStatus("saved");
      setSaveMessage("내 프리즘 도감에 저장했어요.");
    } catch (saveError) {
      setSaveStatus("error");
      setSaveMessage(
        saveError instanceof Error
          ? saveError.message
          : "분석 결과를 저장하지 못했어요.",
      );
    }
  }

  async function saveDetailedAnalysis() {
    if (!detailedAnalysis) return;

    void trackEvent("save_clicked", {}, "detailed");
    setDetailedSaveMessage("");

    if (!user) {
      window.sessionStorage.setItem(
        "prism.pending-analysis.v1",
        JSON.stringify({
          createdAt: Date.now(),
          kind: "detailed",
          analysis: detailedAnalysis,
        }),
      );
      setAuthPromptOpen(true);
      return;
    }

    try {
      setDetailedSaveStatus("saving");
      await saveAnalysisToServer(detailedAnalysis);
      void trackEvent("result_saved", {}, "detailed");
      setDetailedSaveStatus("saved");
      setDetailedSaveMessage("상세 리포트를 내 프리즘 도감에 저장했어요.");
    } catch (saveError) {
      setDetailedSaveStatus("error");
      setDetailedSaveMessage(
        saveError instanceof Error
          ? saveError.message
          : "상세 리포트를 저장하지 못했어요.",
      );
    }
  }

  async function signOutUser() {
    if (!isSupabaseConfigured()) return;

    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();

    window.sessionStorage.removeItem("prism.pending-analysis.v1");
    setUser(null);
    setAuthPromptOpen(false);
    setSaveStatus("idle");
    setSaveMessage("");
    setDetailedSaveStatus("idle");
    setDetailedSaveMessage("");

    window.location.assign("/");
  }

  async function startGoogleLogin() {
    const pendingRaw = window.sessionStorage.getItem("prism.pending-analysis.v1");
    if (!analysis && !pendingRaw) return;

    if (!isSupabaseConfigured()) {
      setAuthPromptOpen(false);
      setSaveStatus("error");
      setSaveMessage("Supabase 환경변수를 먼저 설정해 주세요.");
      return;
    }

    // Preserve a pending Detailed snapshot instead of accidentally replacing it
    // with the current Quick result right before OAuth.
    if (!pendingRaw && analysis) {
      window.sessionStorage.setItem(
        "prism.pending-analysis.v1",
        JSON.stringify({
          createdAt: Date.now(),
          kind: "quick",
          analysis,
        }),
      );
    }

    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const siteOrigin = (configuredSiteUrl || window.location.origin).replace(
      /\/$/,
      "",
    );

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteOrigin}/auth/callback?next=/`,
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

    let timeout = 0;

    try {
      const controller = new AbortController();
      timeout = window.setTimeout(() => controller.abort(), 15000);

      const response = await fetch("/api/narrative", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          engines: result.engines,
          cross: result.cross,
        }),
        signal: controller.signal,
      });

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
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      ) {
        console.warn("Gemini narrative timed out; keeping fallback narrative.");
      }
      setNarrativeState("fallback");
    } finally {
      if (timeout) window.clearTimeout(timeout);
    }
  }

  async function enrichDetailedNarrative(result: DetailedAnalysisResponse) {
    setDetailedNarrativeState("loading");

    let timeout = 0;

    try {
      const controller = new AbortController();
      timeout = window.setTimeout(() => controller.abort(), 15000);

      const response = await fetch("/api/narrative/detailed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          engines: result.engines,
          cross: result.cross,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        setDetailedNarrativeState("fallback");
        return;
      }

      const payload = (await response.json()) as {
        narrative?: DetailedAnalysisResponse["narrative"];
      };

      if (!payload.narrative) {
        setDetailedNarrativeState("fallback");
        return;
      }

      setDetailedAnalysis((current) =>
        current ? { ...current, narrative: payload.narrative! } : current,
      );

      setDetailedNarrativeState(
        payload.narrative.generatedBy === "gemini" ? "gemini" : "fallback",
      );
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      ) {
        console.warn("Detailed Gemini narrative timed out; keeping fallback.");
      }
      setDetailedNarrativeState("fallback");
    } finally {
      if (timeout) window.clearTimeout(timeout);
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
          time: birthTimeKnown ? birthTime : null,
          timeKnown: birthTimeKnown,
          birthplaceId,
          calendarType,
          isLeapMonth,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "상세 분석에 실패했어요.");
      }

      const detailedResult = payload as DetailedAnalysisResponse;
      void trackEvent("detailed_completed", {
        birthplaceId,
        timeKnown: birthTimeKnown,
        narrativeSource: detailedResult.narrative.generatedBy,
      }, "detailed");
      setDetailedAnalysis(detailedResult);
      setDetailedNarrativeState("loading");
      setDetailedStatus("done");
      setDetailedOpen(false);
      void enrichDetailedNarrative(detailedResult);

      window.setTimeout(() => {
        document.getElementById("deep-report")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    } catch (detailedRequestError) {
      setDetailedStatus("error");
      setDetailedError(
        detailedRequestError instanceof Error
          ? detailedRequestError.message
          : "상세 분석에 실패했어요.",
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
    void trackEvent("quick_started", {
      calendarType,
      isLeapMonth,
    }, "quick");
    setAnalysis(null);
    setDetailedAnalysis(null);
    setNarrativeState("idle");
    setDetailedNarrativeState("idle");
    setPhase("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });

    const startedAt = Date.now();

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
          calendarType,
          isLeapMonth,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "분석 요청에 실패했어요.");
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < 1700) {
        await new Promise((resolve) =>
          window.setTimeout(resolve, 1700 - elapsed),
        );
      }

      const quickResult = payload as QuickAnalysisResponse;
      void trackEvent("quick_completed", {
        calendarType,
        isLeapMonth,
        narrativeSource: quickResult.narrative.generatedBy,
      }, "quick");
      setLoadingIndex(3);
      setAnalysis(quickResult);
      setNarrativeState("loading");
      setPhase("result");
      window.scrollTo({ top: 0, behavior: "instant" });
      void enrichNarrative(quickResult);
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
    const progress = [34, 58, 78, 94][loadingIndex] ?? 94;

    return (
      <main className="editorial-shell loading-shell">
        <section className="analysis-loading">
          <div className="loading-kicker">SYNTHESIS IN PROGRESS</div>
          <h1>세 가지 관점을 맞춰보고 있어요.</h1>
          <p className="loading-lead">
            각 분석 결과를 계산한 뒤 공통점과 차이를 정리합니다.
          </p>

          <div className="synthesis-visual">
            <div className="orbit-graphic" aria-hidden="true">
              <span className="orbit orbit-a" />
              <span className="orbit orbit-b" />
              <span className="orbit orbit-c" />
              <span className="orbit-core">
                <i className="dot modi" />
                <i className="dot stella" />
                <i className="dot pico" />
              </span>
            </div>
            <div className="converging-label">CONVERGING · 0.{progress}4</div>
            <div className="progress-copy">
              <strong>{Math.min(loadingIndex + 1, 3)}단계 교차 분석 진행 중</strong>
              <b>{progress}%</b>
            </div>
            <div className="report-progress">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="loading-domain-list">
            {loadingSteps.map((step, index) => {
              const complete = index < loadingIndex || loadingIndex >= 3;
              const active = index === loadingIndex && loadingIndex < 3;

              return (
                <article
                  className={`loading-domain-card ${step.tone} ${
                    active ? "active" : ""
                  }`}
                  key={step.key}
                >
                  <div className="domain-mark">
                    {step.key === "saju" ? "年" : step.key === "astro" ? "✦" : "№7"}
                  </div>
                  <div className="loading-domain-copy">
                    <div>
                      <h2>{step.eyebrow}</h2>
                      <span className="companion-tag">{step.companion}</span>
                    </div>
                    <strong>{step.title}</strong>
                    <p>{step.detail}</p>
                  </div>
                  <span className={`domain-status ${complete ? "done" : active ? "working" : "wait"}`}>
                    {complete ? "● 완료" : active ? "↻ 연산 중" : "대기"}
                  </span>
                </article>
              );
            })}
          </div>

          <section className="cross-analysis-preview">
            <div className="cross-preview-head">
              <h2>Cross Analysis</h2>
              <span>합의 도출 단계</span>
            </div>
            <div className="cross-preview-body">
              <strong>● 세 관점의 공통점과 차이를 정리하는 중</strong>
              <p>
                사주, 점성학, 수비학이 각각 말하는 성향을 하나의 문장으로
                단정하지 않고, 겹치는 부분과 다른 부분을 나란히 비교합니다.
              </p>
              <div className="cross-preview-stats">
                <span><small>동기화 수준</small><b>{progress}.4%</b></span>
                <span><small>상호 보완성</small><b>높음</b></span>
                <span><small>해석 정밀도</small><b>심층</b></span>
              </div>
            </div>
          </section>

          <div className="loading-note">
            <span className="mini-companion modi">M</span>
            <span className="mini-companion stella">S</span>
            <span className="mini-companion pico">P</span>
            <p>
              어려운 전문 용어나 한자 대신, 오늘의 나에게 닿는 명료한 언어로
              정리하고 있어요.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (phase === "result" && analysis) {
    const generatedLabel =
      narrativeState === "loading"
        ? "AI 해석 정리 중"
        : analysis.narrative.generatedBy === "gemini"
          ? "Gemini 해석"
          : "규칙 기반 해석";

    return (
      <main className="report-app">
        <header className="report-header">
          <div className="report-header-inner">
            <a className="report-brand" href="/" onClick={(event) => {
              event.preventDefault();
              setPhase("landing");
            }}>
              <strong>Prism</strong>
              <span>프리즘</span>
              <small>Multi-System Insight</small>
            </a>

            <div className="desktop-domain-legend">
              <span className="legend-chip saju"><i />Modi 사주</span>
              <span className="legend-chip astro"><i />Stella 점성학</span>
              <span className="legend-chip numero"><i />Pico 수비학</span>
            </div>

            {user ? (
              <UserAccountMenu user={user} onLogout={signOutUser} />
            ) : (
              <button
                className="report-profile"
                type="button"
                aria-label="로그인 전"
                title="결과 저장 시 로그인할 수 있어요."
              >
                <span>👤</span>
              </button>
            )}
          </div>
        </header>

        <div className="report-layout">
          <aside className="report-anchor">
            <div className="anchor-card">
              <span className="anchor-kicker">PRISM REPORT</span>
              <h2>{birthDate}</h2>
              <p>Quick Reading</p>
              <div className="anchor-rule" />
              <strong>{analysis.narrative.keywords[0]?.title ?? "나의 교차 리포트"}</strong>
              <small>{generatedLabel}</small>
            </div>

            <nav className="anchor-nav">
              <a href="#core-essence">핵심 성향</a>
              <a href="#cross-analysis">교차 분석</a>
              <a href="#three-lenses">각 관점</a>
              <a href="#observation-log">관찰 노트</a>
              <a href="#deep-report">상세 분석</a>
            </nav>
          </aside>

          <article className="report-stream">
            <section className="report-intro">
              <div className="report-meta-line">
                <span>{birthDate} · {calendarType === "lunar" ? "음력 입력" : "양력 입력"} · 나의 Prism Report</span>
                <span className={`narrative-badge ${analysis.narrative.generatedBy}`}>
                  {generatedLabel}
                </span>
              </div>
              <h1>세 관점이 함께 말하는 나</h1>
              <blockquote>
                “{analysis.narrative.summary}”
              </blockquote>
              <div className="report-source-row">
                <span><i className="source-dot saju" />사주 · Modi</span>
                <span><i className="source-dot astro" />점성학 · Stella</span>
                <span><i className="source-dot numero" />수비학 · Pico</span>
              </div>
            </section>

            <section className="report-section" id="core-essence">
              <div className="section-heading-row">
                <div>
                  <small>CORE ESSENCE</small>
                  <h2>핵심 성향 세 가지</h2>
                </div>
                <span>핵심 요약</span>
              </div>

              <div className="essence-list">
                {analysis.narrative.keywords.slice(0, 3).map((item, index) => (
                  <article className="essence-item" key={item.title + index}>
                    <span className="editorial-index">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <div className="tag-row">
                        {item.tags.map((tag) => <span key={tag}>{tag}</span>)}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="report-section" id="cross-analysis">
              <div className="section-heading-row">
                <div>
                  <small>CROSS ANALYSIS</small>
                  <h2>세 관점의 교차 분석</h2>
                </div>
                <span>{analysis.cross.length}개 영역 비교</span>
              </div>

              <div className="cross-report-list">
                {analysis.narrative.crossHighlights.map((highlight, index) => {
                  const source = analysis.cross.find(
                    (item) => item.trait === highlight.trait,
                  );

                  return (
                    <article className="cross-report-card" key={highlight.trait}>
                      <div className="cross-report-card-head">
                        <span>교차 영역 {String(index + 1).padStart(2, "0")}</span>
                        <span className="agreement-chip">
                          {highlight.label}
                          {source ? ` · ${source.agreement}%` : ""}
                        </span>
                      </div>
                      <h3>{highlight.title}</h3>

                      <div className="source-evidence-list">
                        {source?.sources.map((entry) => (
                          <div className={`evidence-row ${entry.source}`} key={entry.source}>
                            <span className="evidence-avatar">
                              {entry.source === "saju" ? "M" : entry.source === "astrology" ? "S" : "P"}
                            </span>
                            <strong>
                              {entry.source === "saju"
                                ? "Modi"
                                : entry.source === "astrology"
                                  ? "Stella"
                                  : "Pico"}
                            </strong>
                            <p>{entry.evidence.join(" · ")}</p>
                          </div>
                        ))}
                      </div>

                      <div className="editorial-callout">
                        <strong>Prism 통합 해석</strong>
                        <p>{highlight.explanation}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="report-section" id="three-lenses">
              <div className="section-heading-row">
                <div>
                  <small>THREE LENSES</small>
                  <h2>각 관점에서 본 나</h2>
                </div>
              </div>

              <div className="lens-grid">
                <LensCard
                  tone="saju"
                  code="M"
                  title="사주 (Four Pillars)"
                  subtitle="Modi · 동양의 기운"
                  quote={`“일간 ${analysis.engines.saju.dayMaster.korean}${analysis.engines.saju.dayMaster.element}, 대표 오행 ${analysis.engines.saju.dominantElement}.”`}
                  detail={analysis.engines.saju.pillars.map((item) => item.text).join(" · ")}
                />
                <LensCard
                  tone="astro"
                  code="S"
                  title="점성학 (Astrology)"
                  subtitle="Stella · 서양 점성"
                  quote={`“태양 ${analysis.engines.astrology.sunSign}.”`}
                  detail={analysis.engines.astrology.bodies.map((planet) => `${planet.body} ${planet.sign}`).join(" · ")}
                />
                <LensCard
                  tone="numero"
                  code="P"
                  title="수비학 (Numerology)"
                  subtitle="Pico · 생애 수비학"
                  quote={`“Life Path ${analysis.engines.numerology.lifePath}.”`}
                  detail={analysis.engines.numerology.meaningKey}
                />
              </div>
            </section>

            <section className="report-section" id="observation-log">
              <div className="section-heading-row">
                <div>
                  <small>OBSERVATION LOG</small>
                  <h2>관찰 노트</h2>
                </div>
                <span>현재 분석 스냅샷</span>
              </div>

              <ol className="observation-list">
                {analysis.narrative.observations.map((item, index) => (
                  <li key={item.label + index}>
                    <span>{index + 1}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="deep-report-section" id="deep-report">
              {detailedAnalysis ? (
                <DetailedReport
                  quick={analysis}
                  data={detailedAnalysis}
                  narrativeState={detailedNarrativeState}
                  saveStatus={detailedSaveStatus}
                  saveMessage={detailedSaveMessage}
                  onSave={saveDetailedAnalysis}
                />
              ) : (
                <>
                  <div className="deep-report-copy">
                    <small>DEEP HORIZON</small>
                    <h2>출생시간을 더하면 더 깊은 프리즘이 열려요</h2>
                    <p>
                      출생시간과 지역을 더하면 사주의 시주와 점성학의 ASC,
                      MC, 12 Houses를 함께 볼 수 있어요.
                    </p>
                  </div>

                  <div className="deep-feature-grid">
                    <span><b>사주</b><small>시주 추가</small></span>
                    <span><b>점성학</b><small>ASC · MC · 12 Houses</small></span>
                  </div>

                  <button
                    className="report-primary-btn"
                    type="button"
                    onClick={() => setDetailedOpen(true)}
                  >
                    상세 분석 열기
                    <span>→</span>
                  </button>
                </>
              )}
            </section>

            <section className="report-actions">
              <button
                className="report-secondary-btn"
                type="button"
                onClick={() => setPhase("landing")}
              >
                새 분석
              </button>
              <button
                className="report-primary-btn compact"
                type="button"
                disabled={saveStatus === "saving"}
                onClick={saveCurrentAnalysis}
              >
                {saveStatus === "saving"
                  ? "저장 중..."
                  : saveStatus === "saved"
                    ? "저장 완료"
                    : "내 프리즘 도감에 저장"}
              </button>
            </section>

            {saveMessage && (
              <p className={`editorial-save-message ${saveStatus}`}>
                {saveMessage}
                {user && saveStatus === "saved" && (
                  <> · <a href="/my/results">도감 보기</a></>
                )}
              </p>
            )}

            <ResultFeedback analysisType="quick" />

            <p className="report-disclaimer">
              본 분석은 전통적·문화적 자기탐색 프레임워크를 활용한 참고
              정보이며 과학적 성격 진단이나 미래 예측을 의미하지 않습니다.
            </p>
          </article>
        </div>

        <nav className="mobile-report-nav">
          <button type="button" onClick={() => setPhase("landing")}>분석하기</button>
          <a href="#cross-analysis" className="active">교차 리포트</a>
          <a href="/my/results">내 프리즘 도감</a>
        </nav>

        {authPromptOpen && (
          <AuthModal
            onClose={() => setAuthPromptOpen(false)}
            onGoogle={startGoogleLogin}
          />
        )}

        {detailedOpen && (
          <DetailedModal
            birthTime={birthTime}
            birthTimeKnown={birthTimeKnown}
            birthplaceId={birthplaceId}
            birthplaceQuery={birthplaceQuery}
            status={detailedStatus}
            error={detailedError}
            onBirthTime={setBirthTime}
            onBirthTimeKnown={setBirthTimeKnown}
            onBirthplace={(value) => {
              setBirthplaceId(value);
              setBirthplaceQuery("");
            }}
            onBirthplaceQuery={setBirthplaceQuery}
            onClose={() => setDetailedOpen(false)}
            onRun={runDetailedAnalysis}
          />
        )}
      </main>
    );
  }

  return (
    <main className="editorial-shell landing-shell">
      {user && (
        <div className="landing-account-row">
          <UserAccountMenu user={user} onLogout={signOutUser} />
        </div>
      )}

      <section className="landing-hero">
        <span className="landing-kicker"><i /> 인간 본질을 비추는 세 가지 빛</span>
        <h1>여러 관점으로 나를 보다.</h1>
        <p>
          사주, 점성술, 수비학을 각각 깊이 계산한 뒤
          <br className="desktop-break" />
          세 전문 체계가 반복해서 말하는 패턴과 서로 다른 신호를 한 장의 운명 지도로 겹쳐봅니다.
        </p>

        <figure className="prism-photo">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuae1nenex4FYZRraygw4ECMyjsZ4brvTG02aQLK-QZ5KmDYBZfOLYhXYSeLQsqS33ggHevgV7s7fKj-JYzGUr_THoFRm4Ld_3AV8rqh0Xrw_VaIcvUR3pjHUUPkE-_o8lU86w-u4d64I7QY8KSaQvnFhHtLeglI0uSiVTfr_zduvxvX8qF39TS4i-3sgDYbk51nOp6VIELrjzy212Cwgy3k-YO4CcPlFN5DOJyh2cKSZCSnNhIcVC"
            alt="따뜻한 빛 아래 놓인 프리즘 오브제"
          />
          <figcaption>
            <span>PRISM ARCHITECTURE</span>
            <em>Cross-Cosmic Inquiries</em>
          </figcaption>
        </figure>

        <div className="landing-domain-stack">
          <DomainIntro
            tone="saju"
            mark="炎"
            title="사주"
            companion="Modi"
            description="사주 원국부터 오행, 십신, 지장간, 합·충·형·파·해까지 명리 구조를 깊게 읽습니다."
          />
          <DomainIntro
            tone="astro"
            mark="✦"
            title="점성술"
            companion="Stella"
            description="10개 주요 천체, 상승궁, 하우스, 주요 각과 차트 구조를 전문 점성 차트 수준으로 계산합니다."
          />
          <DomainIntro
            tone="numero"
            mark="№"
            title="수비학"
            companion="Pico"
            description="Life Path를 넘어 Birthday, Attitude, Period, Pinnacle, Challenge까지 생애 수리 구조를 봅니다."
          />
        </div>
      </section>

      <form className="editorial-input-card" onSubmit={submit}>
        <div className="input-card-head">
          <div>
            <h2>생년월일 입력</h2>
            <p>{calendarType === "solar" ? "양력" : "음력"} 생년월일 기준으로 분석합니다.</p>
          </div>
          <div className="calendar-toggle" role="group" aria-label="달력 기준">
            <button
              type="button"
              className={calendarType === "solar" ? "active" : ""}
              onClick={() => {
                setCalendarType("solar");
                setIsLeapMonth(false);
              }}
            >
              양력
            </button>
            <button
              type="button"
              className={calendarType === "lunar" ? "active" : ""}
              onClick={() => setCalendarType("lunar")}
            >
              음력
            </button>
          </div>
        </div>

        <div className="editorial-date-grid">
          <EditorialDateField
            label="연도 (YYYY)"
            value={year}
            suffix=""
            maxLength={4}
            setValue={setYear}
          />
          <EditorialDateField
            label="월 (MM)"
            value={month}
            suffix=""
            maxLength={2}
            setValue={setMonth}
          />
          <EditorialDateField
            label="일 (DD)"
            value={day}
            suffix=""
            maxLength={2}
            setValue={setDay}
          />
        </div>

        {calendarType === "lunar" && (
          <div className="lunar-options">
            <label>
              <input
                type="checkbox"
                checked={isLeapMonth}
                onChange={(event) => setIsLeapMonth(event.target.checked)}
              />
              <span>윤달로 입력</span>
            </label>
            <small>음력 생년월일은 분석 전에 양력 날짜로 변환해 계산합니다.</small>
          </div>
        )}

        <div className="preset-row">
          <span>예시 선택:</span>
          {presetDates.map((preset) => (
            <button
              type="button"
              key={preset.label}
              onClick={() => {
                setYear(preset.y);
                setMonth(preset.m);
                setDay(preset.d);
                setCalendarType("solar");
                setIsLeapMonth(false);
                setError("");
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {error && <p className="editorial-form-error">{error}</p>}

        <button className="editorial-primary-cta" type="submit">
          나의 프리즘 분석 시작
          <span>→</span>
        </button>

        <p className="editorial-privacy">
          <span>▣</span>
          로그인 없이 바로 분석할 수 있어요 · 데이터는 안전하게 보관됩니다.
        </p>
      </form>

      <section className="landing-manifesto">
        <h2>
          세 가지 간단한 테스트가 아니라,
          <br />
          세 개의 전문 체계를 하나로 겹칩니다.
        </h2>
        <p>
          각 체계의 원본 계산과 전문 해석은 독립적으로 보존하고,
          마지막에만 서로 겹쳐 반복되는 패턴과 시간의 흐름을 하나의 운명 지도로 정리합니다.
        </p>

        <div className="prism-diagram" aria-hidden="true">
          <span className="prism-triangle" />
          <i className="ray ray-saju" />
          <i className="ray ray-astro" />
          <i className="ray ray-numero" />
          <b>PRISM</b>
        </div>

        <div className="manifesto-points">
          <article>
            <span>01</span>
            <div>
              <strong>단편적 점괘가 아니라 다각도 교차 검증</strong>
              <p>독립적인 세 관점의 공통점과 차이를 한곳에서 비교합니다.</p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <strong>차이를 모순이 아닌 입체적 잠재력으로 해석</strong>
              <p>서로 다른 결론을 지우지 않고, 맥락과 조건의 차이로 읽습니다.</p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <strong>쉬운 일상 한국어로 풀어낸 지적인 에세이 리포트</strong>
              <p>전문용어는 근거로 남기되, 먼저 사람이 읽을 수 있는 언어로 번역합니다.</p>
            </div>
          </article>
        </div>
      </section>

      <footer className="editorial-footer">
        <strong>✾ PRISM · 프리즘</strong>
        <p>
          본 분석 서비스는 개인의 내면 탐색과 사색을 돕기 위해 현대 심리학적
          프레임워크와 전통적 문화 인사이트를 참고합니다.
        </p>
        <small>© 2026 Prism Analytical Studio.</small>
      </footer>
    </main>
  );
}

function EditorialDateField({
  label,
  value,
  setValue,
  suffix,
  maxLength,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  suffix: string;
  maxLength: number;
}) {
  return (
    <label className="editorial-date-field">
      <span>{label}</span>
      <div>
        <input
          inputMode="numeric"
          value={value}
          maxLength={maxLength}
          onChange={(event) =>
            setValue(event.target.value.replace(/\D/g, "").slice(0, maxLength))
          }
        />
        {suffix && <em>{suffix}</em>}
      </div>
    </label>
  );
}

function DomainIntro({
  tone,
  mark,
  title,
  companion,
  description,
}: {
  tone: "saju" | "astro" | "numero";
  mark: string;
  title: string;
  companion: string;
  description: string;
}) {
  return (
    <article className={`landing-domain-card ${tone}`}>
      <span className="domain-symbol">{mark}</span>
      <div>
        <div className="domain-title-row">
          <strong>{title}</strong>
          <span>{companion}</span>
        </div>
        <p>{description}</p>
      </div>
    </article>
  );
}

function LensCard({
  tone,
  code,
  title,
  subtitle,
  quote,
  detail,
}: {
  tone: "saju" | "astro" | "numero";
  code: string;
  title: string;
  subtitle: string;
  quote: string;
  detail: string;
}) {
  return (
    <article className={`lens-card ${tone}`}>
      <div className="lens-card-head">
        <span>{code}</span>
        <div>
          <h3>{title}</h3>
          <small>{subtitle}</small>
        </div>
      </div>
      <blockquote>{quote}</blockquote>
      <p>{detail}</p>
    </article>
  );
}

function DetailedReport({
  quick,
  data,
  narrativeState,
  saveStatus,
  saveMessage,
  onSave,
}: {
  quick: QuickAnalysisResponse;
  data: DetailedAnalysisResponse;
  narrativeState: "idle" | "loading" | "gemini" | "fallback";
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveMessage: string;
  onSave: () => void;
}) {
  const place = BIRTHPLACES.find(
    (item) => item.id === data.input.birthplaceId,
  )?.label;

  const agreementChanges = data.cross
    .map((item) => {
      const quickItem = quick.cross.find((entry) => entry.trait === item.trait);
      const quickAgreement = quickItem?.agreement ?? 0;

      return {
        trait: item.trait,
        label: TRAIT_LABELS[item.trait] ?? item.trait,
        quick: quickAgreement,
        detailed: item.agreement,
        delta: item.agreement - quickAgreement,
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  const hourPillar = data.engines.saju.pillars[3];

  return (
    <div className="detailed-editorial-report">
      <div className="deep-report-copy">
        <small>DETAILED READING</small>
        <h2>출생시간을 반영한 두 번째 프리즘</h2>
        <p>
          {data.input.timeKnown ? data.input.time : "시간 미상"} · {place ?? data.input.birthplaceId} · {data.input.timeKnown ? "Whole Sign Houses" : "Time-independent mode"}
        </p>
      </div>

      <section className="detailed-narrative-block">
        <div className="detailed-narrative-head">
          <span>
            {narrativeState === "loading"
              ? "AI 해석 정리 중"
              : data.narrative.generatedBy === "gemini"
                ? "Gemini Detailed"
                : "규칙 기반 Detailed"}
          </span>
        </div>
        <blockquote>{data.narrative.summary}</blockquote>

        <div className="detailed-narrative-grid">
          {data.narrative.keywords.slice(0, 3).map((item, index) => (
            <article key={item.title + index}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="detailed-angle-row">
        <span>
          <small>ASC</small>
          <b>{data.engines.astrology.ascendant?.sign ?? "시간 필요"}</b>
          <em>{data.engines.astrology.ascendant ? `${data.engines.astrology.ascendant.degreeInSign.toFixed(1)}°` : "미계산"}</em>
        </span>
        <span>
          <small>MC</small>
          <b>{data.engines.astrology.midheaven?.sign ?? "시간 필요"}</b>
          <em>{data.engines.astrology.midheaven ? `${data.engines.astrology.midheaven.degreeInSign.toFixed(1)}°` : "미계산"}</em>
        </span>
        <span>
          <small>시주</small>
          <b>{data.engines.saju.pillars[3]?.text ?? "시간 필요"}</b>
          <em>{data.engines.saju.pillars[3]?.korean ?? "미계산"}</em>
        </span>
      </div>

      {data.engines.astrology.houses.length > 0 ? (
        <div className="detailed-house-grid">
          {data.engines.astrology.houses.map((house) => (
            <span key={house.house}>
              <small>{house.house}H</small>
              <b>{house.sign.replace("자리", "")}</b>
            </span>
          ))}
        </div>
      ) : (
        <div className="time-unknown-notice">
          출생시간이 없어 12 Houses와 행성별 House는 계산하지 않았어요.
        </div>
      )}

      <section className="domain-depth-grid">
        <article className="domain-depth-card saju">
          <div className="domain-depth-head">
            <small>SAJU DEPTH</small>
            <h3>월령 · 강약 · 통근 · 십신 · 지장간</h3>
          </div>

          <div className="saju-strength-panel">
            <div>
              <small>일간 강약 휴리스틱</small>
              <strong>{data.engines.saju.strength.level}</strong>
              <span>{data.engines.saju.strength.score}/100</span>
            </div>
            <div>
              <small>월령</small>
              <strong>
                {data.engines.saju.monthCommand.korean}
                · {data.engines.saju.monthCommand.mainHiddenTenGod}
              </strong>
              <span>
                {data.engines.saju.rooting.dayMasterRooted
                  ? "통근 " + data.engines.saju.rooting.rootBranches.length + "개"
                  : "직접 통근 단서 적음"}
              </span>
            </div>
          </div>

          <div className="saju-strength-factors">
            {data.engines.saju.strength.factors.map((factor) => (
              <span key={factor}>{factor}</span>
            ))}
          </div>

          <div className="domain-depth-stat-list">
            {Object.entries(data.engines.saju.tenGodSummary)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([label, count]) => (
                <span key={label}>
                  <b>{label}</b>
                  <em>{count}</em>
                </span>
              ))}
          </div>

          <div className="domain-depth-evidence">
            {data.engines.saju.pillars.map((pillar) => (
              <div key={pillar.label}>
                <strong>{pillar.label} {pillar.text}</strong>
                <p>
                  천간 {pillar.stemTenGod ?? "일간"}
                  {pillar.hiddenStems?.length
                    ? ` · 지장간 ${pillar.hiddenStems
                        .map((item) => `${item.korean}(${item.tenGod})`)
                        .join(" · ")}`
                    : ""}
                </p>
              </div>
            ))}
          </div>

          {data.engines.saju.branchRelations.length > 0 ? (
            <div className="domain-relation-row">
              {data.engines.saju.branchRelations.map((relation, index) => (
                <span key={relation.type + relation.branches.join("") + index}>
                  {relation.type} · {relation.labels.join("·")}
                </span>
              ))}
            </div>
          ) : (
            <p className="domain-depth-empty">현재 네 기둥에서 주요 합·충·형·파·해가 잡히지 않았어요.</p>
          )}
        </article>

        <article className="domain-depth-card astro">
          <div className="domain-depth-head">
            <small>ASTROLOGY DEPTH</small>
            <h3>10 Planets · Aspects · Rulers · Dignity</h3>
          </div>

          <div className="astrology-structure-row">
            <span>
              <small>Chart Ruler</small>
              <b>{data.engines.astrology.chartRuler?.primary ?? "시간 필요"}</b>
              <em>
                {data.engines.astrology.chartRuler
                  ? data.engines.astrology.chartRuler.sign +
                    (data.engines.astrology.chartRuler.house
                      ? " · " + data.engines.astrology.chartRuler.house + "H"
                      : "")
                  : "ASC 필요"}
              </em>
            </span>
            <span>
              <small>Elements</small>
              <b>
                F{data.engines.astrology.balance.elements.fire} ·
                E{data.engines.astrology.balance.elements.earth} ·
                A{data.engines.astrology.balance.elements.air} ·
                W{data.engines.astrology.balance.elements.water}
              </b>
              <em>10 planets balance</em>
            </span>
            <span>
              <small>Modalities</small>
              <b>
                C{data.engines.astrology.balance.modalities.cardinal} ·
                F{data.engines.astrology.balance.modalities.fixed} ·
                M{data.engines.astrology.balance.modalities.mutable}
              </b>
              <em>cardinal / fixed / mutable</em>
            </span>
          </div>

          <div className="planet-depth-grid">
            {data.engines.astrology.bodies.map((body) => (
              <span key={body.body}>
                <small>{body.body}</small>
                <b>{body.sign.replace("자리", "")}</b>
                <em>
                  {body.longitude.toFixed(1)}°
                  {body.house ? " · " + body.house + "H" : ""}
                  {" · " + body.modality + " · " + body.dignity}
                  {" · " + body.motion}
                  {" · " + body.speedDegPerDay.toFixed(2) + "°/d"}
                </em>
              </span>
            ))}
          </div>

          <div className="aspect-list">
            {data.engines.astrology.aspects.slice(0, 8).map((aspect) => (
              <div key={`${aspect.bodyA}-${aspect.bodyB}-${aspect.type}`}>
                <strong>{aspect.bodyA} × {aspect.bodyB}</strong>
                <span>{aspect.type} · {aspect.phase}</span>
                <em>orb {aspect.orb.toFixed(1)}°</em>
              </div>
            ))}
          </div>

          <div className="astrology-patterns">
            <div>
              <small>Retrograde</small>
              <strong>
                {data.engines.astrology.patterns.retrogrades.length > 0
                  ? data.engines.astrology.patterns.retrogrades.join(" · ")
                  : "없음"}
              </strong>
            </div>
            <div>
              <small>Angular Planets</small>
              <strong>
                {data.engines.astrology.patterns.angularBodies.length > 0
                  ? data.engines.astrology.patterns.angularBodies
                      .map((item) => item.body + " " + item.house + "H")
                      .join(" · ")
                  : "시간 기반 강조 없음"}
              </strong>
            </div>
            <div>
              <small>Stellium</small>
              <strong>
                {data.engines.astrology.patterns.stelliums.length > 0
                  ? data.engines.astrology.patterns.stelliums
                      .map((item) => item.sign.replace("자리", "") + " " + item.bodies.join("/"))
                      .join(" · ")
                  : "3행성 이상 집중 없음"}
              </strong>
            </div>
          </div>

          <div className="aspect-list">
            {data.engines.astrology.transits.aspects.slice(0, 6).map((aspect) => {
              const body = data.engines.astrology.transits.bodies.find(
                (item) => item.body === aspect.transitBody,
              );

              return (
                <div key={`transit-${aspect.transitBody}-${aspect.natalPoint}-${aspect.type}`}>
                  <strong>{aspect.transitBody} → {aspect.natalPoint}</strong>
                  <span>{aspect.type} · {aspect.phase}</span>
                  <em>
                    orb {aspect.orb.toFixed(1)}°
                    {body ? ` · ${body.motion} · ${body.speedDegPerDay.toFixed(3)}°/d` : ""}
                  </em>
                </div>
              );
            })}
          </div>
        </article>

        <article className="domain-depth-card numero">
          <div className="domain-depth-head">
            <small>NUMEROLOGY DEPTH</small>
            <h3>Core Numbers · Cycles</h3>
          </div>

          <div className="numerology-core-grid">
            <span><small>Life Path</small><b>{data.engines.numerology.lifePath}</b></span>
            <span><small>Birthday</small><b>{data.engines.numerology.birthdayNumber}</b></span>
            <span><small>Attitude</small><b>{data.engines.numerology.attitudeNumber}</b></span>
          </div>

          <div className="numerology-cycle-block">
            <strong>Period Cycles</strong>
            <p>
              {data.engines.numerology.periodCycles.first}
              <b>→</b>
              {data.engines.numerology.periodCycles.second}
              <b>→</b>
              {data.engines.numerology.periodCycles.third}
            </p>
          </div>

          <div className="numerology-cycle-block">
            <strong>Pinnacles</strong>
            <p>{data.engines.numerology.pinnacles.join(" · ")}</p>
          </div>

          <div className="numerology-cycle-block">
            <strong>Challenges</strong>
            <p>{data.engines.numerology.challenges.join(" · ")}</p>
          </div>

          <div className="numerology-current-cycle">
            <small>
              CURRENT CYCLE · {data.engines.numerology.personalCycles.asOfDate}
            </small>
            <div>
              <span>
                <b>{data.engines.numerology.personalCycles.personalYear}</b>
                <em>Personal Year</em>
              </span>
              <span>
                <b>{data.engines.numerology.personalCycles.personalMonth}</b>
                <em>Personal Month</em>
              </span>
              <span>
                <b>{data.engines.numerology.personalCycles.personalDay}</b>
                <em>Personal Day</em>
              </span>
            </div>
          </div>
        </article>
      </section>

      {data.destinyTiming && (
        <section className="destiny-now-section">
          <div className="destiny-now-head">
            <div>
              <small>DESTINY NOW · {data.destinyTiming.asOfDate}</small>
              <h3>지금 세 체계가 강조하는 흐름</h3>
            </div>
            <span>현재 시점 스냅샷</span>
          </div>

          <div className="destiny-signal-grid">
            {data.destinyTiming.signals.map((signal) => (
              <article className={signal.source} key={signal.source + signal.title}>
                <div>
                  <small>
                    {signal.source === "saju"
                      ? "SAJU"
                      : signal.source === "astrology"
                        ? "ASTROLOGY"
                        : "NUMEROLOGY"}
                  </small>
                  <span>{DESTINY_THEME_LABELS[signal.theme] ?? signal.theme}</span>
                </div>
                <strong>{signal.title}</strong>
                <ul>
                  {signal.evidence.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="destiny-convergence">
            <small>CROSS-SYSTEM TIMING</small>
            {data.destinyTiming.convergences.length > 0 ? (
              data.destinyTiming.convergences.map((item) => (
                <div key={item.theme}>
                  <span>{item.label}</span>
                  <strong>{item.sources.length}개 체계 동시 강조</strong>
                  <em>{item.strength}%</em>
                </div>
              ))
            ) : (
              <p>
                지금은 세 체계가 서로 다른 영역을 강조해요. 하나의 방향으로
                억지로 합치지 않고 각각의 신호를 그대로 보여줍니다.
              </p>
            )}
          </div>

          <p className="destiny-now-note">
            현재 시점의 전통적·문화적 해석 신호를 겹쳐 본 참고 정보이며,
            특정 사건의 발생을 예측하거나 보장하지 않습니다.
          </p>
        </section>
      )}

      <DestinyTimelineExplorer analysis={data} />

      <section className="quick-detailed-compare">
        <div className="compare-heading">
          <div>
            <small>WHAT CHANGED</small>
            <h3>Quick에서 Detailed로, 무엇이 더 보였을까?</h3>
          </div>
          <span>{data.input.timeKnown ? data.input.time : "시간 미상"} · {place ?? data.input.birthplaceId}</span>
        </div>

        <div className="compare-grid">
          <article>
            <small>사주</small>
            <strong>시주가 추가됐어요</strong>
            <p>
              {hourPillar
                ? <>Quick은 년주·월주·일주까지만 봤고, Detailed에서는 {hourPillar.text}({hourPillar.korean}) 시주까지 반영했어요.</>
                : <>출생시간이 없어 Quick과 동일하게 년주·월주·일주까지만 사용했어요.</>}
            </p>
          </article>

          <article>
            <small>점성학</small>
            <strong>상승궁과 하우스가 열렸어요</strong>
            <p>
              {data.input.timeKnown
                ? <>태양 {quick.engines.astrology.sunSign}에 더해 ASC {data.engines.astrology.ascendant?.sign},
                    달 {data.engines.astrology.moonSign}, MC {data.engines.astrology.midheaven?.sign}을 볼 수 있어요.</>
                : <>출생시간이 없어 태양과 시간 비민감 행성만 유지하고 Moon, ASC, MC, Houses는 제외했어요.</>}
            </p>
          </article>

          <article>
            <small>수비학</small>
            <strong>Life Path는 그대로예요</strong>
            <p>
              수비학은 생년월일을 기준으로 하므로 Life Path {data.engines.numerology.lifePath}는
              출생시간을 추가해도 바뀌지 않아요.
            </p>
          </article>
        </div>

        <div className="agreement-delta-list">
          <div className="agreement-delta-head">
            <strong>관점 합의도 변화</strong>
            <small>상세 정보 추가 전후 비교</small>
          </div>
          {agreementChanges.map((item) => (
            <div className="agreement-delta-row" key={item.trait}>
              <span>{item.label}</span>
              <div className="agreement-delta-values">
                <small>Quick {item.quick}%</small>
                <b>→</b>
                <strong>Detailed {item.detailed}%</strong>
                <em className={item.delta > 0 ? "up" : item.delta < 0 ? "down" : "same"}>
                  {item.delta > 0 ? `+${item.delta}` : item.delta}
                </em>
              </div>
            </div>
          ))}
        </div>
      </section>

      <DetailedQuestionPanel analysis={data} />
      <ResultFeedback analysisType="detailed" />

      <div className="detailed-report-actions">
        <button
          className="report-primary-btn compact"
          type="button"
          disabled={saveStatus === "saving" || saveStatus === "saved"}
          onClick={onSave}
        >
          {saveStatus === "saving"
            ? "상세 리포트 저장 중..."
            : saveStatus === "saved"
              ? "상세 리포트 저장 완료"
              : "상세 리포트 저장"}
        </button>
        {saveMessage && (
          <p className={`editorial-save-message ${saveStatus}`}>{saveMessage}</p>
        )}
      </div>
    </div>
  );
}

function DetailedQuestionPanel({
  analysis,
}: {
  analysis: DetailedAnalysisResponse;
}) {
  const suggestions = [
    "내 성향을 더 쉽게 설명해줘",
    "일할 때 강점은 뭐야?",
    "관계에서는 어떤 특징이 보여?",
    "세 분석이 다르게 말하는 부분을 설명해줘",
  ];

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    Array<{
      question: string;
      answer: string;
      evidence: string[];
      generatedBy: "gemini" | "fallback";
    }>
  >([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function ask(nextQuestion?: string) {
    const value = (nextQuestion ?? question).trim();
    if (!value || status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);

      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: value,
          analysis,
        }),
        signal: controller.signal,
      });

      window.clearTimeout(timeout);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "답변을 만들지 못했어요.");
      }

      void trackEvent("ask_prism_used", {
        source: "live-detailed-report",
        generatedBy: payload.generatedBy === "gemini" ? "gemini" : "fallback",
      }, "detailed");

      setMessages((current) => [
        ...current.slice(-4),
        {
          question: value,
          answer: String(payload.answer ?? ""),
          evidence: Array.isArray(payload.evidence)
            ? payload.evidence.map(String)
            : [],
          generatedBy:
            payload.generatedBy === "gemini" ? "gemini" : "fallback",
        },
      ]);
      setQuestion("");
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "답변이 오래 걸려 중단했어요. 계산 결과는 그대로 유지됩니다."
          : error instanceof Error
            ? error.message
            : "답변을 만들지 못했어요.",
      );
    }
  }

  return (
    <section className="detailed-question-panel">
      <div className="detailed-question-head">
        <div>
          <small>ASK PRISM</small>
          <h3>이 결과 안에서 더 물어보기</h3>
        </div>
        <span>Detailed only</span>
      </div>

      <p className="detailed-question-intro">
        현재 계산 결과를 근거로만 답해요. 새로운 사주나 천체 값을 만들어내지는 않아요.
      </p>

      <div className="question-suggestions">
        {suggestions.map((item) => (
          <button
            type="button"
            key={item}
            disabled={status === "loading"}
            onClick={() => void ask(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {messages.length > 0 && (
        <div className="question-thread">
          {messages.map((item, index) => (
            <article key={item.question + index}>
              <div className="question-user">
                <small>YOU</small>
                <p>{item.question}</p>
              </div>
              <div className="question-answer">
                <div>
                  <small>PRISM</small>
                  <span>{item.generatedBy === "gemini" ? "Gemini" : "Fallback"}</span>
                </div>
                <p>{item.answer}</p>
                {item.evidence.length > 0 && (
                  <ul>
                    {item.evidence.map((evidence) => (
                      <li key={evidence}>{evidence}</li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="question-composer">
        <textarea
          maxLength={300}
          rows={3}
          value={question}
          placeholder="예: 세 분석이 다르게 말하는 부분을 쉽게 설명해줘"
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void ask();
            }
          }}
        />
        <div>
          <small>{question.length}/300 · Ctrl/⌘ + Enter</small>
          <button
            type="button"
            disabled={!question.trim() || status === "loading"}
            onClick={() => void ask()}
          >
            {status === "loading" ? "답변 정리 중..." : "질문하기"}
          </button>
        </div>
      </div>

      {message && <p className="question-error">{message}</p>}
    </section>
  );
}

function UserAccountMenu({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const displayName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : user.email?.split("@")[0] ?? "Prism";

  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;

  return (
    <details className="user-account-menu">
      <summary className="report-profile" aria-label="계정 메뉴">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" />
        ) : (
          <span>{displayName.slice(0, 1).toUpperCase()}</span>
        )}
      </summary>

      <div className="user-account-popover">
        <div className="user-account-copy">
          <strong>{displayName}</strong>
          <small>{user.email}</small>
        </div>
        <a href="/my/results">내 프리즘 도감</a>
        <button type="button" onClick={onLogout}>로그아웃</button>
      </div>
    </details>
  );
}

function AuthModal({
  onClose,
  onGoogle,
}: {
  onClose: () => void;
  onGoogle: () => void;
}) {
  return (
    <div className="editorial-modal-backdrop" onClick={onClose}>
      <section
        className="editorial-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <small>SAVE REPORT</small>
        <h2>이 리포트를 내 도감에 보관할까요?</h2>
        <p>
          Google로 로그인하면 지금 보고 있는 분석 결과를 그대로 저장합니다.
        </p>
        <button className="google-editorial-btn" type="button" onClick={onGoogle}>
          <span>G</span>
          Google로 계속하기
        </button>
        <button className="modal-ghost-btn" type="button" onClick={onClose}>
          나중에 할게요
        </button>
      </section>
    </div>
  );
}

function DetailedModal({
  birthTime,
  birthTimeKnown,
  birthplaceId,
  birthplaceQuery,
  status,
  error,
  onBirthTime,
  onBirthTimeKnown,
  onBirthplace,
  onBirthplaceQuery,
  onClose,
  onRun,
}: {
  birthTime: string;
  birthTimeKnown: boolean;
  birthplaceId: string;
  birthplaceQuery: string;
  status: "idle" | "loading" | "done" | "error";
  error: string;
  onBirthTime: (value: string) => void;
  onBirthTimeKnown: (value: boolean) => void;
  onBirthplace: (value: string) => void;
  onBirthplaceQuery: (value: string) => void;
  onClose: () => void;
  onRun: () => void;
}) {
  return (
    <div className="editorial-modal-backdrop" onClick={onClose}>
      <section
        className="editorial-modal detailed-editorial-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-heading-row">
          <div>
            <small>DETAILED READING</small>
            <h2>더 정확한 나를 보기 위한 정보</h2>
          </div>
          <button type="button" onClick={onClose}>×</button>
        </div>

        <p className="modal-description">
          출생시간은 사주의 시주와 점성술의 상승궁·하우스 계산에 사용됩니다.
        </p>

        <label className="editorial-modal-field">
          <span>태어난 시간</span>
          <input
            type="time"
            value={birthTime}
            disabled={!birthTimeKnown}
            onChange={(event) => onBirthTime(event.target.value)}
          />
        </label>

        <label className="unknown-time-option">
          <input
            type="checkbox"
            checked={!birthTimeKnown}
            onChange={(event) => onBirthTimeKnown(!event.target.checked)}
          />
          <span>
            <strong>태어난 시간을 몰라요</strong>
            <small>시주, Moon, ASC, MC, 12 Houses는 제외하고 가능한 정보만 분석해요.</small>
          </span>
        </label>

        <div className="editorial-modal-field birthplace-search-field">
          <span>태어난 지역</span>
          <input
            type="search"
            placeholder="도시명 검색 · 예: 수원, 전주, 제주"
            value={birthplaceQuery}
            onChange={(event) => onBirthplaceQuery(event.target.value)}
          />

          <div className="birthplace-search-results">
            {BIRTHPLACES.filter((place) => {
              const query = birthplaceQuery.trim().toLowerCase();
              if (!query) return place.id === birthplaceId || ["seoul","busan","daegu","incheon","gwangju","daejeon","ulsan","sejong","suwon","jeju"].includes(place.id);

              return [place.label, place.region, ...(place.aliases ?? [])]
                .join(" ")
                .toLowerCase()
                .includes(query);
            })
              .slice(0, 12)
              .map((place) => (
                <button
                  type="button"
                  key={place.id}
                  className={place.id === birthplaceId ? "selected" : ""}
                  onClick={() => onBirthplace(place.id)}
                >
                  <span>
                    <strong>{place.label}</strong>
                    <small>{place.region}</small>
                  </span>
                  <em>
                    {place.latitude.toFixed(2)}°, {place.longitude.toFixed(2)}°
                  </em>
                </button>
              ))}
          </div>
        </div>

        <div className="modal-feature-row">
          <span>시주</span>
          <span>ASC · MC</span>
          <span>12 Houses</span>
        </div>

        {error && <p className="editorial-form-error">{error}</p>}

        <button
          className="report-primary-btn"
          type="button"
          disabled={status === "loading"}
          onClick={onRun}
        >
          {status === "loading" ? "상세 분석 중..." : "상세 분석 시작"}
          <span>→</span>
        </button>
      </section>
    </div>
  );
}
