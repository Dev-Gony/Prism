"use client";

import { useEffect, useState } from "react";
import type { DailyFortunePayload } from "@/lib/daily-fortune";

type DailyFortuneResponse = {
  fortuneDate: string;
  fortune: DailyFortunePayload | null;
};

export default function DailyFortunePanel() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; data: DailyFortuneResponse }
    | { status: "error" }
  >({ status: "loading" });

  useEffect(() => {
    let active = true;

    void fetch("/api/daily-fortune", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("daily fortune request failed");
        return (await response.json()) as DailyFortuneResponse;
      })
      .then((data) => {
        if (active) setState({ status: "ready", data });
      })
      .catch(() => {
        if (active) setState({ status: "error" });
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") {
    return <section className="daily-fortune-card is-loading">오늘의 프리즘을 불러오고 있어요.</section>;
  }

  if (state.status === "error") {
    return (
      <section className="daily-fortune-card is-empty">
        <strong>오늘의 프리즘을 잠시 불러오지 못했어요.</strong>
        <p>조금 뒤 새로고침해 주세요.</p>
      </section>
    );
  }

  const fortune = state.data.fortune;
  if (!fortune) {
    return (
      <section className="daily-fortune-card is-empty">
        <span className="daily-fortune-kicker">DAILY PRISM · {state.data.fortuneDate}</span>
        <strong>오늘의 운세를 준비할 분석이 아직 없어요.</strong>
        <p>분석을 저장하면 다음 생성부터 나만의 오늘 흐름을 볼 수 있어요.</p>
        <a href="/my/results">내 프리즘 도감 보기</a>
      </section>
    );
  }

  return (
    <section className="daily-fortune-card">
      <div className="daily-fortune-head">
        <div>
          <span className="daily-fortune-kicker">DAILY PRISM · {fortune.date}</span>
          <h2>{fortune.headline}</h2>
        </div>
        <strong className="daily-fortune-score">{fortune.overallScore}</strong>
      </div>
      <p className="daily-fortune-summary">{fortune.summary}</p>
      <div className="daily-fortune-areas">
        {fortune.areas.map((area) => (
          <article key={area.key}>
            <div><strong>{area.label}</strong><span>{area.score}</span></div>
            <p>{area.guidance}</p>
          </article>
        ))}
      </div>
      <small>{fortune.disclaimer}</small>
    </section>
  );
}
