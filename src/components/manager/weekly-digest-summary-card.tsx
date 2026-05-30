"use client";

import {
  ManagerDigestStats,
} from "@/components/manager/manager-digest-stats";
import {
  WeeklyAnomalyBlock,
} from "@/components/manager/monthly-digest-extras";
import { useAuth } from "@/context/auth-context";
import type { ReportPersonScope } from "@/lib/evaluation-scope";
import {
  buildGlobalWeeklyDigest,
  formatGlobalReportScopeHint,
  globalPrimaryStatItems,
  globalWorkflowStatItems,
  type GlobalWeeklyDigest,
} from "@/lib/global-report";
import { buildWeeklyDigest } from "@/lib/weekly-report";
import { formatPeriodLabel } from "@/lib/period-filter";
import {
  getWeekRefForPeriod,
  resolveWeekPeriodForDigest,
  SNAPSHOT_REPORT_HINT,
} from "@/lib/report-period-sync";
import type { Order, SupplementOrder } from "@/lib/types";
import type { PeriodSelection } from "@/lib/period-filter";
import { useMemo, useEffect } from "react";
import { markDigestRead } from "@/lib/weekly-digest-persistence";
import { getWeekId } from "@/lib/week-filter";

interface WeeklyDigestSummaryCardProps {
  orders: Order[];
  supplements: SupplementOrder[];
  period: PeriodSelection;
  storeScopeLabel?: string | null;
  personScope?: ReportPersonScope;
  /** 本人登录：仅个人订单简报，不含全流程与设计师排名 */
  personalMode?: boolean;
  personalTitle?: string | null;
}

export function WeeklyDigestSummaryCard({
  orders,
  supplements,
  period,
  storeScopeLabel = null,
  personScope,
  personalMode = false,
  personalTitle = null,
}: WeeklyDigestSummaryCardProps) {
  const { staffRecords, user } = useAuth();

  useEffect(() => {
    if (!user?.username) return;
    markDigestRead(user.username, getWeekId());
  }, [user?.username]);

  const weekPeriod = useMemo(
    () => resolveWeekPeriodForDigest(period),
    [period],
  );
  const weekRef = useMemo(
    () => getWeekRefForPeriod(weekPeriod),
    [weekPeriod],
  );

  const digest = useMemo(() => {
    if (personalMode) {
      return buildWeeklyDigest(
        orders,
        supplements,
        staffRecords,
        personScope?.designerNames ?? null,
        weekRef,
      );
    }
    return buildGlobalWeeklyDigest(
      orders,
      supplements,
      weekPeriod,
      staffRecords,
      weekRef,
      personScope,
    );
  }, [
    orders,
    supplements,
    weekPeriod,
    staffRecords,
    weekRef,
    personScope,
    personalMode,
  ]);

  const scopeHint = personalMode
    ? " · 本人订单"
    : formatGlobalReportScopeHint(storeScopeLabel);
  const title = personalTitle
    ? personalTitle
    : storeScopeLabel
      ? `${storeScopeLabel} · 本周简报`
      : "本周经营简报";
  const displayActionLines = useMemo(
    () =>
      digest.actionLines.filter((line) => !line.startsWith("关注设计师")),
    [digest.actionLines],
  );
  const workflowStats = personalMode
    ? []
    : globalWorkflowStatItems(
        (digest as GlobalWeeklyDigest).workflow,
        weekPeriod,
        { includeEvaluation: false },
      );

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-violet-900">{title}</h2>
          <p className="mt-0.5 text-xs text-violet-700/90">
            {digest.weekLabel} · {formatPeriodLabel(weekPeriod)}
            {scopeHint}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <WeeklyAnomalyBlock items={digest.weeklyAnomalies} />
      </div>

      <ManagerDigestStats
        className="mt-3"
        items={
          personalMode
            ? [
                { label: "新派单", value: String(digest.newDispatchCount) },
                { label: "下单", value: String(digest.orderedCount) },
                {
                  label: "超时",
                  value: String(digest.activeTimeoutCount),
                },
                {
                  label: "待接单",
                  value: String(digest.pendingAcceptCount),
                },
              ]
            : globalPrimaryStatItems(
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
        }
      />

      {workflowStats.length > 0 ? (
        <div className="mt-2 space-y-1">
          <p className="text-[10px] font-medium text-slate-500">
            {SNAPSHOT_REPORT_HINT}
          </p>
          <ManagerDigestStats items={workflowStats} tone="rose" />
        </div>
      ) : null}

      {displayActionLines.length > 0 ? (
        <p className="mt-3 text-xs text-violet-900/90">
          建议：{displayActionLines[0]}
          {displayActionLines.length > 1
            ? ` · 另有 ${displayActionLines.length - 1} 项`
            : ""}
        </p>
      ) : null}
    </section>
  );
}
