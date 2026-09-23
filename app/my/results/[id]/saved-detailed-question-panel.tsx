"use client";

import { useEffect, useMemo, useState } from "react";
import type { DetailedAnalysisResponse } from "@/lib/analysis/detailed-types";

type SavedQuestionMessage = {
  question: string;
  answer: string;
  evidence: string[];
  generatedBy: "gemini" | "fallback";
  createdAt: number;
};

const SUGGESTIONS = [
  "내 성향을 더 쉽게 설명해줘",
  "일할 때 강점은 뭐야?",
  "관계에서는 어떤 특징이 보여?",
  "세 분석이 다르게 말하는 부분을 설명해줘",
];

export default function SavedDetailedQuestionPanel({
  reportId,
  analysis,
}: {
  reportId: string;
  analysis: DetailedAnalysisResponse;
}) {
  const storageKey = useMemo(
    () => `prism.saved-question-thread.v1.${reportId}`,
    [reportId],
  );
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<SavedQuestionMessage[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as SavedQuestionMessage[];
      if (!Array.isArray(parsed)) return;

      setMessages(
        parsed
          .filter(
            (item) =>
              item &&
              typeof item.question === "string" &&
              typeof item.answer === "string" &&
              Array.isArray(item.evidence),
          )
          .slice(-10),
      );
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  function persist(next: SavedQuestionMessage[]) {
    const trimmed = next.slice(-10);
    setMessages(trimmed);

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(trimmed));
    } catch {
      // The report still works even when browser storage is unavailable.
    }
  }

  async function ask(nextQuestion?: string) {
    const value = (nextQuestion ?? question).trim();
    if (!value || status === "loading") return;

    setStatus("loading");
    setMessage("");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: value,
          analysis,
        }),
        signal: controller.signal,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "답변을 만들지 못했어요.");
      }

      persist([
        ...messages,
        {
          question: value,
          answer: String(payload.answer ?? ""),
          evidence: Array.isArray(payload.evidence)
            ? payload.evidence.map(String)
            : [],
          generatedBy:
            payload.generatedBy === "gemini" ? "gemini" : "fallback",
          createdAt: Date.now(),
        },
      ]);
      setQuestion("");
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "답변이 오래 걸려 중단했어요. 저장된 리포트는 그대로예요."
          : error instanceof Error
            ? error.message
            : "답변을 만들지 못했어요.",
      );
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function clearThread() {
    if (!window.confirm("이 리포트의 질문 기록을 지울까요?")) return;

    window.localStorage.removeItem(storageKey);
    setMessages([]);
    setMessage("");
  }

  return (
    <section className="archive-section archive-question-section">
      <div className="archive-section-heading">
        <div>
          <small>ASK PRISM</small>
          <h2>저장한 리포트에서 이어서 물어보기</h2>
        </div>
        {messages.length > 0 && (
          <button
            className="archive-question-clear"
            type="button"
            onClick={clearThread}
          >
            질문 기록 지우기
          </button>
        )}
      </div>

      <div className="detailed-question-panel archive-question-panel">
        <div className="detailed-question-head">
          <div>
            <small>REPORT-SCOPED Q&A</small>
            <h3>이 저장 결과를 근거로만 답해요</h3>
          </div>
          <span>Detailed only</span>
        </div>

        <p className="detailed-question-intro">
          질문 기록은 이 브라우저에 최대 10개까지 남아 다음에 다시 열어도 이어집니다.
          계산값 자체는 다시 만들거나 바꾸지 않아요.
        </p>

        <div className="question-suggestions">
          {SUGGESTIONS.map((item) => (
            <button
              type="button"
              key={item}
              disabled={status === "loading"}
              onClick={() => void ask(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {messages.length > 0 && (
          <div className="question-thread">
            {messages.map((item, index) => (
              <article key={`${item.createdAt}-${index}`}>
                <div className="question-user">
                  <small>YOU</small>
                  <p>{item.question}</p>
                </div>

                <div className="question-answer">
                  <div>
                    <small>PRISM</small>
                    <span>
                      {item.generatedBy === "gemini" ? "Gemini" : "Fallback"}
                    </span>
                  </div>
                  <p>{item.answer}</p>
                  {item.evidence.length > 0 && (
                    <ul>
                      {item.evidence.map((evidence) => (
                        <li key={evidence}>{evidence}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="question-composer">
          <textarea
            maxLength={300}
            rows={3}
            value={question}
            placeholder="예: 이 결과에서 관계 방식과 일하는 방식이 어떻게 연결돼?"
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void ask();
              }
            }}
          />
          <div>
            <small>{question.length}/300 · Ctrl/⌘ + Enter</small>
            <button
              type="button"
              disabled={!question.trim() || status === "loading"}
              onClick={() => void ask()}
            >
              {status === "loading" ? "답변 정리 중..." : "질문하기"}
            </button>
          </div>
        </div>

        {message && <p className="question-error">{message}</p>}
      </div>
    </section>
  );
}
