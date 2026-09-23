export default function Home() {
  return (
    <main className="bootstrap-page">
      <section className="bootstrap-card" aria-labelledby="page-title">
        <p className="eyebrow">PRISM</p>
        <h1 id="page-title">여러 관점으로 나를 보다.</h1>
        <p className="description">
          프로젝트 초기 설정이 완료되었습니다. 다음 단계에서 확정된 Stitch
          디자인을 기준으로 실제 화면을 구현합니다.
        </p>
        <div className="status" role="status">
          Project bootstrap ready
        </div>
      </section>
    </main>
  );
}
