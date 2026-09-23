"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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

  const birthday = useMemo(
    () => `${year || "----"}.${month.padStart(2, "0") || "--"}.${day.padStart(2, "0") || "--"}`,
    [year, month, day],
  );

  useEffect(() => {
    if (phase !== "loading") return;
    setLoadingIndex(0);
    const timers = [
      window.setTimeout(() => setLoadingIndex(1), 700),
      window.setTimeout(() => setLoadingIndex(2), 1450),
      window.setTimeout(() => setLoadingIndex(3), 2200),
      window.setTimeout(() => setPhase("result"), 3200),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [phase]);

  function submit(event: FormEvent) {
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
    setPhase("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (phase === "loading") {
    const progress = [28, 52, 78, 94][loadingIndex] ?? 94;
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
          <button className="profile-btn" aria-label="프로필">👤</button>
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
          <div><small>SUMMARY DIALOGUE 💭</small><p>“남의 말에 쉽게 흔들리지 않고 조용히 나만의 길을 걷는, <mark>따뜻하지만 단단한 사람</mark>이에요.”</p></div>
        </section>

        <SectionTitle icon="📚" title="3대 핵심 키워드 카드" sub="UI Mock Result" />
        <section className="keyword-list">
          <Keyword tone="peach" emoji="🦁" title="당당하고 독립적인 나침반" pick="모디 & 스텔라 픽" text="누가 뭐라 해도 내 마음의 기준이 바로 설 때 움직이는 편. 주도권을 쥐었을 때 가장 든든하고 빛나는 타입으로 표현해요." tags={["#확고한주관", "#자기신뢰", "#자기결정"]} />
          <Keyword tone="lavender" emoji="🔍" title="조용히 본질을 파고드는 깊은 눈" pick="피코 픽" text="겉핥기보다 ‘왜 그럴까?’를 오래 생각하는 편. 침묵 속에서도 핵심을 찾는 사색가 이미지예요." tags={["#본질탐구", "#통찰력", "#깊은대화"]} />
          <Keyword tone="mint" emoji="🌿" title="가까운 사람과 만드는 단단한 숲" pick="3요정 만장일치" text="모두와 넓게 친하기보다 신뢰하는 사람과 깊게 연결되는 관계를 중요하게 여기는 모습으로 표현해요." tags={["#소수정예", "#깊은신뢰", "#안전한관계"]} />
        </section>

        <SectionTitle icon="🔮" title="세 요정의 교차 분석" sub="Prism 핵심 경험" />
        <section className="cross-list">
          <CrossCard tone="peach" badge="비슷하게 보여요 · 96%" title="자기 주도성과 독립적 결단">
            <Dialogue name="모디(사주)" tone="peach">스스로 기준을 세우고 움직이는 힘을 중요하게 봐요.</Dialogue>
            <Dialogue name="스텔라(점성)" tone="lavender">자기 표현과 주체성을 강조하는 관점으로 읽어볼 수 있어요.</Dialogue>
            <Dialogue name="피코(수비학)" tone="mint">혼자 탐구하고 스스로 납득하는 성향과 연결해서 볼 수 있어요.</Dialogue>
            <Conclusion>세 관점 모두 ‘내가 납득해야 움직인다’는 방향에서 만나요.</Conclusion>
          </CrossCard>

          <CrossCard tone="lavender" badge="조금 다르게 보여요" title="관계를 맺는 법 & 방전 방지">
            <Dialogue name="모디" tone="peach">관계를 오래 이어가고 챙기는 면을 강조해요.</Dialogue>
            <Dialogue name="피코" tone="mint">반대로 혼자 정리하는 시간도 꼭 필요하다고 봐요.</Dialogue>
            <Conclusion>모순이라기보다 ‘사람을 좋아하지만 혼자 충전도 필요한 사람’으로 함께 설명할 수 있어요.</Conclusion>
          </CrossCard>

          <CrossCard tone="mint" badge="서로 보완돼요" title="감각적 직관 + 꼼꼼한 정리력">
            <Conclusion>한 체계가 직관을, 다른 체계가 검증과 정리를 강조할 때 서로 다른 강점으로 함께 보여줍니다.</Conclusion>
          </CrossCard>
        </section>

        <SectionTitle icon="📝" title="요정들의 5가지 관찰 일기" sub="읽기 쉬운 결과 요약" />
        <section className="diary-list">
          {[
            ["1. 타고난 결", "호기심 많은 조용한 항해사", "새로운 지식이나 세계를 마주할 때 안쪽에서 스파크가 튀는 타입."],
            ["2. 슈퍼 파워", "복잡한 것을 명쾌하게 정리하는 힘", "어지러운 상황에서도 핵심과 순서를 찾아가는 장점을 강조합니다."],
            ["3. 인연의 결", "서로의 영역을 존중하는 다정함", "너무 밀착하기보다 각자의 공간을 존중하는 관계를 편안하게 느끼는 모습."],
            ["4. 일의 리듬", "이유와 의미가 납득되어야 달리는 엔진", "왜 하는지 이해했을 때 몰입도가 올라가는 방식으로 설명합니다."],
            ["5. 충전 처방", "조용한 시간으로 머릿속 정리하기", "외부 자극을 줄이고 혼자 생각할 시간을 확보하는 식으로 풀어줍니다."],
          ].map(([label, title, text], index) => (
            <article className="diary-row" key={label}><span className={`diary-label tone-${["peach","lavender","mint","peach","lavender"][index]}`}>{label}</span><div><strong>{title}</strong><p>{text}</p></div></article>
          ))}
        </section>

        <section className="deep-card">
          <div className="deep-title"><span className="round-icon peach">🔑</span><div><strong>더 깊은 비밀이 궁금해? 🗝️</strong><p>출생시간과 출생지역을 더하면 Detailed Reading으로 이어져요.</p></div></div>
          <button className="squishy" type="button" onClick={() => alert("Detailed Mode는 다음 구현 단계에서 연결합니다.")}>상세 분석 잠금 해제 준비하기</button>
        </section>

        <div className="prototype-actions">
          <button className="bubble-btn" onClick={() => setPhase("landing")}>← 처음으로</button>
          <button className="dark-btn" onClick={() => alert("저장 기능은 로그인 Spec 이후 구현합니다.")}>도감 저장하기</button>
        </div>
        <p className="prototype-note">현재 화면은 UI Prototype이며 실제 분석 엔진 결과가 아닙니다.</p>
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
