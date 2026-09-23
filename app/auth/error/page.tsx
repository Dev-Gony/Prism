export default function AuthErrorPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ maxWidth: 480, textAlign: "center" }}>
        <p style={{ fontSize: 42, margin: 0 }}>🫧</p>
        <h1>Google 로그인을 완료하지 못했어요.</h1>
        <p>분석 결과는 브라우저에 잠시 남아 있어요. 홈으로 돌아가 다시 시도해 주세요.</p>
        <a href="/" style={{ display: "inline-block", marginTop: 16 }}>Prism으로 돌아가기</a>
      </section>
    </main>
  );
}
