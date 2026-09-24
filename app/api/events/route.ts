import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_EVENTS = new Set([
  "landing_view",
  "quick_started",
  "quick_completed",
  "detailed_opened",
  "detailed_completed",
  "save_clicked",
  "result_saved",
  "ask_prism_used",
  "share_card_created",
  "upgrade_detailed",
  "feedback_submitted",
  "destiny_timeline_opened",
  "destiny_date_inspected",
  "solar_return_calculated",
  "name_numerology_calculated",
]);

export async function POST(request: Request) {
  let body: {
    eventName?: unknown;
    sessionId?: unknown;
    analysisType?: unknown;
    properties?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  if (
    typeof body.eventName !== "string" ||
    !ALLOWED_EVENTS.has(body.eventName) ||
    typeof body.sessionId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(body.sessionId)
  ) {
    return NextResponse.json({ error: "이벤트 형식이 올바르지 않아요." }, { status: 400 });
  }

  const analysisType =
    body.analysisType === "quick" || body.analysisType === "detailed"
      ? body.analysisType
      : null;

  const properties =
    body.properties && typeof body.properties === "object" && !Array.isArray(body.properties)
      ? body.properties
      : {};

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  const { error } = await supabase.from("product_events").insert({
    event_name: body.eventName,
    session_id: body.sessionId,
    user_id: authData.user?.id ?? null,
    analysis_type: analysisType,
    properties,
    source: "web",
  });

  if (error) {
    console.error("Failed to record product event", error);
    return NextResponse.json({ error: "이벤트를 기록하지 못했어요." }, { status: 500 });
  }

  return NextResponse.json({ recorded: true }, { status: 201 });
}
