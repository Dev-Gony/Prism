import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prism · 오늘의 운세",
    short_name: "Prism",
    description: "사주, 점성술, 수비학을 함께 보는 오늘의 프리즘",
    start_url: "/?source=pwa",
    display: "standalone",
    background_color: "#fbf7f2",
    theme_color: "#92462c",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
