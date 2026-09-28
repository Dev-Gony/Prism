"use client";

import { useEffect, useRef, useState } from "react";

type DailyFortuneOptInProps = {
  open: boolean;
  isAuthenticated: boolean;
  onClose: () => void;
  onRequireLogin: () => void;
  onPrepareSubscription: () => Promise<boolean>;
  onSubscribed: () => void;
};

type OptInStatus =
  | "idle"
  | "subscribing"
  | "ios-home-screen"
  | "unsupported"
  | "denied"
  | "error";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

function isIosBrowser() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandaloneWebApp() {
  const standaloneNavigator = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    standaloneNavigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export default function DailyFortuneOptIn({
  open,
  isAuthenticated,
  onClose,
  onRequireLogin,
  onPrepareSubscription,
  onSubscribed,
}: DailyFortuneOptInProps) {
  const [status, setStatus] = useState<OptInStatus>("idle");
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    setStatus("idle");
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  if (!open) return null;

  async function subscribe() {
    if (!isAuthenticated) {
      window.sessionStorage.setItem("prism.push-opt-in.pending.v1", "1");
      onRequireLogin();
      return;
    }

    if (isIosBrowser() && !isStandaloneWebApp()) {
      setStatus("ios-home-screen");
      return;
    }

    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setStatus("unsupported");
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
    if (!publicKey) {
      setStatus("error");
      return;
    }

    if (!(await onPrepareSubscription())) {
      setStatus("error");
      return;
    }

    setStatus("subscribing");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.register("/push-sw.js");
      await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));
      const serialized = subscription.toJSON();
      const response = await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: serialized.keys,
        }),
      });

      if (!response.ok) throw new Error("subscription save failed");

      window.localStorage.setItem("prism.push-subscribed.v1", "1");
      window.sessionStorage.removeItem("prism.push-opt-in.pending.v1");
      onSubscribed();
    } catch {
      setStatus("error");
    }
  }

  const message =
    status === "ios-home-screen"
      ? "iPhone·iPad에서는 Safari 공유 메뉴의 ‘홈 화면에 추가’로 Prism을 설치한 뒤, 홈 화면에서 다시 열어 주세요."
      : status === "unsupported"
        ? "이 브라우저는 웹 푸시를 지원하지 않아요. Chrome, Edge 또는 홈 화면에 설치한 Safari에서 다시 시도해 주세요."
        : status === "denied"
          ? "알림 권한이 꺼져 있어요. 브라우저의 사이트 설정에서 Prism 알림을 허용한 뒤 다시 눌러 주세요."
          : status === "error"
            ? "알림 신청을 마치지 못했어요. 잠시 뒤 다시 시도해 주세요."
            : "";

  return (
    <div className="editorial-modal-backdrop" onClick={onClose}>
      <section
        className="editorial-modal daily-opt-in-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-opt-in-title"
        onClick={(event) => event.stopPropagation()}
      >
        <small>DAILY PRISM · 09:00 KST</small>
        <h2 id="daily-opt-in-title">매일매일 오늘의 운세를 받아보시겠어요?</h2>
        <p>
          매일 아침 운세를 준비해 두고, “오늘의 운세가 도착했어요” 알림을 보내드려요.
          원하지 않으면 언제든 브라우저에서 끌 수 있어요.
        </p>
        {!isAuthenticated && (
          <p className="daily-opt-in-login-note">
            알림을 받을 분석을 저장하기 위해 Google 로그인을 한 번 진행합니다.
          </p>
        )}
        {message && (
          <p className="daily-opt-in-message" role="status" aria-live="polite">
            {message}
          </p>
        )}
        <button
          className="report-primary-btn"
          type="button"
          autoFocus
          disabled={status === "subscribing"}
          onClick={() => void subscribe()}
        >
          {status === "subscribing"
            ? "알림 연결 중..."
            : isAuthenticated
              ? "휴대폰 알림 켜기"
              : "로그인하고 매일 받아보기"}
          <span>→</span>
        </button>
        <button className="modal-ghost-btn" type="button" onClick={onClose}>
          나중에 할게요
        </button>
      </section>
    </div>
  );
}
