"use client";

import { DigestBriefSection } from "@/components/manager/digest-brief-section";
import { DigestFlowStatusBar } from "@/components/manager/digest-flow-status-bar";
import {
  formatMoneyStat,
} from "@/components/manager/manager-digest-stats";
import { MonthlyDigestExtras } from "@/components/manager/monthly-digest-extras";
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
  computeCumulativeDeliveryCounts,
  formatGlobalAllSummaryDigestText,
  formatGlobalMonthlyDigestText,
  formatGlobalReportScopeHint,
  globalAllSummaryPrimaryStatItems,
  globalAllSummaryWorkflowStatItems,
  globalMonthlyPrimaryStatItems,
  globalMonthlyWorkflowStatItems,
  type GlobalMonthlyDigest,
} from "@/lib/global-report";
import { computeStorePortfolioMetrics } from "@/lib/store-summary-metrics";
import { getAllSummaryBriefLabel } from "@/lib/report-hub-config";
import { SNAPSHOT_REPORT_HINT, FLOW_DISTRIBUTION_HINT } from "@/lib/report-period-sync";
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
  digestVariant?: "monthly" | "allSummary";
  onOpenOrderLookup?: () => void;
}

export function MonthlyDigestPanel({
  orders,
  supplements,
  period,
  embedded = false,
  reportScope = "manager",
  storeScopeLabel = null,
  personScope,
  digestVariant = "monthly",
  onOpenOrderLookup,
}: MonthlyDigestPanelProps) {
  const isAllSummary = digestVariant === "allSummary";
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
    if (reportScope === "global" && isAllSummary) {
      return formatGlobalAllSummaryDigestText(
        digest as GlobalMonthlyDigest,
        orders,
        supplements,
        storeScopeLabel,
      );
    }
    if (reportScope === "global") {
      return formatGlobalMonthlyDigestText(
        digest as GlobalMonthlyDigest,
        storeScopeLabel,
      );
    }
    return formatMonthlyDigestText(digest);
  }, [
    digest,
    reportScope,
    storeScopeLabel,
    isAllSummary,
    orders,
    supplements,
  ]);

  const portfolioMetrics = useMemo(
    () => computeStorePortfolioMetrics(orders, supplements),
    [orders, supplements],
  );

  const deliveryCounts = useMemo(
    () => computeCumulativeDeliveryCounts(orders),
    [orders],
  );

  const globalScopeHint =
    reportScope === "global" ? formatGlobalReportScopeHint(storeScopeLabel) : "";

  useEffect(() => {
    if (!user?.username || isAllSummary) return;
    upsertDigestHistory(
      user.username,
      monthlyDigestToHistoryRecord(digest, reportScope),
      reportScope,
    );
  }, [user?.username, digest, reportScope, isAllSummary]);

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

  const isGlobalBrief = reportScope === "global";
  const showFlowBar = isGlobalBrief;

  const workflowStats =
    isGlobalBrief && isAllSummary
      ? globalAllSummaryWorkflowStatItems(
          (digest as GlobalMonthlyDigest).workflow,
          deliveryCounts,
        )
      : isGlobalBrief
        ? globalMonthlyWorkflowStatItems(
            (digest as GlobalMonthlyDigest).workflow,
            portfolioMetrics,
            (digest as GlobalMonthlyDigest).lowDimensionCountPeriod,
          )
        : [];

  const stats =
    isGlobalBrief && isAllSummary
      ? globalAllSummaryPrimaryStatItems(
          portfolioMetrics,
          digest.activeTimeoutCount,
        )
      : isGlobalBrief
        ? globalMonthlyPrimaryStatItems(
            digest as GlobalMonthlyDigest,
            portfolioMetrics,
          )
        : [
            { label: "新派单", value: String(digest.newDispatchCount) },
            {
              label: "下单",
              value: formatMoneyStat(digest.orderedCount, digest.orderedAmount),
            },
            { label: "退单", value: String(digest.refundCount) },
            { label: "当前超时", value: String(digest.activeTimeoutCount) },
          ];

  const analysisTitle = isAllSummary ? "累计分析" : "本期分析";
  const allSummaryBriefLabel = getAllSummaryBriefLabel(storeScopeLabel);
  const showStoreRanks =
    !storeScopeLabel || storeScopeLabel.includes("、");

  const visibleActionLines =
    isGlobalBrief && isAllSummary
      ? digest.actionLines
          .filter((line) => !line.includes("较") && !line.includes("验收差评"))
          .concat(
            (digest as GlobalMonthlyDigest).lowDimensionCountPeriod > 0
              ? [
                  `维度低评 ${(digest as GlobalMonthlyDigest).lowDimensionCountPeriod} 单需复盘`,
                ]
              : [],
          )
      : isGlobalBrief
        ? digest.actionLines
            .filter((line) => !line.includes("验收差评"))
            .concat(
              (digest as GlobalMonthlyDigest).lowDimensionCountPeriod > 0
                ? [
                    `维度低评 ${(digest as GlobalMonthlyDigest).lowDimensionCountPeriod} 单需复盘`,
                  ]
                : [],
            )
        : digest.actionLines;

  return (
    <div className={wrapperClass}>
      {!embedded ? (
        <div className="mb-2">
          <h2 className="text-sm font-semibold text-indigo-900">本月管理简报</h2>
          <p className="mt-0.5 text-xs text-indigo-700/90">{digest.periodLabel}</p>
        </div>
      ) : (
        <p className="mb-1 text-xs text-slate-500">
          {isAllSummary ? (
            <>
              {allSummaryBriefLabel} · 统计周期：全部
              {globalScopeHint}
            </>
          ) : (
            <>
              统计周期：{digest.periodLabel}
              {digest.previousPeriodLabel
                ? ` · 环比参照 ${digest.previousPeriodLabel}`
                : ""}
              {globalScopeHint}
            </>
          )}
        </p>
      )}

      {showFlowBar ? (
        <DigestBriefSection
          title="① 当前流程分布"
          tone="neutral"
          hint={FLOW_DISTRIBUTION_HINT}
        >
          <DigestFlowStatusBar orders={orders} />
        </DigestBriefSection>
      ) : null}

      <div className={showFlowBar ? "mt-3 space-y-3" : "space-y-3"}>
        <DigestBriefSection
          title={`② ${analysisTitle}`}
          tone="indigo"
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

        {isGlobalBrief ? (
          <DigestBriefSection title="④ 排行与质量" tone="neutral">
            <MonthlyDigestExtras
              acceptanceStats={digest.acceptanceStats}
              leaderboards={digest.leaderboards}
              designerSummary={digest.designerSummary}
              showLeaderboards
              showStoreRanks={showStoreRanks}
              leaderboardHeading={
                isAllSummary ? "累计排行 · 综合前5" : "本期排行 · 综合前5"
              }
              ratingSummaryMode="dimensionLow"
            />
          </DigestBriefSection>
        ) : (
          <MonthlyDigestExtras
            acceptanceStats={digest.acceptanceStats}
            leaderboards={digest.leaderboards}
            designerSummary={digest.designerSummary}
            showLeaderboards={false}
            leaderboardHeading="本期排行 · 综合前5"
          />
        )}
      </div>

      {visibleActionLines.length > 0 ? (
        <ul className="mt-3 list-inside list-disc text-xs text-slate-700">
          {visibleActionLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={handleCopy}>
          {copyOk ? "已复制" : isAllSummary ? "复制汇总简报" : "复制月报文本"}
        </Button>
        <Button type="button" variant="outline" onClick={handleWecomPush}>
          {pushState === "loading"
            ? "推送中…"
            : pushState === "ok"
              ? "已推送到企微"
              : "推送到企微群"}
        </Button>
      </div>
      {isAllSummary && onOpenOrderLookup ? (
        <p className="mt-3 text-xs text-slate-500">
          <button
            type="button"
            onClick={onOpenOrderLookup}
            className="font-medium text-rose-700 underline-offset-2 hover:underline"
          >
            查看订单明细 → 订单查询
          </button>
        </p>
      ) : null}
    </div>
  );
}
