"use client";

import { useRouter } from "next/navigation";

type UpgradeInput = {
  date: string;
  calendarType: "solar" | "lunar";
  isLeapMonth: boolean;
  birthplaceId: string;
};

export default function UpgradeDetailedLink({
  input,
}: {
  input: UpgradeInput;
}) {
  const router = useRouter();

  function upgrade() {
    window.sessionStorage.setItem(
      "prism.reanalysis-input.v1",
      JSON.stringify({
        createdAt: Date.now(),
        input: {
          analysisType: "detailed",
          date: input.date,
          calendarType: input.calendarType,
          isLeapMonth: input.isLeapMonth,
          timeKnown: true,
          time: "",
          birthplaceId: input.birthplaceId || "seoul",
        },
      }),
    );

    router.push("/?upgrade=detailed");
  }

  return (
    <button
      type="button"
      className="archive-upgrade-link"
      onClick={upgrade}
    >
      Detailed 입력으로 이동
    </button>
  );
}
