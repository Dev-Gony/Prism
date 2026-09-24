"use client";

import { useState } from "react";
import { submitFeedback } from "@/lib/analytics/client";

export default function ResultFeedback({
  analysisType,
  reportId,
}: {
  analysisType: "quick" | "detailed";
  reportId?: string;
}) {
  const [choice, setChoice] = useState<"helpful" | "not-helpful" | null>(null);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function send(helpful: boolean) {
    setChoice(helpful ? "helpful" : "not-helpful");

    if (helpful) {
      try {
        setStatus("saving");
        await submitFeedback({
          helpful: true,
          reportId,
          analysisType,
        });
        setStatus("saved");
        setMessage("도움됐다는 피드백을 기록했어요.");
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "피드백을 저장하지 못했어요.");
      }
    }
  }

  async function sendReason() {
    try {
      setStatus("saving");
      await submitFeedback({
        helpful: false,
        reason,
        reportId,
        analysisType,
      });
      setStatus("saved");
      setMessage("아쉬웠던 점을 기록했어요.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "피드백을 저장하지 못했어요.");
    }
  }

  return (
    <section className="result-feedback">
      <div>
        <small>FEEDBACK</small>
        <h3>이 해석이 도움이 됐나요?</h3>
        <p>답변은 익명 사용 시 계정 정보 없이 제품 개선 데이터로만 기록해요.</p>
      </div>

      <div className="result-feedback-actions">
        <button
          type="button"
          className={choice === "helpful" ? "selected" : ""}
          disabled={status === "saving" || status === "saved"}
          onClick={() => void send(true)}
        >
          도움됐어요
        </button>
        <button
          type="button"
          className={choice === "not-helpful" ? "selected" : ""}
          disabled={status === "saving" || status === "saved"}
          onClick={() => {
            setChoice("not-helpful");
            setStatus("idle");
            setMessage("");
          }}
        >
          아쉬워요
        </button>
      </div>

      {choice === "not-helpful" && status !== "saved" && (
        <div className="result-feedback-reason">
          <textarea
            maxLength={500}
            rows={3}
            value={reason}
            placeholder="어떤 부분이 애매했는지 짧게 적어주세요. 예: 너무 일반적이었어요."
            onChange={(event) => setReason(event.target.value)}
          />
          <div>
            <small>{reason.length}/500</small>
            <button
              type="button"
              disabled={status === "saving" || !reason.trim()}
              onClick={() => void sendReason()}
            >
              {status === "saving" ? "저장 중..." : "피드백 보내기"}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className={status === "error" ? "feedback-message error" : "feedback-message"}>
          {message}
        </p>
      )}
    </section>
  );
}
