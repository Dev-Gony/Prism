import { NextResponse } from "next/server";
import { buildDestinyTimeline, buildDestinyTimelineByResolution, buildDestinyTimingAtDate } from "@/lib/analysis/destiny-timeline";
import { parseDateParts } from "@/lib/analysis/asof";
import type { DetailedAnalysisResponse } from "@/lib/analysis/detailed-types";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 256 * 1024;

function isDetailedAnalysis(value: unknown): value is DetailedAnalysisResponse {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<DetailedAnalysisResponse>;

  return Boolean(
    item.input?.date &&
      item.engines?.saju?.dayMaster?.character &&
      Array.isArray(item.engines?.saju?.pillars) &&
      Array.isArray(item.engines?.astrology?.bodies) &&
      item.engines?.numerology &&
      Array.isArray(item.cross),
  );
}

export async function POST(request: Request) {
  const raw = await request.text();

  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "타임라인 요청이 너무 커요." },
      { status: 413 },
    );
  }

  let body: {
    analysis?: unknown;
    yearsBefore?: unknown;
    yearsAfter?: unknown;
    targetDate?: unknown;
    resolution?: unknown;
    count?: unknown;
  };

  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  if (!isDetailedAnalysis(body.analysis)) {
    return NextResponse.json(
      { error: "Detailed 분석 결과가 필요해요." },
      { status: 400 },
    );
  }

  const yearsBefore =
    typeof body.yearsBefore === "number"
      ? Math.max(0, Math.min(3, Math.floor(body.yearsBefore)))
      : 1;
  const yearsAfter =
    typeof body.yearsAfter === "number"
      ? Math.max(1, Math.min(10, Math.floor(body.yearsAfter)))
      : 5;

  try {
    if (typeof body.targetDate === "string" && body.targetDate.trim()) {
      const targetDate = body.targetDate.trim();
      parseDateParts(targetDate);

      return NextResponse.json({
        targetDate,
        timing: buildDestinyTimingAtDate(body.analysis, targetDate),
      });
    }

    const resolution =
      body.resolution === "month" || body.resolution === "quarter"
        ? body.resolution
        : body.resolution === "year"
          ? "year"
          : null;

    if (resolution) {
      const count =
        typeof body.count === "number"
          ? Math.max(1, Math.min(24, Math.floor(body.count)))
          : resolution === "quarter"
            ? 8
            : resolution === "month"
              ? 12
              : yearsAfter;

      return NextResponse.json(
        buildDestinyTimelineByResolution(
          body.analysis,
          resolution,
          count,
        ),
      );
    }

    const timeline = buildDestinyTimeline(
      body.analysis,
      yearsBefore,
      yearsAfter,
    );

    return NextResponse.json(timeline);
  } catch (error) {
    console.error("Prism destiny timeline failed", error);

    return NextResponse.json(
      { error: "운명 타임라인을 계산하지 못했어요." },
      { status: 500 },
    );
  }
}
