import { NextResponse } from "next/server";
import { getKstDate } from "@/lib/daily-fortune";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const fortuneDate = getKstDate();
  let { data, error } = await supabase
    .from("daily_fortunes")
    .select("fortune_date, fortune, updated_at")
    .eq("fortune_date", fortuneDate)
    .maybeSingle();

  if (error) {
    console.error("Failed to load daily fortune", error);
    return NextResponse.json(
      { error: "오늘의 운세를 불러오지 못했어요." },
      { status: 500 },
    );
  }

  if (!data) {
    const { data: generated, error: generationError } = await supabase.rpc(
      "generate_my_daily_fortune",
      { target_date: fortuneDate },
    );

    if (generationError) {
      console.error("Failed to generate daily fortune on demand", generationError);
      return NextResponse.json(
        { error: "오늘의 운세를 준비하지 못했어요." },
        { status: 500 },
      );
    }

    if (generated) {
      const refreshed = await supabase
        .from("daily_fortunes")
        .select("fortune_date, fortune, updated_at")
        .eq("fortune_date", fortuneDate)
        .maybeSingle();

      data = refreshed.data;
      error = refreshed.error;

      if (error) {
        console.error("Failed to reload generated daily fortune", error);
        return NextResponse.json(
          { error: "오늘의 운세를 불러오지 못했어요." },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json({
    fortuneDate,
    fortune: data?.fortune ?? null,
    updatedAt: data?.updated_at ?? null,
  });
}
