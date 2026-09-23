"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SavedResult = {
  id: string;
  analysisType: string;
  birthDate: string;
  summary: string;
  narrativeSource: string;
  createdAt: string;
  sajuLabel: string;
  astrologyLabel: string;
  numerologyLabel: string;
  agreement: number;
};

export default function SavedResultsList({
  initialResults,
}: {
  initialResults: SavedResult[];
}) {
  const router = useRouter();
  const [results, setResults] = useState(initialResults);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function removeResult(id: string) {
    if (!window.confirm("이 프리즘 도감을 삭제할까요?")) return;

    setDeletingId(id);
    setMessage("");

    try {
      const response = await fetch(`/api/results/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setMessage("삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }

      setResults((current) => current.filter((item) => item.id !== id));
      setMessage("도감 한 권을 정리했어요.");
    } finally {
      setDeletingId(null);
    }
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <section className="library-results">
      <div className="library-toolbar">
        <div>
          <span className="library-count">{results.length}</span>
          <strong>개의 프리즘 도감</strong>
        </div>
        <button type="button" onClick={signOut}>로그아웃</button>
      </div>

      {message && <p className="library-message">{message}</p>}

      {results.length === 0 ? (
        <div className="library-empty">
          <div className="empty-shelf">
            <span>🔥</span><span>✨</span><span>🌱</span>
          </div>
          <h2>아직 도감 선반이 비어 있어요.</h2>
          <p>Quick Reading을 마치고 ‘내 도감에 저장’을 눌러 첫 번째 나를 보관해 보세요.</p>
          <a href="/">첫 도감 만들러 가기</a>
        </div>
      ) : (
        <div className="library-grid">
          {results.map((item, index) => (
            <article className="library-card" key={item.id}>
              <div className="library-card-top">
                <span className="volume-number">VOL. {String(index + 1).padStart(2, "0")}</span>
                <span className={`source-badge ${item.narrativeSource === "gemini" ? "gemini" : "fallback"}`}>
                  {item.narrativeSource === "gemini" ? "✨ Gemini" : "🫧 Fallback"}
                </span>
              </div>

              <div className="library-date-row">
                <div>
                  <small>생년월일</small>
                  <strong>{item.birthDate.replaceAll("-", ".")}</strong>
                </div>
                <span className="agreement-orb">{item.agreement}%</span>
              </div>

              <div className="library-fairy-strip">
                <span className="fairy-chip modi"><i>🔥</i><b>모디</b><small>{item.sajuLabel}</small></span>
                <span className="fairy-chip stella"><i>✨</i><b>스텔라</b><small>{item.astrologyLabel}</small></span>
                <span className="fairy-chip pico"><i>🌱</i><b>피코</b><small>{item.numerologyLabel}</small></span>
              </div>

              <p className="library-summary">{item.summary || "저장된 Prism 분석"}</p>

              <div className="library-card-footer">
                <small>{new Date(item.createdAt).toLocaleString("ko-KR")}</small>
                <div>
                  <a href={`/my/results/${item.id}`}>도감 열기</a>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => removeResult(item.id)}
                  >
                    {deletingId === item.id ? "정리 중" : "삭제"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
