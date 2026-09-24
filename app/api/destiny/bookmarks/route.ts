import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function validDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const birthDate = searchParams.get("birthDate");

  if (!birthDate || !validDate(birthDate)) {
    return NextResponse.json(
      { error: "생년월일이 필요해요." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("destiny_bookmarks")
    .select("id,birth_date,as_of_date,label,timing,source,created_at")
    .eq("user_id", authData.user.id)
    .eq("birth_date", birthDate)
    .order("as_of_date", { ascending: true });

  if (error) {
    console.error("Failed to read destiny bookmarks", error);
    return NextResponse.json(
      { error: "저장한 시점을 불러오지 못했어요." },
      { status: 500 },
    );
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  let body: {
    birthDate?: unknown;
    asOfDate?: unknown;
    label?: unknown;
    timing?: unknown;
    source?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  if (!validDate(body.birthDate) || !validDate(body.asOfDate)) {
    return NextResponse.json(
      { error: "날짜 형식이 올바르지 않아요." },
      { status: 400 },
    );
  }

  if (
    !body.timing ||
    typeof body.timing !== "object" ||
    Array.isArray(body.timing)
  ) {
    return NextResponse.json(
      { error: "저장할 운명 시점 데이터가 필요해요." },
      { status: 400 },
    );
  }

  const label =
    typeof body.label === "string" && body.label.trim()
      ? body.label.trim().slice(0, 80)
      : body.asOfDate;

  const source =
    body.source === "solar-return" ? "solar-return" : "timeline";

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("destiny_bookmarks")
    .insert({
      user_id: authData.user.id,
      birth_date: body.birthDate,
      as_of_date: body.asOfDate,
      label,
      timing: body.timing,
      source,
    })
    .select("id,birth_date,as_of_date,label,timing,source,created_at")
    .single();

  if (error) {
    console.error("Failed to save destiny bookmark", error);
    return NextResponse.json(
      { error: "운명 시점을 저장하지 못했어요." },
      { status: 500 },
    );
  }

  return NextResponse.json({ saved: true, item: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "삭제할 항목이 필요해요." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { error } = await supabase
    .from("destiny_bookmarks")
    .delete()
    .eq("id", id)
    .eq("user_id", authData.user.id);

  if (error) {
    console.error("Failed to delete destiny bookmark", error);
    return NextResponse.json(
      { error: "저장한 시점을 삭제하지 못했어요." },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: true });
}
