export type ProductEventName =
  | "landing_view"
  | "quick_started"
  | "quick_completed"
  | "detailed_opened"
  | "detailed_completed"
  | "save_clicked"
  | "result_saved"
  | "ask_prism_used"
  | "share_card_created"
  | "upgrade_detailed"
  | "feedback_submitted"
  | "destiny_timeline_opened"
  | "destiny_date_inspected"
  | "solar_return_calculated"
  | "name_numerology_calculated";

const SESSION_KEY = "prism.analytics-session.v1";

function getSessionId() {
  if (typeof window === "undefined") return null;

  const current = window.localStorage.getItem(SESSION_KEY);
  if (current) return current;

  const next = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, next);
  return next;
}

export async function trackEvent(
  eventName: ProductEventName,
  properties: Record<string, unknown> = {},
  analysisType?: "quick" | "detailed",
) {
  const sessionId = getSessionId();
  if (!sessionId) return;

  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventName,
        sessionId,
        analysisType,
        properties,
      }),
    });
  } catch {
    // Analytics should never block the product.
  }
}

export async function submitFeedback(input: {
  helpful: boolean;
  reason?: string;
  reportId?: string;
  analysisType?: "quick" | "detailed";
}) {
  const sessionId = getSessionId();
  if (!sessionId) throw new Error("세션을 만들지 못했어요.");

  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...input,
      sessionId,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "피드백을 저장하지 못했어요.");
  }

  return payload;
}
