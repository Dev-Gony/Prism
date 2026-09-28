self.addEventListener("push", (event) => {
  const fallback = {
    title: "오늘의 운세가 도착했어요",
    body: "오늘의 프리즘을 확인해 보세요.",
    url: "https://prism-nine-livid.vercel.app/?source=push#daily-fortune",
  };
  let payload = fallback;

  try {
    payload = { ...fallback, ...event.data.json() };
  } catch {
    // Keep the safe fallback when a provider sends an empty or malformed body.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon.svg",
      tag: `daily-fortune-${payload.date || "today"}`,
      data: { url: payload.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    event.notification.data?.url ||
    "https://prism-nine-livid.vercel.app/?source=push#daily-fortune";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => client.url === targetUrl);
      return matchingClient ? matchingClient.focus() : self.clients.openWindow(targetUrl);
    }),
  );
});
