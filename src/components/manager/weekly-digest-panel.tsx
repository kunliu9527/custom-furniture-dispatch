"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/client-api";
import { copyTextToClipboard } from "@/lib/secure-clipboard";
import { formatDispatchMoney } from "@/lib/dispatch-totals";
import {
  buildWeeklyDigest,
  formatWeeklyDigestText,
  type WeeklyDigest,
} from "@/lib/weekly-report";
import { markDigestRead } from "@/lib/weekly-digest-persistence";
import type { Order, SupplementOrder } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState } from "react";

interface WeeklyDigestPanelProps {
  orders: Order[];
  supplements: SupplementOrder[];
}

export function WeeklyDigestPanel({
  orders,
  supplements,
}: WeeklyDigestPanelProps) {
  const { user, staffRecords } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [pushState, setPushState] = useState<
    "idle" | "loading" | "ok" | "unconfigured" | "error"
  >("idle");
  const [wecomAvailable, setWecomAvailable] = useState(false);
  const [copyOk, setCopyOk] = useState(false);

  const digest = useMemo(
    () => buildWeeklyDigest(orders, supplements, staffRecords),
    [orders, supplements, staffRecords],
  );

  const text = useMemo(() => formatWeeklyDigestText(digest), [digest]);

  useEffect(() => {
    void apiFetch("/api/weekly-digest/push")
      .then((r) => r.json())
      .then((d: { wecomConfigured?: boolean }) =>
        setWecomAvailable(Boolean(d.wecomConfigured)),
      )
      .catch(() => setWecomAvailable(false));
  }, []);

  const markRead = useCallback(() => {
    if (user?.username) {
      markDigestRead(user.username, digest.weekId);
    }
  }, [user?.username, digest.weekId]);

  useEffect(() => {
    markRead();
  }, [markRead]);

  async function handleCopy() {
    try {
      const ok = await copyTextToClipboard(text);
      setCopyOk(ok);
      window.setTimeout(() => setCopyOk(false), 2000);
    } catch {
      setCopyOk(false);
    }
  }

  async function handleWecomPush() {
    setPushState("loading");
    try {
      const res = await apiFetch("/api/weekly-digest/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.status === 503) {
        setPushState("unconfigured");
        return;
      }
      if (!res.ok) {
        setPushState("error");
        return;
      }
      setPushState("ok");
    } catch {
      setPushState("error");
    }
  }

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-violet-900">
            本周管理简报
          </h2>
          <p className="mt-0.5 text-xs text-violet-700/90">{digest.weekLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="text-xs text-violet-600 hover:underline"
        >
          {collapsed ? "展开" : "收起"}
        </button>
      </div>

      {!collapsed ? (
        <>
          <DigestStats digest={digest} />
          {digest.actionLines.length > 0 ? (
            <ul className="mt-3 list-inside list-disc text-xs text-violet-900/90">
              {digest.actionLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={handleCopy}>
              {copyOk ? "已复制" : "复制周报文本"}
            </Button>
            {wecomAvailable ? (
              <Button
                type="button"
                variant="outline"
                disabled={pushState === "loading"}
                onClick={handleWecomPush}
              >
                {pushState === "loading"
                  ? "推送中…"
                  : pushState === "ok"
                    ? "已推送到企微"
                    : "推送到企微群"}
              </Button>
            ) : (
              <span className="self-center text-[11px] text-violet-600/80">
                企微未配置 · 可用复制后粘贴到群
              </span>
            )}
          </div>
          {pushState === "unconfigured" ? (
            <p className="mt-2 text-xs text-amber-700">
              服务器未配置 WECOM_WEBHOOK_URL，请使用「复制周报」或系统内查看。
            </p>
          ) : null}
          {pushState === "error" ? (
            <p className="mt-2 text-xs text-rose-600">推送失败，请稍后重试或复制文本。</p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function DigestStats({ digest }: { digest: WeeklyDigest }) {
  const items = [
    { label: "新派单", value: String(digest.newDispatchCount) },
    { label: "下单", value: `${digest.orderedCount} / ${formatDispatchMoney(digest.orderedAmount)}` },
    { label: "超时", value: String(digest.activeTimeoutCount) },
    { label: "待接单", value: String(digest.pendingAcceptCount) },
  ];
  return (
    <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg bg-white/70 px-2 py-1.5">
          <dt className="text-[10px] text-violet-600">{item.label}</dt>
          <dd className="text-sm font-semibold tabular-nums text-violet-950">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
