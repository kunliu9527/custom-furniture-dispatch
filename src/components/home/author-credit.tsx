"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const AUTHOR_EMAIL_TEXT = "作者邮箱：470220161@qq.com";
const STORAGE_KEY = "author-credit-clicks";
const MAX_CLICKS_PER_HOUR = 2;
const HOUR_MS = 60 * 60 * 1000;
const DISPLAY_MS = 3000;

function getRecentClickTimestamps(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter(
      (t): t is number => typeof t === "number" && now - t < HOUR_MS,
    );
  } catch {
    return [];
  }
}

function persistClickTimestamps(timestamps: number[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(timestamps));
}

function canRevealEmail(): boolean {
  return getRecentClickTimestamps().length < MAX_CLICKS_PER_HOUR;
}

export function AuthorCredit() {
  const [showEmail, setShowEmail] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearHideTimer, [clearHideTimer]);

  function handleClick() {
    if (!canRevealEmail()) return;

    const recent = getRecentClickTimestamps();
    persistClickTimestamps([...recent, Date.now()]);

    clearHideTimer();
    setShowEmail(true);
    hideTimerRef.current = setTimeout(() => {
      setShowEmail(false);
      hideTimerRef.current = null;
    }, DISPLAY_MS);
  }

  if (showEmail) {
    return (
      <p className="absolute bottom-2 right-3 text-[10px] text-slate-400">
        {AUTHOR_EMAIL_TEXT}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute bottom-2 right-3 text-[10px] text-slate-300/80 transition hover:text-slate-500 hover:underline"
    >
      作者：何处不青山
    </button>
  );
}
