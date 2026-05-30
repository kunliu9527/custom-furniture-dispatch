"use client";

import {
  ManagerDigestStats,
  formatMoneyStat,
} from "@/components/manager/manager-digest-stats";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/client-api";
import { copyTextToClipboard } from "@/lib/secure-clipboard";
import {
  buildMonthlyDigest,
  formatMonthlyDigestText,
  type MonthlyDigest,
} from "@/lib/monthly-report";
import {
  buildGlobalMonthlyDigest,
  formatGlobalMonthlyDigestText,
  formatGlobalReportScopeHint,
  globalPrimaryStatItems,
  globalWorkflowStatItems,
  type GlobalMonthlyDigest,
} from "@/lib/global-report";
import { SNAPSHOT_REPORT_HINT } from "@/lib/report-period-sync";
import { MonthlyDigestExtras, WeeklyDigestExtras } from "@/components/manager/monthly-digest-extras";
import { monthlyDigestToHistoryRecord, upsertDigestHistory } from "@/lib/digest-history";
import type { PeriodSelection } from "@/lib/period-filter";
import type { ReportPersonScope } from "@/lib/evaluation-scope";
import type { ReportScope } from "@/lib/report-hub-config";
import type { Order, SupplementOrder } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

interface MonthlyDigestPanelProps {
  orders: Order[];
  supplements: SupplementOrder[];
  period: PeriodSelection;
  embedded?: boolean;
  reportScope?: ReportScope;
  storeScopeLabel?: string | null;
  personScope?: ReportPersonScope;
}

export function MonthlyDigestPanel({
  orders,
  supplements,
  period,
  embedded = false,
  reportScope = "manager",
  storeScopeLabel = null,
  personScope,
}: MonthlyDigestPanelProps) {
  const { user, staffRecords } = useAuth();
  const [copyOk, setCopyOk] = useState(false);
  const [pushState, setPushState] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");

  const digest = useMemo((): MonthlyDigest | GlobalMonthlyDigest => {
    if (reportScope === "global") {
      return buildGlobalMonthlyDigest(
        orders,
        supplements,
        period,
        staffRecords,
        new Date(),
        personScope,
      );
    }
    return buildMonthlyDigest(
      orders,
      supplements,
      period,
      staffRecords,
      personScope?.designerNames ?? null,
      new Date(),
      personScope?.dispatcherNames ?? null,
    );
  }, [orders, supplements, period, staffRecords, reportScope, personScope]);

  const text = useMemo(() => {
    if (reportScope === "global") {
      return formatGlobalMonthlyDigestText(
        digest as GlobalMonthlyDigest,
        storeScopeLabel,
      );
    }
    return formatMonthlyDigestText(digest);
  }, [digest, reportScope, storeScopeLabel]);

  const globalScopeHint =
    reportScope === "global" ? formatGlobalReportScopeHint(storeScopeLabel) : "";

  useEffect(() => {
    if (!user?.username) return;
    upsertDigestHistory(
      user.username,
      monthlyDigestToHistoryRecord(digest, reportScope),
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
      if (!res.ok) {
        setPushState("error");
        return;
      }
      setPushState("ok");
    } catch {
      setPushState("error");
    }
  }

  const wrapperClass = embedded
    ? ""
    : "rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-4";

  const workflowStats =
    reportScope === "global"
      ? globalWorkflowStatItems(
          (digest as GlobalMonthlyDigest).workflow,
          period,
        )
      : [];

  const stats =
    reportScope === "global"
      ? globalPrimaryStatItems(digest, (digest as GlobalMonthlyDigest).amounts, [
          {
            label: "当前超时",
            value: String(digest.activeTimeoutCount),
          },
        ])
      : [
          { label: "新派单", value: String(digest.newDispatchCount) },
          {
            label: "下单",
            value: formatMoneyStat(digest.orderedCount, digest.orderedAmount),
          },
          { label: "退单", value: String(digest.refundCount) },
          { label: "当前超时", value: String(digest.activeTimeoutCount) },
        ];

  return (
    <div className={wrapperClass}>
      {!embedded ? (
        <div className="mb-2">
          <h2 className="text-sm font-semibold text-indigo-900">本月管理简报</h2>
          <p className="mt-0.5 text-xs text-indigo-700/90">{digest.periodLabel}</p>
        </div>
      ) : (
        <p className="mb-1 text-xs text-slate-500">
          统计周期：{digest.periodLabel}
          {digest.previousPeriodLabel
            ? ` · 环比参照 ${digest.previousPeriodLabel}`
            : ""}
          {globalScopeHint}
        </p>
      )}

      <ManagerDigestStats items={stats} tone="indigo" />
      {workflowStats.length > 0 ? (
        <div className="mt-2 space-y-1">
          <p className="text-[10px] font-medium text-slate-500">
            {SNAPSHOT_REPORT_HINT}
          </p>
          <ManagerDigestStats items={workflowStats} tone="rose" />
        </div>
      ) : null}

      <MonthlyDigestExtras
        acceptanceStats={digest.acceptanceStats}
        leaderboards={digest.leaderboards}
        designerSummary={digest.designerSummary}
        showLeaderboards={!storeScopeLabel}
      />

      {digest.actionLines.length > 0 ? (
        <ul className="mt-3 list-inside list-disc text-xs text-slate-700">
          {digest.actionLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={handleCopy}>
          {copyOk ? "已复制" : "复制月报文本"}
        </Button>
        <Button type="button" variant="outline" onClick={handleWecomPush}>
          {pushState === "loading"
            ? "推送中…"
            : pushState === "ok"
              ? "已推送到企微"
              : "推送到企微群"}
        </Button>
      </div>
    </div>
  );
}
