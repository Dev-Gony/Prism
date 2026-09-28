import { NextResponse } from "next/server";
import { hasValidCronAuthorization } from "@/lib/cron-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Cron server configuration is missing." },
      { status: 500 },
    );
  }

  if (!hasValidCronAuthorization(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await createSupabaseAdminClient().rpc(
      "generate_daily_fortunes",
    );

    if (error) throw error;

    const result = data as {
      fortuneDate: string;
      processedUsers: number;
    };
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Daily fortune cron failed", error);
    return NextResponse.json(
      { error: "오늘의 운세 생성에 실패했어요." },
      { status: 500 },
    );
  }
}
