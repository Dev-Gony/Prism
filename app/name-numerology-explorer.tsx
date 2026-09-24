"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics/client";
import type { DetailedAnalysisResponse } from "@/lib/analysis/detailed-types";
import type { NameNumerologyResult } from "@/lib/numerology/name";

export default function NameNumerologyExplorer({
  analysis,
}: {
  analysis: DetailedAnalysisResponse;
}) {
  const [name, setName] = useState("");
  const [result, setResult] = useState<NameNumerologyResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function calculate() {
    const value = name.trim();
    if (!value || status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/destiny/numerology-name", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: value,
          lifePath: analysis.engines.numerology.lifePath,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "이름 수비학을 계산하지 못했어요.");
      }

      void trackEvent(
        "name_numerology_calculated",
        {
          hasResult: true,
          letterCount: payload.letterCount,
        },
        "detailed",
      );

      setResult(payload as NameNumerologyResult);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "이름 수비학을 계산하지 못했어요.",
      );
    }
  }

  return (
    <section className="name-numerology-explorer">
      <div className="name-numerology-head">
        <div>
          <small>NAME NUMEROLOGY</small>
          <h3>이름까지 넣으면 수비학이 더 깊어집니다</h3>
          <p>
            생년월일 기반 수비학과 별도로, 실제 사용하는 영문/로마자 이름의
            문자값을 계산합니다.
          </p>
        </div>
        <span>선택 입력</span>
      </div>

      <div className="name-numerology-input">
        <label>
          <span>영문 / 로마자 이름</span>
          <input
            type="text"
            value={name}
            maxLength={80}
            placeholder="예: GILDONG HONG"
            onChange={(event) => {
              setName(event.target.value);
              setResult(null);
              setMessage("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void calculate();
              }
            }}
          />
        </label>
        <button
          type="button"
          disabled={!name.trim() || status === "loading"}
          onClick={() => void calculate()}
        >
          {status === "loading" ? "계산 중..." : "이름 수비학 계산"}
        </button>
      </div>

      <p className="name-numerology-privacy">
        이름은 이 기능 계산 요청에만 사용하며, 이 결과를 저장 리포트에 자동
        포함하지 않습니다.
      </p>

      {result && (
        <div className="name-numerology-result">
          <div className="name-numerology-core">
            <article>
              <small>Expression / Destiny</small>
              <strong>{result.expression}</strong>
              <p>{result.meanings.expression}</p>
            </article>
            <article>
              <small>Soul Urge</small>
              <strong>{result.soulUrge}</strong>
              <p>{result.meanings.soulUrge}</p>
            </article>
            <article>
              <small>Personality</small>
              <strong>{result.personality}</strong>
              <p>{result.meanings.personality}</p>
            </article>
            <article>
              <small>Maturity</small>
              <strong>{result.maturity}</strong>
              <p>{result.meanings.maturity}</p>
            </article>
          </div>

          <div className="name-numerology-secondary">
            <span>
              <small>Balance</small>
              <b>{result.balance}</b>
            </span>
            <span>
              <small>Cornerstone</small>
              <b>{result.cornerstone.letter} · {result.cornerstone.value}</b>
            </span>
            <span>
              <small>Capstone</small>
              <b>{result.capstone.letter} · {result.capstone.value}</b>
            </span>
            <span>
              <small>First Vowel</small>
              <b>
                {result.firstVowel
                  ? result.firstVowel.letter + " · " + result.firstVowel.value
                  : "없음"}
              </b>
            </span>
          </div>

          <div className="name-numerology-patterns">
            <div>
              <small>HIDDEN PASSION</small>
              <strong>{result.hiddenPassion.join(" · ")}</strong>
              <p>이름 안에서 가장 자주 반복되는 숫자 패턴</p>
            </div>
            <div>
              <small>KARMIC LESSONS</small>
              <strong>
                {result.karmicLessons.length > 0
                  ? result.karmicLessons.join(" · ")
                  : "없음"}
              </strong>
              <p>이름에 나타나지 않는 숫자 패턴</p>
            </div>
            <div>
              <small>SUBCONSCIOUS SELF</small>
              <strong>{result.subconsciousSelf}</strong>
              <p>1~9 중 이름에 실제 등장하는 숫자 종류 수</p>
            </div>
          </div>

          <details className="name-numerology-evidence">
            <summary>문자값 분포 보기</summary>
            <div>
              {Object.entries(result.counts).map(([number, count]) => (
                <span key={number}>
                  <b>{number}</b>
                  <em>{count}</em>
                </span>
              ))}
            </div>
          </details>

          <p className="name-numerology-note">
            {result.notes.join(" ")}
          </p>
        </div>
      )}

      {message && <p className="name-numerology-error">{message}</p>}
    </section>
  );
}
