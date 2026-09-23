import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, model, error: "GEMINI_API_KEY is missing" },
      { status: 503 },
    );
  }

  const startedAt = Date.now();

  try {
    const ai = new GoogleGenAI({ apiKey });
    const interaction = await ai.interactions.create({
      model,
      input: 'Return JSON with exactly one property named "ok" whose value is true.',
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
          },
          required: ["ok"],
        },
      },
    });

    const raw = interaction.output_text?.trim() ?? "";
    const parsed = JSON.parse(raw) as { ok?: boolean };

    return NextResponse.json({
      ok: parsed.ok === true,
      model,
      latencyMs: Date.now() - startedAt,
      response: parsed,
    });
  } catch (error) {
    const safeError =
      error instanceof Error
        ? { name: error.name, message: error.message }
        : { message: String(error) };

    console.error("[Prism][Gemini Probe]", safeError);

    return NextResponse.json(
      {
        ok: false,
        model,
        latencyMs: Date.now() - startedAt,
        error: safeError,
      },
      { status: 502 },
    );
  }
}
