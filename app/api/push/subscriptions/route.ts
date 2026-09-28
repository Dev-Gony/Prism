import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SubscriptionBody = {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

function parseSubscription(body: SubscriptionBody) {
  if (
    typeof body.endpoint !== "string" ||
    body.endpoint.length > 2048 ||
    typeof body.keys?.p256dh !== "string" ||
    body.keys.p256dh.length > 512 ||
    typeof body.keys?.auth !== "string" ||
    body.keys.auth.length > 256
  ) {
    return null;
  }

  try {
    const endpoint = new URL(body.endpoint);
    if (endpoint.protocol !== "https:") return null;
  } catch {
    return null;
  }

  return {
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
  };
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let body: SubscriptionBody;
  try {
    body = (await request.json()) as SubscriptionBody;
  } catch {
    return NextResponse.json({ error: "알림 정보 형식이 올바르지 않아요." }, { status: 400 });
  }

  const subscription = parseSubscription(body);
  if (!subscription) {
    return NextResponse.json({ error: "알림 정보 형식이 올바르지 않아요." }, { status: 400 });
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: authData.user.id,
      ...subscription,
      enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) {
    console.error("Failed to save push subscription", error.code);
    return NextResponse.json({ error: "알림 신청을 저장하지 못했어요." }, { status: 500 });
  }

  return NextResponse.json({ subscribed: true });
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let endpoint: unknown;
  try {
    const body = (await request.json()) as { endpoint?: unknown };
    endpoint = body.endpoint;
  } catch {
    endpoint = null;
  }

  if (typeof endpoint !== "string" || endpoint.length > 2048) {
    return NextResponse.json({ error: "알림 정보 형식이 올바르지 않아요." }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", authData.user.id)
    .eq("endpoint", endpoint);

  if (error) {
    console.error("Failed to delete push subscription", error.code);
    return NextResponse.json({ error: "알림 해제를 저장하지 못했어요." }, { status: 500 });
  }

  return NextResponse.json({ subscribed: false });
}
