"use client";

import { useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics/client";
import type {
  DestinyTimingSummary,
  DetailedAnalysisResponse,
} from "@/lib/analysis/detailed-types";

type TimelinePoint = {
  asOfDate: string;
  year: number;
  month: number;
  label: string;
  timing: DestinyTimingSummary;
  dominantTheme: string | null;
  convergenceStrength: number;
};

type TimelineResolution = "year" | "quarter" | "month";

type TimelinePayload = {
  anchorDate: string;
  resolution: TimelineResolution;
  points: TimelinePoint[];
};

const THEME_LABELS: Record<string, string> = {
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

export default function DestinyTimelineExplorer({
  analysis,
}: {
  analysis: DetailedAnalysisResponse;
}) {
  const [timeline, setTimeline] = useState<TimelinePayload | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTiming, setSelectedTiming] =
    useState<DestinyTimingSummary | null>(analysis.destinyTiming ?? null);
  const [selectedLabel, setSelectedLabel] = useState(
    analysis.destinyTiming?.asOfDate ?? "현재",
  );
  const [yearsAfter, setYearsAfter] = useState(5);
  const [resolution, setResolution] =
    useState<TimelineResolution>("year");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const maxDate = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear() + 20}-12-31`;
  }, []);

  const timelineHighlights = useMemo(() => {
    if (!timeline) return [];

    return [...timeline.points]
      .filter((point) => point.convergenceStrength > 0)
      .sort(
        (a, b) =>
          b.convergenceStrength - a.convergenceStrength ||
          a.asOfDate.localeCompare(b.asOfDate),
      )
      .slice(0, 3);
  }, [timeline]);

  async function request(body: Record<string, unknown>) {
    const response = await fetch("/api/destiny/timeline", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        analysis,
        ...body,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "운명 지도를 계산하지 못했어요.");
    }

    return payload;
  }

  async function loadTimeline(
    nextYearsAfter = yearsAfter,
    nextResolution = resolution,
  ) {
    setStatus("loading");
    setMessage("");

    try {
      const payload = (await request(
        nextResolution === "year"
          ? {
              resolution: "year",
              count: nextYearsAfter,
            }
          : {
              resolution: nextResolution,
              count: nextResolution === "quarter" ? 8 : 12,
            },
      )) as TimelinePayload;

      void trackEvent(
        "destiny_timeline_opened",
        {
          yearsAfter: nextYearsAfter,
          resolution: nextResolution,
        },
        "detailed",
      );

      setTimeline(payload);
      setYearsAfter(nextYearsAfter);
      setResolution(nextResolution);

      const current =
        payload.points.find((point) => point.asOfDate === payload.anchorDate) ??
        payload.points.find(
          (point) => point.year === Number(payload.anchorDate.slice(0, 4)),
        ) ??
        payload.points[0];

      if (current) {
        setSelectedTiming(current.timing);
        setSelectedLabel(current.asOfDate);
      }

      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "운명 지도를 계산하지 못했어요.",
      );
    }
  }

  async function inspectDate() {
    if (!selectedDate) return;

    setStatus("loading");
    setMessage("");

    try {
      const payload = (await request({
        targetDate: selectedDate,
      })) as {
        targetDate: string;
        timing: DestinyTimingSummary;
      };

      void trackEvent(
        "destiny_date_inspected",
        { targetDate: selectedDate },
        "detailed",
      );
      setSelectedTiming(payload.timing);
      setSelectedLabel(payload.targetDate);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "선택한 날짜를 계산하지 못했어요.",
      );
    }
  }

  return (
    <section className="destiny-timeline-explorer">
      <div className="destiny-timeline-heading">
        <div>
          <small>DESTINY TIMELINE</small>
          <h3>시간을 움직여 보는 운명 지도</h3>
          <p>
            같은 출생 데이터를 두고 세운, 주요 Transit, Personal Cycle을
            같은 날짜에 맞춰 겹쳐봅니다.
          </p>
        </div>

        <div className="destiny-range-stack">
          <div className="destiny-resolution-actions">
            {([
              ["year", "연"],
              ["quarter", "분기"],
              ["month", "월"],
            ] as const).map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={resolution === value ? "active" : ""}
                disabled={status === "loading"}
                onClick={() => void loadTimeline(yearsAfter, value)}
              >
                {label}
              </button>
            ))}
          </div>

          {resolution === "year" && (
            <div className="destiny-range-actions">
              {[3, 5, 10].map((years) => (
            <button
              type="button"
              key={years}
              className={yearsAfter === years ? "active" : ""}
              disabled={status === "loading"}
              onClick={() => void loadTimeline(years)}
            >
              +{years}년
            </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!timeline && (
        <button
          className="destiny-map-open"
          type="button"
          disabled={status === "loading"}
          onClick={() => void loadTimeline()}
        >
          {status === "loading"
            ? "운명 지도 계산 중..."
            : resolution === "year"
              ? "운명 지도 펼치기"
              : resolution === "quarter"
                ? "분기 흐름 펼치기"
                : "월 흐름 펼치기"}
        </button>
      )}

      {timeline && (
        <>
          <div className="destiny-year-strip">
            {timeline.points.map((point) => (
              <button
                type="button"
                key={point.asOfDate}
                className={selectedLabel === point.asOfDate ? "selected" : ""}
                onClick={() => {
                  setSelectedTiming(point.timing);
                  setSelectedLabel(point.asOfDate);
                }}
              >
                <small>{point.label}</small>
                <strong>{point.dominantTheme ?? "독립 신호"}</strong>
                <span>
                  {point.convergenceStrength > 0
                    ? `${point.convergenceStrength}% 겹침`
                    : "겹침 없음"}
                </span>
              </button>
            ))}
          </div>

          {timelineHighlights.length > 0 && (
            <div className="destiny-highlight-strip">
              <small>STRONGEST CONVERGENCE</small>
              <div>
                {timelineHighlights.map((point) => (
                  <button
                    type="button"
                    key={"highlight-" + point.asOfDate}
                    onClick={() => {
                      setSelectedTiming(point.timing);
                      setSelectedLabel(point.asOfDate);
                    }}
                  >
                    <span>{point.label}</span>
                    <strong>{point.dominantTheme}</strong>
                    <em>{point.convergenceStrength}%</em>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="destiny-resolution-note">
            {timeline.resolution === "year"
              ? "연간 보기는 같은 월·일을 기준으로 비교합니다."
              : timeline.resolution === "quarter"
                ? "분기 보기는 3개월 간격의 동일 기준일 스냅샷입니다."
                : "월간 보기는 매달 같은 일자의 세 체계 신호를 비교합니다."}
          </div>

          <div className="destiny-date-probe">
            <label>
              <span>특정 날짜 보기</span>
              <input
                type="date"
                value={selectedDate}
                min="1990-01-01"
                max={maxDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={!selectedDate || status === "loading"}
              onClick={() => void inspectDate()}
            >
              이 날짜 분석
            </button>
          </div>
        </>
      )}

      {selectedTiming && (
        <div className="destiny-timeline-detail">
          <div className="destiny-timeline-detail-head">
            <div>
              <small>{selectedLabel}</small>
              <strong>세 체계의 동시 시점 분석</strong>
            </div>
            <span>
              {selectedTiming.convergences.length > 0
                ? `${selectedTiming.convergences.length}개 교차 테마`
                : "각 체계가 다른 영역을 강조"}
            </span>
          </div>

          <div className="destiny-timeline-signal-list">
            {selectedTiming.signals.map((signal) => (
              <article key={signal.source + signal.title}>
                <div>
                  <small>{signal.source.toUpperCase()}</small>
                  <span>{THEME_LABELS[signal.theme] ?? signal.theme}</span>
                </div>
                <strong>{signal.title}</strong>
                <p>{signal.evidence.slice(0, 3).join(" · ")}</p>
              </article>
            ))}
          </div>

          <div className="destiny-timeline-convergence">
            {selectedTiming.convergences.length > 0 ? (
              selectedTiming.convergences.map((item) => (
                <div key={item.theme}>
                  <span>{item.label}</span>
                  <strong>{item.sources.join(" + ")}</strong>
                  <em>{item.strength}%</em>
                </div>
              ))
            ) : (
              <p>
                이 시점에는 세 체계가 같은 테마로 수렴하지 않아요. 서로 다른
                신호를 억지로 하나의 결론으로 만들지 않고 그대로 보여줍니다.
              </p>
            )}
          </div>
        </div>
      )}

      {message && <p className="destiny-timeline-error">{message}</p>}

      <p className="destiny-timeline-disclaimer">
        전통적·문화적 해석 체계의 시간 흐름을 비교하는 참고 정보입니다.
        구체적인 사건 발생이나 결과를 예측하지 않습니다.
      </p>
    </section>
  );
}
