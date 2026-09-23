"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { QuickAnalysisResponse } from "@/lib/analysis/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Phase = "landing" | "loading" | "result";

const presetDates = [
  { label: "✨ 1995.10.24", y: "1995", m: "10", d: "24" },
  { label: "🌸 1998.05.12", y: "1998", m: "05", d: "12" },
  { label: "🍀 2001.12.03", y: "2001", m: "12", d: "03" },
];

const loadingSteps = [
  ["사주 기본 기운 조각 추출", "년주·월주·일주와 기본 오행을 확인하고 있어요."],
  ["별빛 기본 데이터 확인", "생년월일로 확인 가능한 점성 데이터를 살펴보고 있어요."],
  ["피타고라스 숫자 퍼즐 맞추기", "생년월일 숫자 패턴을 계산하고 있어요."],
  ["세 요정의 의견 모으기", "세 관점의 공통점과 차이점을 정리하고 있어요."],
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

  const birthday = useMemo(
    () => `${year || "----"}.${month.padStart(2, "0") || "--"}.${day.padStart(2, "0") || "--"}`,
    [year, month, day],
  );


  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);

      if (!data.user) return;

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

        setAnalysis(pending.analysis);
        const [pendingYear, pendingMonth, pendingDay] = pending.analysis.input.date.split("-");
        setYear(pendingYear);
        setMonth(pendingMonth);
        setDay(pendingDay);
        setPhase("result");

        saveAnalysisToServer(pending.analysis)
          .then(() => {
            window.sessionStorage.removeItem("prism.pending-analysis.v1");
            setSaveStatus("saved");
            setSaveMessage("내 프리즘 도감에 저장했어요 ✨");
          })
          .catch((pendingError) => {
            setSaveStatus("error");
            setSaveMessage(
              pendingError instanceof Error
                ? pendingError.message
                : "저장하지 못했어요.",
            );
          });
      } catch {
        window.sessionStorage.removeItem("prism.pending-analysis.v1");
      }
    });

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    });

    return () => {
      active = false;
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

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    setSaveStatus("idle");
    setSaveMessage("로그아웃했어요.");
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
      setLoadingIndex(3);
      setAnalysis(payload as QuickAnalysisResponse);
      window.setTimeout(() => setPhase("result"), 450);
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
        <header className="lab-header">
          <div className="lab-brand">
            <span className="round-icon peach">♡</span>
            <div><small>TAMAGOTCHI LAB</small><strong>꼬마 요정 연구소</strong></div>
          </div>
          <span className="sync-pill"><i />SYNC {progress}%</span>
        </header>

        <section className="loading-hero toy-card">
          <div className="center">
            <span className="soft-pill">🫧 심층 데이터 조합 중</span>
            <h1>세 꼬마 요정이<br />내 마음을 모으는 중... 🫧</h1>
            <p>사주, 별자리, 수비학 요정들이 머리를 맞대고 있어요!</p>
          </div>

          <div className="console">
            <div className="console-top"><span>● ● ●</span><small>FAIRY CONSOLE v2.4</small></div>
            <div className="fairy-stage">
              <Fairy tone="peach" icon="🔥" name="불꼬미 모디" sub={loadingIndex >= 0 ? "기운 측정 중" : "대기"} />
              <Fairy tone="lavender" icon="✨" name="별빛냥 스텔라" sub={loadingIndex >= 1 ? "별빛 대조 중" : "대기"} />
              <Fairy tone="mint" icon="🌱" name="숫자새싹 피코" sub={loadingIndex >= 2 ? "숫자 계산 중" : "대기"} />
            </div>
            <div className="console-buttons"><b /><b className="active" /><b /></div>
          </div>

          <div className="progress-block">
            <div><span>⌛ 요정 조율 완료도</span><strong>{progress}%</strong></div>
            <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
          </div>
        </section>

        <section className="loading-list">
          <div className="section-head"><span>분석 진행 프로토콜</span><b>{Math.min(loadingIndex + 1, 4)} / 4 작업 중</b></div>
          {loadingSteps.map(([title, desc], index) => {
            const state = index < loadingIndex ? "done" : index === loadingIndex ? "active" : "wait";
            return (
              <div className={`loading-row ${state}`} key={title}>
                <span className="step-icon">{state === "done" ? "✓" : state === "active" ? "↻" : "…"}</span>
                <div><strong>{title}</strong><small>{desc}</small></div>
                <span className="state-chip">{state === "done" ? "완료 💖" : state === "active" ? "분석 중 ⏳" : "대기 중 💭"}</span>
              </div>
            );
          })}
        </section>

        <div className="whisper toy-card">
          <span className="round-icon peach">💬</span>
          <div><small>요정들의 귓속말 · 실시간 속닥속닥</small><p>“복잡한 말 대신, 네가 바로 이해할 수 있는 말로 정리해 줄게! 🍵✨”</p></div>
        </div>
      </Shell>
    );
  }

  if (phase === "result") {
    return (
      <Shell>
        <header className="result-top">
          <div className="brand-line"><span className="round-icon peach">✦</span><strong>Prism ✦</strong><span className="tiny-pill lavender">나 알아보기 ✨</span></div>
          <button
            className="profile-btn"
            aria-label={user ? "로그아웃" : "로그인 상태"}
            title={user ? "로그아웃" : "로그인 전"}
            onClick={user ? signOut : undefined}
          >
            {user?.user_metadata?.avatar_url ? (
              <img src={String(user.user_metadata.avatar_url)} alt="" />
            ) : user ? "✓" : "👤"}
          </button>
        </header>

        <section className="result-hero">
          <div className="result-meta"><span className="tiny-pill lavender">📖 {birthday} 친구의 프리즘 도감</span><span className="tiny-pill">● UI PROTOTYPE</span></div>
          <div className="toy-card terrarium">
            <div className="hero-title"><div><small>SOUL TAMAGOTCHI</small><strong>성향 레벨: 반짝이는 사색가 🌟</strong></div><span className="tiny-pill mint">LV.4 친밀도 만점!</span></div>
            <div className="mini-screen">
              <div className="screen-stats"><span>빛의 조화도 <b>94%</b></span><span>♡ 3요정 동행 중</span></div>
              <div className="mini-fairies">
                <Fairy tone="peach" icon="🔥" name="모디" sub="사주" />
                <Fairy tone="lavender" icon="✨" name="스텔라" sub="점성" big />
                <Fairy tone="mint" icon="7" name="피코" sub="수비" />
              </div>
              <p>✨ 세 요정이 머리를 맞대고 너의 빛을 조합했어요!</p>
            </div>
          </div>
        </section>

        <section className="summary toy-card">
          <span className="round-icon peach">▦</span>
          <div>
            <small>SUMMARY DIALOGUE 💭 · {analysis?.narrative.generatedBy === "gemini" ? "Gemini" : "Rule Fallback"}</small>
            <p>{analysis?.narrative.summary ?? "세 가지 관점을 한 문장으로 정리하고 있어요."}</p>
          </div>
        </section>

        <SectionTitle icon="📚" title="3대 핵심 키워드 카드" sub="UI Mock Result" />
        <section className="keyword-list">
          {(analysis?.narrative.keywords ?? []).map((item, index) => (
            <Keyword
              key={item.title + index}
              tone={["peach", "lavender", "mint"][index] ?? "peach"}
              emoji={["🦁", "🔍", "🌿"][index] ?? "✨"}
              title={item.title}
              pick={index === 0 ? "교차분석 핵심" : "Prism Lens"}
              text={item.description}
              tags={item.tags}
            />
          ))}
        </section>

        <SectionTitle icon="🔮" title="세 요정의 교차 분석" sub="Prism 핵심 경험" />
        <section className="cross-list">
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
        </section>

        <SectionTitle icon="📝" title="요정들의 5가지 관찰 일기" sub="읽기 쉬운 결과 요약" />
        <section className="diary-list">
          {(analysis?.narrative.observations ?? []).map((item, index) => (
            <article className="diary-row" key={item.label + index}>
              <span className={`diary-label tone-${["peach","lavender","mint","peach","lavender"][index] ?? "peach"}`}>{item.label}</span>
              <div><strong>{item.title}</strong><p>{item.description}</p></div>
            </article>
          ))}
        </section>

        <section className="deep-card">
          <div className="deep-title"><span className="round-icon peach">🔑</span><div><strong>더 깊은 비밀이 궁금해? 🗝️</strong><p>출생시간과 출생지역을 더하면 Detailed Reading으로 이어져요.</p></div></div>
          <button className="squishy" type="button" onClick={() => alert("Detailed Mode는 다음 구현 단계에서 연결합니다.")}>상세 분석 잠금 해제 준비하기</button>
        </section>

        <div className="prototype-actions">
          <button className="bubble-btn" onClick={() => setPhase("landing")}>← 처음으로</button>
          <button
            className="dark-btn"
            onClick={saveCurrentAnalysis}
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving"
              ? "저장 중..."
              : saveStatus === "saved"
                ? "저장 완료 ✓"
                : "도감 저장하기"}
          </button>
        </div>
        {saveMessage && (
          <p className={`save-message ${saveStatus}`}>{saveMessage}</p>
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

        <section className="engine-proof">
          <strong>이번 Quick Reading에서 실제 계산된 값</strong>
          <div className="engine-proof-grid">
            <span>사주 <b>{analysis?.engines.saju.pillars.map((item) => item.text).join(" · ")}</b></span>
            <span>점성 <b>태양 {analysis?.engines.astrology.sunSign}</b></span>
            <span>수비 <b>Life Path {analysis?.engines.numerology.lifePath}</b></span>
          </div>
        </section>
        <p className="prototype-note">계산 엔진은 실제 값이며, 해석은 전통적·문화적 자기탐색을 위한 참고 정보입니다.</p>
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
            <div className="room-glow" />
            <div className="room-fairies">
              <Fairy tone="peach" icon="🔥" name="모디" sub="사주" />
              <Fairy tone="lavender" icon="✨" name="스텔라" sub="점성" big />
              <Fairy tone="mint" icon="🌱" name="피코" sub="수비" />
            </div>
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
        {error && <p className="form-error">{error}</p>}
        <button className="squishy" type="submit">‹ 내 꼬마 요정들 깨우기 (무료로 알아보기)</button>
        <p className="privacy">🔒 Quick Reading은 생년월일만 사용해요. 로그인은 필요 없어요.</p>
      </form>

      <div className="reassure"><span>🐣</span><div><strong>무서운 점괘나 어려운 한자는 전혀 없어요</strong><p>전문용어는 숨기지 않되, 먼저 이해하기 쉬운 말로 번역해 들려줄게요.</p></div></div>

      <SectionTitle title="세 요정은 나를 어떻게 볼까?" sub="3대 프리즘 렌즈" />
      <section className="perspectives">
        <Perspective tone="peach" icon="🔥" title="사주 꼬미 모디" chip="동양의 기운">태어난 날과 계절의 흐름을 바탕으로 <b>타고난 기질과 기본 에너지</b>를 살펴봐요.</Perspective>
        <Perspective tone="lavender" icon="🪐" title="별빛 냥이 스텔라" chip="서양 점성">생년월일로 확인 가능한 별빛 데이터를 바탕으로 <b>또 다른 관점의 성향</b>을 비춰줘요.</Perspective>
        <Perspective tone="mint" icon="🌱" title="숫자 새싹 피코" chip="생애 수비학">생년월일 숫자를 모아 <b>대표 숫자와 성장 키워드</b>를 싹틔워요.</Perspective>
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
