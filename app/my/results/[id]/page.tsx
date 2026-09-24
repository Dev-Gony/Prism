import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DetailedAnalysisResponse } from "@/lib/analysis/detailed-types";
import SavedDetailedQuestionPanel from "./saved-detailed-question-panel";
import UpgradeDetailedLink from "./upgrade-detailed-link";
import ShareReportCard from "./share-report-card";
import ResultFeedback from "@/app/result-feedback";
import DestinyTimelineExplorer from "@/app/destiny-timeline-explorer";
import SolarReturnExplorer from "@/app/solar-return-explorer";
import NameNumerologyExplorer from "@/app/name-numerology-explorer";

export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function arrayOfRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.map(record) : [];
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function formatDate(value: unknown) {
  return String(value ?? "").replaceAll("-", ".");
}

function formatAngle(value: JsonRecord) {
  const sign = text(value.sign, "-");
  const degree = number(value.degreeInSign, NaN);

  return Number.isFinite(degree) ? `${sign} ${degree.toFixed(1)}°` : sign;
}

export default async function SavedResultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect("/");
  }

  const { data, error } = await supabase
    .from("analysis_results")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const isDetailed = data.analysis_type === "detailed";

  const narrative = record(data.narrative);
  const keywords = arrayOfRecords(narrative.keywords);
  const observations = arrayOfRecords(narrative.observations);
  const crossHighlights = arrayOfRecords(narrative.crossHighlights);

  const saju = record(data.saju_result);
  const astrology = record(data.astrology_result);
  const numerology = record(data.numerology_result);
  const dayMaster = record(saju.dayMaster);

  const pillars = arrayOfRecords(saju.pillars);
  const bodies = arrayOfRecords(astrology.bodies);
  const transitSnapshot = record(astrology.transits);
  const transitBodies = arrayOfRecords(transitSnapshot.bodies);
  const transitAspects = arrayOfRecords(transitSnapshot.aspects);
  const houses = arrayOfRecords(astrology.houses);
  const ascendant = record(astrology.ascendant);
  const midheaven = record(astrology.midheaven);
  const descendant = record(astrology.descendant);
  const imumCoeli = record(astrology.imumCoeli);
  const birthplace = record(data.birth_place);
  const inputSnapshot = record(data.input_snapshot);
  const destinyTiming = record(data.destiny_timing);
  const destinySignals = arrayOfRecords(destinyTiming.signals);
  const destinyConvergences = arrayOfRecords(destinyTiming.convergences);
  const timeKnown =
    typeof inputSnapshot.timeKnown === "boolean"
      ? Boolean(inputSnapshot.timeKnown)
      : typeof data.birth_time === "string";

  const summary = text(narrative.summary, "요약이 없어요.");
  const keywordTitles = keywords
    .map((item) => text(item.title))
    .filter(Boolean)
    .slice(0, 3);
  const crossItems = Array.isArray(data.cross_analysis)
    ? data.cross_analysis
    : [];
  const averageAgreement =
    crossItems.length > 0
      ? Math.round(
          crossItems.reduce((sum, item) => {
            const value = record(item).agreement;
            return sum + (typeof value === "number" ? value : 0);
          }, 0) / crossItems.length,
        )
      : 0;
  const lifePath = number(numerology.lifePath, 0);
  const savedAt = new Date(String(data.created_at));

  const quickUpgradeInput = !isDetailed
    ? {
        date:
          typeof inputSnapshot.originalDate === "string"
            ? inputSnapshot.originalDate
            : String(data.birth_date),
        calendarType:
          inputSnapshot.calendarType === "lunar" ? "lunar" as const : "solar" as const,
        isLeapMonth: Boolean(inputSnapshot.isLeapMonth),
        birthplaceId:
          typeof inputSnapshot.birthplaceId === "string"
            ? inputSnapshot.birthplaceId
            : "seoul",
      }
    : null;

  const detailedAnalysisSnapshot = isDetailed
    ? ({
        input: data.input_snapshot,
        engines: {
          saju: data.saju_result,
          astrology: data.astrology_result,
          numerology: data.numerology_result,
        },
        normalized: data.normalized_traits,
        cross: data.cross_analysis,
        narrative: data.narrative,
        destinyTiming: data.destiny_timing ?? undefined,
        warnings: data.warnings,
      } as DetailedAnalysisResponse)
    : null;

  return (
    <main className="archive-report-page">
      <header className="archive-report-header">
        <a href="/my/results" className="archive-back-link">← 내 프리즘 도감</a>
        <div className="archive-report-badges">
          <span className={`analysis-type-badge ${isDetailed ? "detailed" : "quick"}`}>
            {isDetailed ? "Detailed Reading" : "Quick Reading"}
          </span>
          <span className={`source-badge ${data.narrative_source === "gemini" ? "gemini" : "fallback"}`}>
            {data.narrative_source === "gemini" ? "Gemini" : "Fallback"}
          </span>
        </div>
      </header>

      <section className="archive-cover">
        <div className="archive-cover-copy">
          <small>PRISM ARCHIVE · IMMUTABLE SNAPSHOT</small>
          <h1>{formatDate(data.birth_date)}의 Prism Report</h1>
          <p>{summary}</p>
        </div>

        <dl className="archive-meta-grid">
          <div>
            <dt>분석 유형</dt>
            <dd>{isDetailed ? "상세 분석" : "빠른 분석"}</dd>
          </div>
          <div>
            <dt>저장 시각</dt>
            <dd>{Number.isNaN(savedAt.getTime()) ? "-" : savedAt.toLocaleString("ko-KR")}</dd>
          </div>
          <div>
            <dt>해석 소스</dt>
            <dd>{data.narrative_source === "gemini" ? text(data.llm_model, "Gemini") : "규칙 기반"}</dd>
          </div>
          <div>
            <dt>스키마</dt>
            <dd>{text(data.schema_version, "v1")}</dd>
          </div>
        </dl>
      </section>

      {!isDetailed && (
        <section className="archive-upgrade-detailed">
          <div>
            <small>EXPAND THIS REPORT</small>
            <h2>이 Quick Reading을 Detailed로 확장</h2>
            <p>
              생년월일은 그대로 두고 출생시간과 지역을 추가해 시주, ASC, MC,
              Houses까지 확장할 수 있어요.
            </p>
          </div>
          {quickUpgradeInput && (
            <UpgradeDetailedLink input={quickUpgradeInput} />
          )}
        </section>
      )}

      {isDetailed && (
        <section className="archive-section archive-detailed-hero">
          <div className="archive-section-heading">
            <div>
              <small>DETAILED FRAME</small>
              <h2>{timeKnown ? "출생시간과 위치까지 반영한 상세 프리즘" : "출생시간 없이 가능한 정보만 확장한 프리즘"}</h2>
            </div>
            <span>{timeKnown ? "Whole Sign Houses" : "Time-independent mode"}</span>
          </div>

          <div className="archive-input-summary">
            <span>
              <small>출생시간</small>
              <strong>{timeKnown ? text(data.birth_time, "-") : "시간 미상"}</strong>
            </span>
            <span>
              <small>출생지역</small>
              <strong>{text(birthplace.label, text(birthplace.id, "-"))}</strong>
            </span>
            <span>
              <small>시간대</small>
              <strong>{text(birthplace.timezone, "Asia/Seoul")}</strong>
            </span>
          </div>

          {timeKnown ? (
            <div className="archive-angle-grid">
              <article>
                <small>ASC</small>
                <strong>{formatAngle(ascendant)}</strong>
                <p>겉으로 드러나는 접근 방식과 첫인상을 보는 기준점</p>
              </article>
              <article>
                <small>MC</small>
                <strong>{formatAngle(midheaven)}</strong>
                <p>사회적 방향성과 바깥에서 드러나는 지향점을 보는 기준점</p>
              </article>
              <article>
                <small>DSC</small>
                <strong>{formatAngle(descendant)}</strong>
                <p>타인과 관계를 맺는 축의 반대편 지점</p>
              </article>
              <article>
                <small>IC</small>
                <strong>{formatAngle(imumCoeli)}</strong>
                <p>내면의 기반과 사적인 뿌리를 보는 축</p>
              </article>
            </div>
          ) : (
            <div className="archive-time-unknown">
              출생시간이 없어 시주, Moon, ASC, MC, 12 Houses는 저장된 상세 리포트에서도 제외했어요.
            </div>
          )}

          {timeKnown && (
            <div className="archive-house-section">
              <div className="archive-subheading">
                <h3>12 Houses</h3>
                <span>ASC 기준 Whole Sign</span>
              </div>
              <div className="archive-house-grid">
                {houses.map((house) => (
                  <span key={String(house.house)}>
                    <small>{number(house.house)}H</small>
                    <b>{text(house.sign, "-").replace("자리", "")}</b>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="archive-planet-table">
            <div className="archive-subheading">
              <h3>행성 배치</h3>
              <span>실제 출생시각 기준</span>
            </div>
            <div className="archive-table">
              <div className="archive-table-head">
                <span>행성</span>
                <span>별자리</span>
                <span>황경</span>
                <span>상태</span>
              </div>
              {bodies.map((body) => (
                <div className="archive-table-row" key={text(body.body)}>
                  <strong>{text(body.body, "-")}</strong>
                  <span>{text(body.sign, "-")}</span>
                  <span>{number(body.longitude).toFixed(1)}°</span>
                  <span>
                    {typeof body.house === "number" ? `${body.house}H` : "시간 필요"}
                    {text(body.motion) ? ` · ${text(body.motion)}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {Array.isArray(astrology.aspects) && astrology.aspects.length > 0 && (
            <div className="archive-astrology-patterns">
              <div className="archive-subheading">
                <h3>Aspect & Motion</h3>
                <span>저장 당시 natal snapshot</span>
              </div>
              <div className="archive-pattern-list">
                {arrayOfRecords(astrology.aspects).slice(0, 8).map((aspect, index) => (
                  <span key={text(aspect.bodyA) + text(aspect.bodyB) + index}>
                    <b>{text(aspect.bodyA)} × {text(aspect.bodyB)}</b>
                    <small>
                      {text(aspect.type)}
                      {text(aspect.phase) ? ` · ${text(aspect.phase)}` : ""}
                      {typeof aspect.orb === "number" ? ` · orb ${number(aspect.orb).toFixed(1)}°` : ""}
                    </small>
                  </span>
                ))}
              </div>
            </div>
          )}

          {transitAspects.length > 0 && (
            <div className="archive-astrology-patterns">
              <div className="archive-subheading">
                <h3>Transit Motion & Phase</h3>
                <span>{text(transitSnapshot.asOfDate, "저장 당시 기준일")}</span>
              </div>
              <div className="archive-pattern-list">
                {transitAspects.slice(0, 6).map((aspect, index) => {
                  const transitBody = transitBodies.find(
                    (body) => text(body.body) === text(aspect.transitBody),
                  );

                  return (
                    <span key={text(aspect.transitBody) + text(aspect.natalPoint) + index}>
                      <b>{text(aspect.transitBody)} → {text(aspect.natalPoint)}</b>
                      <small>
                        {text(aspect.type)}
                        {text(aspect.phase) ? ` · ${text(aspect.phase)}` : ""}
                        {typeof aspect.orb === "number"
                          ? ` · orb ${number(aspect.orb).toFixed(1)}°`
                          : ""}
                        {transitBody && text(transitBody.motion)
                          ? ` · ${text(transitBody.motion)}`
                          : ""}
                      </small>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="archive-section">
        <div className="archive-section-heading">
          <div>
            <small>THREE LENSES</small>
            <h2>세 관점의 계산 근거</h2>
          </div>
        </div>

        <div className="archive-lens-grid">
          <article className="archive-lens-card saju">
            <span className="archive-lens-code">M</span>
            <div>
              <small>사주 · Modi</small>
              <h3>일간 {text(dayMaster.korean, "사주")}{text(dayMaster.element)}</h3>
              <p>{pillars.map((pillar) => text(pillar.text)).filter(Boolean).join(" · ") || "-"}</p>
              {isDetailed && pillars[3] && (
                <strong>시주 {text(pillars[3].text)} · {text(pillars[3].korean)}</strong>
              )}
            </div>
          </article>

          <article className="archive-lens-card astro">
            <span className="archive-lens-code">S</span>
            <div>
              <small>점성학 · Stella</small>
              <h3>
                {isDetailed && timeKnown
                  ? `ASC ${text(ascendant.sign, "-")}`
                  : `태양 ${text(astrology.sunSign, "-")}`}
              </h3>
              <p>
                {isDetailed && timeKnown
                  ? `태양 ${text(astrology.sunSign, "-")} · 달 ${text(astrology.moonSign, "-")} · MC ${text(midheaven.sign, "-")}`
                  : bodies.map((body) => `${text(body.body)} ${text(body.sign)}`).join(" · ")}
              </p>
            </div>
          </article>

          <article className="archive-lens-card numero">
            <span className="archive-lens-code">P</span>
            <div>
              <small>수비학 · Pico</small>
              <h3>Life Path {lifePath || "-"}</h3>
              <p>{text(numerology.meaningKey, "생년월일 숫자 패턴")}</p>
            </div>
          </article>
        </div>
      </section>

      {isDetailed && destinySignals.length > 0 && (
        <section className="archive-section archive-destiny-now">
          <div className="archive-section-heading">
            <div>
              <small>DESTINY NOW</small>
              <h2>현재 시점의 세 체계 흐름</h2>
            </div>
            <span>{text(destinyTiming.asOfDate, "-")}</span>
          </div>

          <div className="archive-destiny-grid">
            {destinySignals.map((signal, index) => (
              <article key={text(signal.source) + index}>
                <small>{text(signal.source, "signal").toUpperCase()}</small>
                <strong>{text(signal.title, "현재 흐름")}</strong>
                <p>
                  {(Array.isArray(signal.evidence) ? signal.evidence : [])
                    .map(String)
                    .slice(0, 3)
                    .join(" · ")}
                </p>
              </article>
            ))}
          </div>

          {destinyConvergences.length > 0 && (
            <div className="archive-destiny-convergence">
              {destinyConvergences.map((item, index) => (
                <span key={text(item.theme) + index}>
                  <b>{text(item.label, text(item.theme))}</b>
                  <em>{number(item.strength)}%</em>
                </span>
              ))}
            </div>
          )}

          <p className="archive-destiny-note">
            현재 시점의 전통적·문화적 해석 신호를 겹쳐 본 참고 정보이며,
            특정 사건의 발생을 예측하거나 보장하지 않습니다.
          </p>
        </section>
      )}

      <section className="archive-section">
        <div className="archive-section-heading">
          <div>
            <small>CORE ESSENCE</small>
            <h2>핵심 성향</h2>
          </div>
        </div>

        <div className="archive-keyword-list">
          {keywords.map((item, index) => (
            <article key={`${text(item.title)}-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{text(item.title, "키워드")}</h3>
                <p>{text(item.description)}</p>
                <div className="archive-tag-row">
                  {(Array.isArray(item.tags) ? item.tags : []).map((tag) => (
                    <b key={String(tag)}>{String(tag)}</b>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="archive-section">
        <div className="archive-section-heading">
          <div>
            <small>CROSS ANALYSIS</small>
            <h2>교차 분석 메모</h2>
          </div>
        </div>

        <div className="archive-cross-list">
          {crossHighlights.map((item, index) => (
            <article key={`${text(item.trait)}-${index}`}>
              <div>
                <span>교차 영역 {String(index + 1).padStart(2, "0")}</span>
                <b>{text(item.label, "교차 분석")}</b>
              </div>
              <h3>{text(item.title)}</h3>
              <p>{text(item.explanation)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="archive-section">
        <div className="archive-section-heading">
          <div>
            <small>OBSERVATION LOG</small>
            <h2>관찰 노트</h2>
          </div>
        </div>

        <ol className="archive-observation-list">
          {observations.map((item, index) => (
            <li key={`${text(item.title)}-${index}`}>
              <span>{index + 1}</span>
              <div>
                <small>{text(item.label, `${index + 1}. 관찰`)}</small>
                <strong>{text(item.title)}</strong>
                <p>{text(item.description)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {detailedAnalysisSnapshot && (
        <DestinyTimelineExplorer analysis={detailedAnalysisSnapshot} />
      )}

      {detailedAnalysisSnapshot && (
        <SolarReturnExplorer analysis={detailedAnalysisSnapshot} />
      )}

      {detailedAnalysisSnapshot && (
        <NameNumerologyExplorer analysis={detailedAnalysisSnapshot} />
      )}

      {detailedAnalysisSnapshot && (
        <SavedDetailedQuestionPanel
          reportId={String(data.id)}
          analysis={detailedAnalysisSnapshot}
        />
      )}

      <ResultFeedback
        analysisType={isDetailed ? "detailed" : "quick"}
        reportId={String(data.id)}
      />

      <ShareReportCard
        birthDate={String(data.birth_date)}
        analysisType={isDetailed ? "detailed" : "quick"}
        summary={summary}
        keywords={keywordTitles}
        sajuLabel={
          text(dayMaster.korean, "사주") + text(dayMaster.element)
        }
        astrologyLabel={
          isDetailed && timeKnown
            ? `ASC ${text(ascendant.sign, "-")}`
            : text(astrology.sunSign, "점성")
        }
        numerologyLabel={lifePath ? `Life Path ${lifePath}` : "수비"}
        agreement={averageAgreement}
      />

      <details className="archive-evidence">
        <summary>계산 근거 원본 JSON 보기</summary>
        <pre>{JSON.stringify({
          input: data.input_snapshot,
          engineVersions: data.engine_versions,
          saju: data.saju_result,
          astrology: data.astrology_result,
          numerology: data.numerology_result,
          cross: data.cross_analysis,
          warnings: data.warnings,
        }, null, 2)}</pre>
      </details>

      <p className="archive-disclaimer">
        저장된 결과는 당시 엔진과 해석 모델의 스냅샷이며 자동으로 다시 계산되지 않습니다.
      </p>
    </main>
  );
}
