"use client";

import { useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics/client";
import type {
  DestinyTimingSummary,
  DetailedAnalysisResponse,
} from "@/lib/analysis/detailed-types";
import { BIRTHPLACES } from "@/lib/analysis/birthplaces";
import type { SolarReturnSnapshot } from "@/lib/astrology/solar-return";

function dateInTimezone(iso: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));

  const value = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${value.year}-${value.month}-${value.day}`;
}

export default function SolarReturnExplorer({
  analysis,
}: {
  analysis: DetailedAnalysisResponse;
}) {
  const initialYear = new Date().getFullYear();
  const [year, setYear] = useState(initialYear);
  const [returnPlaceId, setReturnPlaceId] = useState(
    analysis.engines.astrology.birthplace.id || "seoul",
  );
  const [snapshot, setSnapshot] = useState<SolarReturnSnapshot | null>(null);
  const [yearTiming, setYearTiming] =
    useState<DestinyTimingSummary | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const localExactTime = useMemo(() => {
    if (!snapshot) return "";

    try {
      return new Intl.DateTimeFormat("ko-KR", {
        timeZone:
          snapshot.location?.timezone ||
          analysis.engines.astrology.birthplace.timezone ||
          "Asia/Seoul",
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
        body: JSON.stringify({
          analysis,
          year: nextYear,
          returnPlaceId,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Solar Return을 계산하지 못했어요.");
      }

      const solarSnapshot = payload as SolarReturnSnapshot;
      const timeZone =
        solarSnapshot.location?.timezone ||
        analysis.engines.astrology.birthplace.timezone ||
        "Asia/Seoul";
      const returnDate = dateInTimezone(solarSnapshot.exactUtc, timeZone);

      try {
        const timingResponse = await fetch("/api/destiny/timeline", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            analysis,
            targetDate: returnDate,
          }),
        });
        const timingPayload = await timingResponse.json();

        if (timingResponse.ok && timingPayload?.timing) {
          setYearTiming(timingPayload.timing as DestinyTimingSummary);
        } else {
          setYearTiming(null);
        }
      } catch {
        setYearTiming(null);
      }

      void trackEvent(
        "solar_return_calculated",
        {
          year: nextYear,
          returnPlaceId,
          hasLocation: Boolean(returnPlaceId),
        },
        "detailed",
      );
      setYear(nextYear);
      setSnapshot(solarSnapshot);
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

      <label className="solar-return-place">
        <span>Solar Return 당시 체류 장소</span>
        <select
          value={returnPlaceId}
          disabled={status === "loading"}
          onChange={(event) => {
            setReturnPlaceId(event.target.value);
            setSnapshot(null);
            setYearTiming(null);
            setMessage("");
          }}
        >
          {BIRTHPLACES.map((place) => (
            <option key={place.id} value={place.id}>
              {place.label} · {place.region}
            </option>
          ))}
        </select>
        <small>
          실제 생일 무렵 머물렀거나 머물 예정인 장소를 선택하세요.
        </small>
      </label>

      {!snapshot && (
        <button
          className="solar-return-open"
          type="button"
          disabled={status === "loading"}
          onClick={() => void calculate()}
        >
          {status === "loading" ? "태양 복귀 시각 계산 중..." : `${year} Solar Return 계산`}
        </button>
      )}

      {snapshot && (
        <div className="solar-return-result">
          <div className="solar-return-exact">
            <div>
              <small>EXACT RETURN</small>
              <strong>{localExactTime}</strong>
              <span>
                {snapshot.location
                  ? `${snapshot.location.label} · ${snapshot.location.timezone}`
                  : analysis.engines.astrology.birthplace.timezone}
              </span>
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

          {snapshot.angles?.ascendant && snapshot.angles?.midheaven && (
            <div className="solar-return-angles">
              <span>
                <small>ASC</small>
                <strong>{snapshot.angles?.ascendant.sign.replace("자리", "")}</strong>
                <em>{snapshot.angles?.ascendant.degreeInSign.toFixed(2)}°</em>
              </span>
              <span>
                <small>MC</small>
                <strong>{snapshot.angles?.midheaven.sign.replace("자리", "")}</strong>
                <em>{snapshot.angles?.midheaven.degreeInSign.toFixed(2)}°</em>
              </span>
              <span>
                <small>HOUSE SYSTEM</small>
                <strong>Whole Sign</strong>
                <em>{snapshot.location?.label ?? "-"}</em>
              </span>
            </div>
          )}

          <div className="solar-return-bodies">
            {snapshot.bodies.map((body) => (
              <span key={body.body}>
                <small>{body.body}</small>
                <strong>{body.sign.replace("자리", "")}</strong>
                <em>
                  {body.longitude.toFixed(2)}°
                  {body.house ? ` · ${body.house}H` : ""}
                </em>
              </span>
            ))}
          </div>

          {snapshot.houses.length > 0 && (
            <div className="solar-return-houses">
              {snapshot.houses.map((house) => (
                <span key={house.house}>
                  <small>{house.house}H</small>
                  <strong>{house.sign.replace("자리", "")}</strong>
                </span>
              ))}
            </div>
          )}

          {snapshot.aspects.length > 0 && (
            <div className="solar-return-aspects">
              <div>
                <small>RETURN ASPECTS</small>
                <strong>Solar Return 내부 주요 각</strong>
              </div>
              <div className="solar-return-aspect-list">
                {snapshot.aspects.slice(0, 8).map((aspect) => (
                  <span key={aspect.bodyA + aspect.bodyB + aspect.type}>
                    <b>{aspect.bodyA} × {aspect.bodyB}</b>
                    <em>{aspect.type} · orb {aspect.orb.toFixed(2)}°</em>
                  </span>
                ))}
              </div>
            </div>
          )}

          {snapshot.natalAspects.length > 0 && (
            <div className="solar-return-aspects natal-overlay">
              <div>
                <small>RETURN ↔ NATAL</small>
                <strong>올해 차트가 natal chart와 만나는 지점</strong>
              </div>
              <div className="solar-return-aspect-list">
                {snapshot.natalAspects.slice(0, 10).map((aspect) => (
                  <span key={aspect.returnBody + aspect.natalPoint + aspect.type}>
                    <b>{aspect.returnBody} → natal {aspect.natalPoint}</b>
                    <em>{aspect.type} · orb {aspect.orb.toFixed(2)}°</em>
                  </span>
                ))}
              </div>
            </div>
          )}

          {yearTiming && (
            <div className="solar-return-year-matrix">
              <div>
                <small>PRISM YEAR MATRIX</small>
                <strong>{year}년의 세 체계 동시 신호</strong>
              </div>

              <div className="solar-return-year-matrix-grid">
                <span>
                  <small>Solar Return</small>
                  <b>
                    {snapshot.natalAspects[0]
                      ? `${snapshot.natalAspects[0].returnBody} ${snapshot.natalAspects[0].type} natal ${snapshot.natalAspects[0].natalPoint}`
                      : "강한 natal overlay 없음"}
                  </b>
                </span>
                <span>
                  <small>Saju / Numerology / Transit</small>
                  <b>
                    {yearTiming.convergences[0]
                      ? `${yearTiming.convergences[0].label} · ${yearTiming.convergences[0].strength}%`
                      : "세 체계가 서로 다른 영역을 강조"}
                  </b>
                </span>
              </div>

              {yearTiming.convergences.length > 0 && (
                <div className="solar-return-year-tags">
                  {yearTiming.convergences.slice(0, 3).map((item) => (
                    <span key={item.theme}>
                      {item.label}
                      <b>{item.strength}%</b>
                    </span>
                  ))}
                </div>
              )}

              <p>
                Solar Return 차트와 같은 날짜의 세운·월운·Transit·Personal
                Cycle을 함께 본 연간 스냅샷이에요. 한 체계의 결과만으로
                결론을 만들지 않습니다.
              </p>
            </div>
          )}

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
        선택한 장소 기준으로 Whole Sign ASC와 Houses를 계산합니다. 실제
        Solar Return 당시 체류 장소가 달라지면 각도와 Houses도 달라집니다.
        특정 사건의 발생을 예측하는 기능이 아닙니다.
      </p>
    </section>
  );
}
