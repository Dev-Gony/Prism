"use client";

import { useMemo, useState } from "react";
import type { DetailedAnalysisResponse } from "@/lib/analysis/detailed-types";
import type { SolarReturnSnapshot } from "@/lib/astrology/solar-return";

export default function SolarReturnExplorer({
  analysis,
}: {
  analysis: DetailedAnalysisResponse;
}) {
  const initialYear = new Date().getFullYear();
  const [year, setYear] = useState(initialYear);
  const [snapshot, setSnapshot] = useState<SolarReturnSnapshot | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const localExactTime = useMemo(() => {
    if (!snapshot) return "";

    try {
      return new Intl.DateTimeFormat("ko-KR", {
        timeZone: analysis.engines.astrology.birthplace.timezone || "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date(snapshot.exactUtc));
    } catch {
      return snapshot.exactUtc;
    }
  }, [analysis.engines.astrology.birthplace.timezone, snapshot]);

  async function calculate(nextYear = year) {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/destiny/solar-return", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ analysis, year: nextYear }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Solar Return을 계산하지 못했어요.");
      }

      setYear(nextYear);
      setSnapshot(payload as SolarReturnSnapshot);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Solar Return을 계산하지 못했어요.",
      );
    }
  }

  return (
    <section className="solar-return-explorer">
      <div className="solar-return-head">
        <div>
          <small>SOLAR RETURN</small>
          <h3>태양이 태어난 자리로 돌아오는 순간</h3>
          <p>
            natal Sun의 황경과 같은 지점에 태양이 다시 도달하는 정확 시각을
            계산합니다.
          </p>
        </div>
        <div className="solar-return-year">
          <button
            type="button"
            disabled={status === "loading" || year <= 1900}
            onClick={() => void calculate(year - 1)}
            aria-label="이전 연도 Solar Return"
          >
            −
          </button>
          <strong>{year}</strong>
          <button
            type="button"
            disabled={status === "loading" || year >= 2100}
            onClick={() => void calculate(year + 1)}
            aria-label="다음 연도 Solar Return"
          >
            +
          </button>
        </div>
      </div>

      {!snapshot && (
        <button
          className="solar-return-open"
          type="button"
          disabled={status === "loading"}
          onClick={() => void calculate()}
        >
          {status === "loading" ? "태양 복귀 시각 계산 중..." : \`\${year} Solar Return 계산\`}
        </button>
      )}

      {snapshot && (
        <div className="solar-return-result">
          <div className="solar-return-exact">
            <div>
              <small>EXACT RETURN</small>
              <strong>{localExactTime}</strong>
              <span>{analysis.engines.astrology.birthplace.timezone}</span>
            </div>
            <div>
              <small>RESIDUAL ORB</small>
              <strong>{snapshot.residualOrb.toFixed(6)}°</strong>
              <span>
                {snapshot.precision === "exact-birth-time"
                  ? "출생시간 반영"
                  : "출생시간 미상 · 근사"}
              </span>
            </div>
          </div>

          <div className="solar-return-bodies">
            {snapshot.bodies.map((body) => (
              <span key={body.body}>
                <small>{body.body}</small>
                <strong>{body.sign.replace("자리", "")}</strong>
                <em>{body.longitude.toFixed(2)}°</em>
              </span>
            ))}
          </div>

          <p className="solar-return-note">{snapshot.note}</p>
        </div>
      )}

      {snapshot && (
        <div className="solar-return-actions">
          <button
            type="button"
            disabled={status === "loading" || year <= 1900}
            onClick={() => void calculate(year - 1)}
          >
            {year - 1}
          </button>
          <button
            type="button"
            disabled={status === "loading"}
            onClick={() => void calculate(initialYear)}
          >
            올해
          </button>
          <button
            type="button"
            disabled={status === "loading" || year >= 2100}
            onClick={() => void calculate(year + 1)}
          >
            {year + 1}
          </button>
        </div>
      )}

      {message && <p className="solar-return-error">{message}</p>}

      <p className="solar-return-disclaimer">
        Solar Return 당시 실제 체류 장소를 입력하지 않았기 때문에 ASC와
        Houses는 계산하지 않습니다. 특정 사건의 발생을 예측하는 기능이
        아닙니다.
      </p>
    </section>
  );
}
