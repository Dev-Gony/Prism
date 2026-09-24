import { NextResponse } from "next/server";
import { calculateNameNumerology } from "@/lib/numerology/name";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: {
    name?: unknown;
    lifePath?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  if (typeof body.name !== "string") {
    return NextResponse.json(
      { error: "영문/로마자 이름을 입력해 주세요." },
      { status: 400 },
    );
  }

  const lifePath =
    typeof body.lifePath === "number" && Number.isFinite(body.lifePath)
      ? body.lifePath
      : 0;

  try {
    return NextResponse.json(calculateNameNumerology(body.name, lifePath));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "이름 수비학을 계산하지 못했어요.",
      },
      { status: 400 },
    );
  }
}
