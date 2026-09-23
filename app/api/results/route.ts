import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { QuickAnalysisResponse } from "@/lib/analysis/types";
import type { DetailedAnalysisResponse } from "@/lib/analysis/detailed-types";

const MAX_BODY_BYTES = 256 * 1024;

type PersistableAnalysis = QuickAnalysisResponse | DetailedAnalysisResponse;

function hasSharedAnalysisShape(
  analysis: Partial<PersistableAnalysis>,
) {
  return Boolean(
    analysis.input &&
      typeof analysis.input.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(analysis.input.date) &&
      analysis.engines?.saju &&
      analysis.engines?.astrology &&
      analysis.engines?.numerology &&
      Array.isArray(analysis.normalized) &&
      Array.isArray(analysis.cross) &&
      analysis.narrative &&
      (analysis.narrative.generatedBy === "gemini" ||
        analysis.narrative.generatedBy === "fallback"),
  );
}

function isQuickAnalysis(value: unknown): value is QuickAnalysisResponse {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Partial<QuickAnalysisResponse>;

  return hasSharedAnalysisShape(analysis) &&
    analysis.input !== undefined &&
    !("time" in analysis.input);
}

function isDetailedAnalysis(value: unknown): value is DetailedAnalysisResponse {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Partial<DetailedAnalysisResponse>;

  return Boolean(
    hasSharedAnalysisShape(analysis) &&
      analysis.input &&
      typeof analysis.input.time === "string" &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(analysis.input.time) &&
      typeof analysis.input.birthplaceId === "string" &&
      analysis.engines?.saju &&
      Array.isArray(analysis.engines.saju.pillars) &&
      analysis.engines.saju.pillars.length === 4 &&
      analysis.engines?.astrology &&
      Array.isArray(analysis.engines.astrology.houses) &&
      analysis.engines.astrology.houses.length === 12,
  );
}

export async function POST(request: Request) {
  const raw = await request.text();

  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "저장할 분석 결과가 너무 커요." },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const analysis = (body as { analysis?: unknown })?.analysis;
  const isDetailed = isDetailedAnalysis(analysis);

  if (!isDetailed && !isQuickAnalysis(analysis)) {
    return NextResponse.json(
      { error: "저장할 분석 결과 형식이 올바르지 않아요." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("analysis_results")
    .insert({
      user_id: authData.user.id,
      analysis_type: isDetailed ? "detailed" : "quick",
      birth_date: analysis.input.date,
      birth_time: isDetailed ? analysis.input.time : null,
      birth_place: isDetailed
        ? analysis.engines.astrology.birthplace
        : null,
      input_snapshot: analysis.input,
      engine_versions: {
        saju: "lunar-javascript@1.7.7",
        astrology: "astronomy-engine@2.1.19",
        houses: isDetailed ? "prism-whole-sign-v1" : null,
        numerology: "prism-numerology-v1",
        cross: "prism-cross-v1",
      },
      saju_result: analysis.engines.saju,
      astrology_result: analysis.engines.astrology,
      numerology_result: analysis.engines.numerology,
      normalized_traits: analysis.normalized,
      cross_analysis: analysis.cross,
      narrative: analysis.narrative,
      narrative_source: analysis.narrative.generatedBy,
      llm_model: analysis.narrative.model ?? null,
      warnings: analysis.warnings,
      schema_version: "v1",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to save analysis", error);
    return NextResponse.json(
      { error: "분석 결과를 저장하지 못했어요." },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: data.id, saved: true }, { status: 201 });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("analysis_results")
    .select("id, analysis_type, birth_date, narrative, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json(
      { error: "저장한 결과를 불러오지 못했어요." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    results: (data ?? []).map((row) => ({
      id: row.id,
      analysisType: row.analysis_type,
      birthDate: row.birth_date,
      summary:
        row.narrative && typeof row.narrative === "object" && "summary" in row.narrative
          ? String(row.narrative.summary)
          : "",
      createdAt: row.created_at,
    })),
  });
}
