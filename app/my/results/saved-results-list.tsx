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
};

export default function SavedResultsList({
  initialResults,
}: {
  initialResults: SavedResult[];
}) {
  const router = useRouter();
  const [results, setResults] = useState(initialResults);
  const [message, setMessage] = useState("");

  async function removeResult(id: string) {
    const response = await fetch(`/api/results/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("삭제하지 못했어요.");
      return;
    }

    setResults((current) => current.filter((item) => item.id !== id));
    setMessage("저장한 분석을 삭제했어요.");
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <section className="saved-results">
      <div className="saved-toolbar">
        <span>{results.length}개의 도감</span>
        <button type="button" onClick={signOut}>로그아웃</button>
      </div>

      {message && <p className="saved-message">{message}</p>}

      {results.length === 0 ? (
        <div className="saved-empty">
          <span>📖</span>
          <h2>아직 저장한 도감이 없어요.</h2>
          <p>Quick Reading 결과에서 ‘도감 저장하기’를 눌러 첫 기록을 남겨보세요.</p>
          <a href="/">분석하러 가기</a>
        </div>
      ) : (
        <div className="saved-grid">
          {results.map((item) => (
            <article className="saved-card" key={item.id}>
              <div className="saved-card-meta">
                <span>{item.birthDate}</span>
                <span>{item.narrativeSource === "gemini" ? "Gemini" : "Fallback"}</span>
              </div>
              <h2>{item.summary || "저장된 Prism 분석"}</h2>
              <small>{new Date(item.createdAt).toLocaleString("ko-KR")}</small>
              <div className="saved-card-actions">
                <a href={`/my/results/${item.id}`}>다시 보기</a>
                <button type="button" onClick={() => removeResult(item.id)}>삭제</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
