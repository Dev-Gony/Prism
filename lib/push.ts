import "server-only";

import webpush, { type PushSubscription } from "web-push";
import {
  PRODUCTION_SITE_URL,
  type DailyFortunePayload,
} from "@/lib/daily-fortune";

let configured = false;

export function isPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim() &&
      process.env.VAPID_SUBJECT?.trim(),
  );
}

function configureWebPush() {
  if (configured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();

  if (!publicKey || !privateKey || !subject) {
    throw new Error("Web push configuration is missing.");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export function getDailyFortuneUrl() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL)
    .trim()
    .replace(/\/$/, "");
  return `${siteUrl}/?source=push#daily-fortune`;
}

export async function sendDailyFortunePush(
  subscription: PushSubscription,
  fortune: DailyFortunePayload,
) {
  configureWebPush();

  return webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: "오늘의 운세가 도착했어요",
      body: fortune.headline,
      date: fortune.date,
      url: getDailyFortuneUrl(),
    }),
    { TTL: 12 * 60 * 60, urgency: "normal" },
  );
}

export function getPushErrorStatus(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }

  return null;
}
