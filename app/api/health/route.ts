import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok:true,
    services:{
      gemini:{
        configured:Boolean(process.env.GEMINI_API_KEY),
        model:process.env.GEMINI_MODEL || "gemini-3.8-flash",
      },
      supabase:{
        configured:Boolean(
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        ),
      },
    },
  });
}
