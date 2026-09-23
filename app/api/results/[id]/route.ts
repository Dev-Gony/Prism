import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("analysis_results")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "저장한 결과를 불러오지 못했어요." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "결과를 찾을 수 없어요." }, { status: 404 });
  }

  return NextResponse.json({ result: data });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { error } = await supabase
    .from("analysis_results")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "저장한 결과를 삭제하지 못했어요." },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: true });
}
