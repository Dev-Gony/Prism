"use client";

import { useState } from "react";

type ShareCardProps = {
  birthDate: string;
  analysisType: "quick" | "detailed";
  summary: string;
  keywords: string[];
  sajuLabel: string;
  astrologyLabel: string;
  numerologyLabel: string;
  agreement: number;
};

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width <= maxWidth) {
      line = next;
      continue;
    }

    if (line) lines.push(line);
    line = word;
  }

  if (line) lines.push(line);
  return lines;
}

async function canvasToBlob(canvas: HTMLCanvasElement) {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("이미지 카드를 만들지 못했어요."));
    }, "image/png");
  });
}

export default function ShareReportCard({
  birthDate,
  analysisType,
  summary,
  keywords,
  sajuLabel,
  astrologyLabel,
  numerologyLabel,
  agreement,
}: ShareCardProps) {
  const [status, setStatus] = useState<
    "idle" | "creating" | "shared" | "saved" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function createCardBlob() {
    await document.fonts.ready;

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("이미지 카드를 만들지 못했어요.");

    ctx.fillStyle = "#fbf7f3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
    gradient.addColorStop(0, "rgba(183,93,68,0.14)");
    gradient.addColorStop(0.5, "rgba(117,107,156,0.08)");
    gradient.addColorStop(1, "rgba(91,132,114,0.12)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fffdfb";
    ctx.strokeStyle = "#eadfd8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(72, 70, 936, 1210, 34);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#9a4f39";
    ctx.font = '700 28px "Plus Jakarta Sans","Noto Sans KR",sans-serif';
    ctx.fillText("PRISM · 여러 관점으로 나를 보다", 124, 142);

    ctx.fillStyle = "#2f2926";
    ctx.font = '500 64px "Noto Serif KR","Apple SD Gothic Neo",serif';
    ctx.fillText(
      analysisType === "detailed" ? "Detailed Reading" : "Quick Reading",
      124,
      235,
    );

    ctx.fillStyle = "#81736d";
    ctx.font = '600 25px "Plus Jakarta Sans","Noto Sans KR",sans-serif';
    ctx.fillText(birthDate.replaceAll("-", "."), 124, 288);

    ctx.fillStyle = "#f3ebe6";
    ctx.beginPath();
    ctx.roundRect(124, 338, 832, 126, 24);
    ctx.fill();

    ctx.fillStyle = "#8e5d4c";
    ctx.font = '700 24px "Plus Jakarta Sans","Noto Sans KR",sans-serif';
    ctx.fillText("THREE-LENS AGREEMENT", 154, 382);

    ctx.fillStyle = "#2f2926";
    ctx.font = '500 46px "Noto Serif KR","Apple SD Gothic Neo",serif';
    ctx.fillText(`${agreement}%`, 154, 438);

    ctx.fillStyle = "#2f2926";
    ctx.font = '500 34px "Noto Serif KR","Apple SD Gothic Neo",serif';
    const summaryLines = wrapText(ctx, summary, 820).slice(0, 5);
    summaryLines.forEach((line, index) => {
      ctx.fillText(line, 124, 550 + index * 54);
    });

    const keywordY = 850;
    ctx.fillStyle = "#8c7f79";
    ctx.font = '700 21px "Plus Jakarta Sans","Noto Sans KR",sans-serif';
    ctx.fillText("CORE ESSENCE", 124, keywordY);

    let x = 124;
    const chipY = keywordY + 30;
    ctx.font = '700 24px "Plus Jakarta Sans","Noto Sans KR",sans-serif';

    keywords.slice(0, 3).forEach((keyword) => {
      const width = Math.min(280, ctx.measureText(keyword).width + 52);
      ctx.fillStyle = "#f4efec";
      ctx.beginPath();
      ctx.roundRect(x, chipY, width, 58, 29);
      ctx.fill();

      ctx.fillStyle = "#5f534f";
      ctx.fillText(keyword, x + 26, chipY + 38);
      x += width + 14;
    });

    const lensY = 1018;
    const lensWidth = 260;
    const lenses = [
      ["MODI · 사주", sajuLabel, "#b7654c"],
      ["STELLA · 점성", astrologyLabel, "#756b9c"],
      ["PICO · 수비", numerologyLabel, "#5b8472"],
    ] as const;

    lenses.forEach(([label, value, color], index) => {
      const left = 124 + index * (lensWidth + 14);
      ctx.fillStyle = "#faf7f5";
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(left, lensY, lensWidth, 142, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = '700 19px "Plus Jakarta Sans","Noto Sans KR",sans-serif';
      ctx.fillText(label, left + 20, lensY + 40);

      ctx.fillStyle = "#332d2a";
      ctx.font = '700 26px "Plus Jakarta Sans","Noto Sans KR",sans-serif';
      const valueLines = wrapText(ctx, value, lensWidth - 40).slice(0, 2);
      valueLines.forEach((line, lineIndex) => {
        ctx.fillText(line, left + 20, lensY + 84 + lineIndex * 30);
      });
    });

    ctx.fillStyle = "#9a8d88";
    ctx.font = '500 18px "Plus Jakarta Sans","Noto Sans KR",sans-serif';
    ctx.fillText(
      "전통적·문화적 해석 체계를 활용한 자기탐색용 참고 정보입니다.",
      124,
      1222,
    );

    return await canvasToBlob(canvas);
  }

  async function shareCard() {
    setStatus("creating");
    setMessage("");

    try {
      const blob = await createCardBlob();
      const file = new File([blob], "prism-report.png", { type: "image/png" });

      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: "Prism Report",
          text: "여러 관점으로 본 나의 Prism Report",
          files: [file],
        });
        setStatus("shared");
        setMessage("공유 카드를 열었어요.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "prism-report.png";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      setStatus("saved");
      setMessage("공유 이미지를 저장했어요.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("idle");
        return;
      }

      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "공유 카드를 만들지 못했어요.",
      );
    }
  }

  return (
    <section className="archive-share-card">
      <div>
        <small>SHARE CARD</small>
        <h2>결과 핵심만 이미지로 공유</h2>
        <p>
          생년월일, 합의도, 핵심 키워드와 세 관점 요약만 담아요. 이메일이나
          계정 정보는 포함하지 않습니다.
        </p>
      </div>

      <div className="archive-share-actions">
        <button
          type="button"
          disabled={status === "creating"}
          onClick={() => void shareCard()}
        >
          {status === "creating" ? "카드 만드는 중..." : "공유 카드 만들기"}
        </button>
        {message && <small className={status === "error" ? "error" : ""}>{message}</small>}
      </div>
    </section>
  );
}
