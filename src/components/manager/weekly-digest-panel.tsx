"use client";

import { Button } from "@/components/ui/button";
import { DigestBriefSection } from "@/components/manager/digest-brief-section";
import { DigestFlowStatusBar } from "@/components/manager/digest-flow-status-bar";
import {
  ManagerDigestStats,
  formatMoneyStat,
} from "@/components/manager/manager-digest-stats";
import {
  WeeklyDigestExtras,
} from "@/components/manager/monthly-digest-extras";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/client-api";
import { copyTextToClipboard } from "@/lib/secure-clipboard";
import {
  buildWeeklyDigest,
  formatWeeklyDigestText,
  type WeeklyDigest,
} from "@/lib/weekly-report";
import {
  buildGlobalWeeklyActionLines,
  buildGlobalWeeklyDigest,
  formatGlobalWeeklyDigestText,
  formatGlobalReportScopeHint,
  globalWeeklyPrimaryStatItems,
  globalWeeklyWorkflowStatItems,
  type GlobalWeeklyDigest,
} from "@/lib/global-report";
import { computeStorePortfolioMetrics } from "@/lib/store-summary-metrics";
import type { ReportPersonScope } from "@/lib/evaluation-scope";
import type { ReportScope } from "@/lib/report-hub-config";
import { markDigestRead } from "@/lib/weekly-digest-persistence";
import { upsertDigestHistory, weeklyDigestToHistoryRecord } from "@/lib/digest-history";
import type { Order, SupplementOrder } from "@/lib/types";
import type { PeriodSelection } from "@/lib/period-filter";
import { formatPeriodLabel, isWeekPeriod } from "@/lib/period-filter";
import {
  getWeekRefForPeriod,
  resolveWeekPeriodForDigest,
  SNAPSHOT_REPORT_HINT,
  FLOW_DISTRIBUTION_HINT,
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

  const isGlobalBrief = reportScope === "global";
  const globalDigest = isGlobalBrief ? (digest as GlobalWeeklyDigest) : null;

  const portfolioMetrics = useMemo(
    () => computeStorePortfolioMetrics(orders, supplements),
    [orders, supplements],
  );

  const workflowStats =
    globalDigest != null
      ? globalWeeklyWorkflowStatItems(
          globalDigest.workflow,
          portfolioMetrics,
          globalDigest.lowDimensionCountWeek,
        )
      : [];

  const stats =
    globalDigest != null
      ? globalWeeklyPrimaryStatItems(globalDigest, portfolioMetrics)
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
        ];

  const visibleActionLines = useMemo(() => {
    if (!globalDigest) return digest.actionLines;
    return buildGlobalWeeklyActionLines(
      globalDigest,
      orders,
      supplements,
      weekPeriod,
      staffRecords,
      personScope,
      weekRef,
    );
  }, [
    globalDigest,
    digest.actionLines,
    orders,
    supplements,
    weekPeriod,
    staffRecords,
    personScope,
    weekRef,
  ]);

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
          : "rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-4"
      }
    >
      {!embedded ? (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-sky-900">
              本周管理简报
            </h2>
            <p className="mt-0.5 text-xs text-sky-800/90">{digest.weekLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="text-xs text-sky-700 hover:underline"
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
          {isGlobalBrief ? (
            <>
              <DigestBriefSection
                title="① 当前流程分布"
                tone="neutral"
                hint={FLOW_DISTRIBUTION_HINT}
              >
                <DigestFlowStatusBar orders={orders} />
              </DigestBriefSection>

              <div className="mt-3 space-y-3">
                <DigestBriefSection
                  title="② 本期分析"
                  tone="blue"
                  stats={stats}
                />

                {workflowStats.length > 0 ? (
                  <DigestBriefSection
                    title="③ 当前快照"
                    tone="rose"
                    hint={SNAPSHOT_REPORT_HINT}
                    stats={workflowStats}
                  />
                ) : null}
              </div>

              <WeeklyDigestExtras
                weeklyAnomalies={digest.weeklyAnomalies}
                designerSummary={digest.designerSummary}
                showDesignerSummary={false}
              />
            </>
          ) : (
            <>
              <ManagerDigestStats items={stats} />
              <WeeklyDigestExtras
                weeklyAnomalies={digest.weeklyAnomalies}
                designerSummary={digest.designerSummary}
                showDesignerSummary={false}
              />
            </>
          )}

          {visibleActionLines.length > 0 ? (
            <ul className="mt-3 list-inside list-disc text-xs text-slate-700">
              {visibleActionLines.map((line) => (
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
              <span className="self-center text-[11px] text-sky-700/80">
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
