import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: {
    sessionId?: unknown;
    helpful?: unknown;
    reason?: unknown;
    reportId?: unknown;
    analysisType?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  if (
    typeof body.sessionId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(body.sessionId) ||
    typeof body.helpful !== "boolean"
  ) {
    return NextResponse.json({ error: "피드백 형식이 올바르지 않아요." }, { status: 400 });
  }

  const reason =
    typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : null;
  const analysisType =
    body.analysisType === "quick" || body.analysisType === "detailed"
      ? body.analysisType
      : null;

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  const reportId =
    authData.user && typeof body.reportId === "string" ? body.reportId : null;

  const { error } = await supabase.from("product_feedback").insert({
    session_id: body.sessionId,
    user_id: authData.user?.id ?? null,
    report_id: reportId,
    analysis_type: analysisType,
    helpful: body.helpful,
    reason,
  });

  if (error) {
    console.error("Failed to save product feedback", error);
    return NextResponse.json({ error: "피드백을 저장하지 못했어요." }, { status: 500 });
  }

  await supabase.from("product_events").insert({
    event_name: "feedback_submitted",
    session_id: body.sessionId,
    user_id: authData.user?.id ?? null,
    analysis_type: analysisType,
    properties: {
      helpful: body.helpful,
      hasReason: Boolean(reason),
      reportId: reportId ?? undefined,
    },
    source: "web",
  });

  return NextResponse.json({ saved: true }, { status: 201 });
}
