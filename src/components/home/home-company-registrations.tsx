"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { isDefaultCompany, type CompanyInfo } from "@/lib/company";
import { isAdminAccess } from "@/lib/permissions";
import { useEffect, useMemo, useState } from "react";

const REG_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const DISMISS_PREFIX = "custom-furniture-dispatch-company-reg-dismissed:";

function loadDismissed(username: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${DISMISS_PREFIX}${username}`);
    const parsed = JSON.parse(raw ?? "[]") as unknown;
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((x): x is string => typeof x === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

function saveDismissed(username: string, ids: Set<string>): void {
  try {
    localStorage.setItem(`${DISMISS_PREFIX}${username}`, JSON.stringify([...ids]));
  } catch {
    /* 存储不可用时忽略，仅本次会话内标记 */
  }
}

function formatTimeAgo(iso: string): string {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return "";
  const minutes = Math.floor((Date.now() - time) / 60_000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

/** admin 专属：近 7 天新注册公司提醒（公司名 / 注册账号 / 手机号 / 时间，可逐条标记已读） */
export function HomeCompanyRegistrations() {
  const { user, companies } = useAuth();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    setDismissed(loadDismissed(user.username));
  }, [user]);

  const recent = useMemo(() => {
    if (!isAdminAccess(user)) return [];
    const now = Date.now();
    return companies
      .filter((c) => !isDefaultCompany(c.id))
      .filter((c) => {
        const t = new Date(c.createdAt).getTime();
        return Number.isFinite(t) && now - t <= REG_WINDOW_MS;
      })
      .filter((c) => !dismissed.has(c.id))
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [user, companies, dismissed]);

  if (!isAdminAccess(user) || recent.length === 0) return null;

  function dismiss(company: CompanyInfo) {
    if (!user) return;
    const next = new Set(dismissed);
    next.add(company.id);
    setDismissed(next);
    saveDismissed(user.username, next);
  }

  return (
    <section
      className="vi-surface overflow-hidden"
      aria-labelledby="home-company-reg-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--separator)] px-4 py-3">
        <div className="min-w-0">
          <h2
            id="home-company-reg-title"
            className="text-[17px] font-semibold"
            style={{ color: "var(--label-primary)" }}
          >
            新公司注册提醒
          </h2>
          <p
            className="mt-0.5 text-[13px]"
            style={{ color: "var(--label-secondary)" }}
          >
            有 {recent.length} 家公司在近 7 天注册，请及时联系确认
          </p>
        </div>
      </div>
      <ul className="divide-y divide-[var(--separator)]">
        {recent.map((company) => (
          <li
            key={company.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p
                className="truncate text-sm font-semibold"
                style={{ color: "var(--label-primary)" }}
              >
                {company.name}
              </p>
              <p
                className="mt-0.5 truncate text-[13px]"
                style={{ color: "var(--label-secondary)" }}
              >
                账号：{company.registrantName ?? "—"} · 手机号：
                {company.phone ?? "—"} · {formatTimeAgo(company.createdAt)}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 shrink-0 px-3 text-xs"
              onClick={() => dismiss(company)}
            >
              标记已读
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
