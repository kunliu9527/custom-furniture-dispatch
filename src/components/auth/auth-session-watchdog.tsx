"use client";

import { useAuth } from "@/context/auth-context";
import { AUTH_CHECK_INTERVAL_MS } from "@/lib/auth-session";
import { useEffect } from "react";

const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

const TOUCH_THROTTLE_MS = 30_000;

/** 监听用户活动与定时校验，触发登录过期 */
export function AuthSessionWatchdog() {
  const { user, isHydrated, touchAuthSession, checkAuthSessionExpiry } =
    useAuth();

  useEffect(() => {
    if (!isHydrated || !user) return;

    let lastTouch = 0;

    function onActivity() {
      const now = Date.now();
      if (now - lastTouch < TOUCH_THROTTLE_MS) return;
      lastTouch = now;
      touchAuthSession();
    }

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, onActivity, { passive: true });
    }

    const interval = window.setInterval(() => {
      checkAuthSessionExpiry();
    }, AUTH_CHECK_INTERVAL_MS);

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, onActivity);
      }
      window.clearInterval(interval);
    };
  }, [isHydrated, user, touchAuthSession, checkAuthSessionExpiry]);

  return null;
}
