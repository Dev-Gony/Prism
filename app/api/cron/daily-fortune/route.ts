import { NextResponse } from "next/server";
import { hasValidCronAuthorization } from "@/lib/cron-auth";
import type { DailyFortunePayload } from "@/lib/daily-fortune";
import {
  getPushErrorStatus,
  isPushConfigured,
  sendDailyFortunePush,
} from "@/lib/push";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Cron server configuration is missing." },
      { status: 500 },
    );
  }

  if (!hasValidCronAuthorization(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.rpc(
      "generate_daily_fortunes",
    );

    if (error) throw error;

    const result = data as {
      fortuneDate: string;
      processedUsers: number;
    };

    if (!isPushConfigured()) {
      return NextResponse.json({
        ok: true,
        ...result,
        push: { status: "skipped", sent: 0, failed: 0, disabled: 0 },
      });
    }

    const [subscriptionResult, fortuneResult] = await Promise.all([
      admin
        .from("push_subscriptions")
        .select("id, user_id, endpoint, p256dh, auth")
        .eq("enabled", true),
      admin
        .from("daily_fortunes")
        .select("user_id, fortune")
        .eq("fortune_date", result.fortuneDate),
    ]);

    if (subscriptionResult.error) throw subscriptionResult.error;
    if (fortuneResult.error) throw fortuneResult.error;

    const subscriptions = (subscriptionResult.data ?? []) as Array<{
      id: string;
      user_id: string;
      endpoint: string;
      p256dh: string;
      auth: string;
    }>;
    const fortunes = (fortuneResult.data ?? []) as Array<{
      user_id: string;
      fortune: DailyFortunePayload;
    }>;
    const fortuneByUser = new Map(
      fortunes.map((item) => [item.user_id, item.fortune]),
    );
    let sent = 0;
    let failed = 0;
    const staleSubscriptionIds: string[] = [];

    await Promise.all(
      subscriptions.map(async (subscription) => {
        const fortune = fortuneByUser.get(subscription.user_id);
        if (!fortune) return;

        try {
          await sendDailyFortunePush(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            fortune,
          );
          sent += 1;
        } catch (pushError) {
          failed += 1;
          const status = getPushErrorStatus(pushError);
          if (status === 404 || status === 410) {
            staleSubscriptionIds.push(subscription.id);
          }
          console.error("Daily fortune push failed", { status });
        }
      }),
    );

    if (staleSubscriptionIds.length > 0) {
      const { error: disableError } = await admin
        .from("push_subscriptions")
        .update({ enabled: false, updated_at: new Date().toISOString() })
        .in("id", staleSubscriptionIds);

      if (disableError) {
        console.error("Failed to disable stale push subscriptions", disableError.code);
      }
    }

    return NextResponse.json({
      ok: true,
      ...result,
      push: {
        status: "sent",
        sent,
        failed,
        disabled: staleSubscriptionIds.length,
      },
    });
  } catch (error) {
    console.error("Daily fortune cron failed", error);
    return NextResponse.json(
      { error: "오늘의 운세 생성에 실패했어요." },
      { status: 500 },
    );
  }
}
