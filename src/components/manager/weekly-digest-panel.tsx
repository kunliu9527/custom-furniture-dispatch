"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/client-api";
import { copyTextToClipboard } from "@/lib/secure-clipboard";
import {
  ManagerDigestStats,
  formatMoneyStat,
} from "@/components/manager/manager-digest-stats";
import {
  buildWeeklyDigest,
  formatWeeklyDigestText,
  type WeeklyDigest,
} from "@/lib/weekly-report";
import {
  buildGlobalWeeklyDigest,
  formatGlobalWeeklyDigestText,
  formatGlobalReportScopeHint,
  globalPrimaryStatItems,
  globalWorkflowStatItems,
  type GlobalWeeklyDigest,
} from "@/lib/global-report";
import type { ReportPersonScope } from "@/lib/evaluation-scope";
import type { ReportScope } from "@/lib/report-hub-config";
import { markDigestRead } from "@/lib/weekly-digest-persistence";
import { WeeklyDigestExtras } from "@/components/manager/monthly-digest-extras";
import { upsertDigestHistory, weeklyDigestToHistoryRecord } from "@/lib/digest-history";
import type { Order, SupplementOrder } from "@/lib/types";
import type { PeriodSelection } from "@/lib/period-filter";
import { formatPeriodLabel, isWeekPeriod } from "@/lib/period-filter";
import {
  getWeekRefForPeriod,
  resolveWeekPeriodForDigest,
  SNAPSHOT_REPORT_HINT,
} from "@/lib/report-period-sync";
import { useCallback, useEffect, useMemo, useState } from "react";

interface WeeklyDigestPanelProps {
  orders: Order[];
  supplements: SupplementOrder[];
  period?: PeriodSelection;
  embedded?: boolean;
  reportScope?: ReportScope;
  storeScopeLabel?: string | null;
  personScope?: ReportPersonScope;
}

export function WeeklyDigestPanel({
  orders,
  supplements,
  period,
  embedded = false,
  reportScope = "manager",
  storeScopeLabel = null,
  personScope,
}: WeeklyDigestPanelProps) {
  const { user, staffRecords } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [pushState, setPushState] = useState<
    "idle" | "loading" | "ok" | "unconfigured" | "error"
  >("idle");
  const [wecomAvailable, setWecomAvailable] = useState(false);
  const [copyOk, setCopyOk] = useState(false);

  const weekPeriod = useMemo(
    () => resolveWeekPeriodForDigest(period),
    [period],
  );
  const followsPeriod = Boolean(period && isWeekPeriod(period));
  const weekRef = useMemo(
    () => getWeekRefForPeriod(weekPeriod),
    [weekPeriod],
  );

  const digest = useMemo((): WeeklyDigest | GlobalWeeklyDigest => {
    if (reportScope === "global") {
      return buildGlobalWeeklyDigest(
        orders,
        supplements,
        weekPeriod,
        staffRecords,
        weekRef,
        personScope,
      );
    }
    return buildWeeklyDigest(
      orders,
      supplements,
      staffRecords,
      personScope?.designerNames ?? null,
      weekRef,
    );
  }, [orders, supplements, staffRecords, reportScope, weekPeriod, weekRef, personScope]);

  const text = useMemo(() => {
    if (reportScope === "global") {
      return formatGlobalWeeklyDigestText(
        digest as GlobalWeeklyDigest,
        storeScopeLabel,
      );
    }
    return formatWeeklyDigestText(digest);
  }, [digest, reportScope, storeScopeLabel]);

  const globalScopeHint =
    reportScope === "global" ? formatGlobalReportScopeHint(storeScopeLabel) : "";

  const workflowStats =
    reportScope === "global"
      ? globalWorkflowStatItems(
          (digest as GlobalWeeklyDigest).workflow,
          weekPeriod,
          { includeEvaluation: false },
        )
      : [];

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

  useEffect(() => {
    if (!user?.username) return;
    upsertDigestHistory(
      user.username,
      weeklyDigestToHistoryRecord(digest, reportScope),
      reportScope,
    );
  }, [user?.username, digest, reportScope]);

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
    <div
      className={
        embedded
          ? ""
          : "rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-4"
      }
    >
      {!embedded ? (
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
      ) : (
        <p className="mb-1 text-xs text-slate-500">
          {followsPeriod ? (
            <>
              统计周期：{digest.weekLabel}（与顶部
              {formatPeriodLabel(weekPeriod)}同步）
              {globalScopeHint}
            </>
          ) : (
            <>
              自然周：{digest.weekLabel}
              {globalScopeHint}
            </>
          )}
        </p>
      )}

      {!collapsed || embedded ? (
        <>
          <ManagerDigestStats
            items={
              reportScope === "global"
                ? globalPrimaryStatItems(
                    digest,
                    (digest as GlobalWeeklyDigest).amounts,
                    [
                      { label: "超时", value: String(digest.activeTimeoutCount) },
                      {
                        label: "待接单",
                        value: String(digest.pendingAcceptCount),
                      },
                    ],
                  )
                : [
                    { label: "新派单", value: String(digest.newDispatchCount) },
                    {
                      label: "下单",
                      value: formatMoneyStat(
                        digest.orderedCount,
                        digest.orderedAmount,
                      ),
                    },
                    { label: "超时", value: String(digest.activeTimeoutCount) },
                    {
                      label: "待接单",
                      value: String(digest.pendingAcceptCount),
                    },
                  ]
            }
          />
          {workflowStats.length > 0 ? (
            <div className="mt-2 space-y-1">
              <p className="text-[10px] font-medium text-slate-500">
                {SNAPSHOT_REPORT_HINT}
              </p>
              <ManagerDigestStats
                items={workflowStats}
                tone={reportScope === "global" ? "rose" : "violet"}
              />
            </div>
          ) : null}
          <WeeklyDigestExtras
            weeklyAnomalies={digest.weeklyAnomalies}
            designerSummary={digest.designerSummary}
            showDesignerSummary={reportScope === "global"}
          />
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
    </div>
  );
}
