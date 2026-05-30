import {
  evaluationSnapshotScopeKey,
  filterMonthlySnapshotMonthsForScope,
  monthlySnapshotMatchesScope,
} from "./evaluation-scope";
import { apiFetch } from "./client-api";
import { getAcceptanceEvaluationSummary } from "./acceptance-evaluation-stats";
import type { FunnelStage } from "./conversion-funnel";
import { getDispatcherPerformanceRows } from "./dispatcher-performance";
import {
  getStoreDispatcherAmountRows,
} from "./evaluation-stats";
import { buildMonthlyMetricsSnapshot } from "./monthly-snapshot-build";
import type { MonthlyMetricsSnapshot } from "./monthly-snapshot-types";
import type { OperationsBrief } from "./operations-brief";
import {
  filterOrdersByPeriod,
  filterSupplementsByPeriod,
  getCurrentYearMonth,
  type PeriodSelection,
} from "./period-filter";
import type { StaffRecord } from "./staff-roster";
import {
  countPendingAcceptanceScan,
} from "./trend-series";
import type { Order, SupplementOrder } from "./types";

export type AutoSnapshotResult = "saved" | "exists" | "skipped" | "failed";

export function buildOverviewMonthlySnapshot(
  orders: Order[],
  supplements: SupplementOrder[],
  period: PeriodSelection,
  brief: OperationsBrief,
  funnel: FunnelStage[],
  options?: {
    savedBy?: string;
    scopeLabel?: string;
    staffRecords?: StaffRecord[];
  },
): MonthlyMetricsSnapshot {
  const base = buildMonthlyMetricsSnapshot(orders, supplements, period, {
    savedBy: options?.savedBy ?? "综合看板",
    scopeLabel: options?.scopeLabel,
    designerNames: null,
    staffRecords: options?.staffRecords ?? [],
  });

  const signed = brief.kpis.find((k) => k.id === "signed");
  const ordered = brief.kpis.find((k) => k.id === "ordered");
  const dispatch = brief.kpis.find((k) => k.id === "dispatch");
  const refund = brief.kpis.find((k) => k.id === "refund");
  const acceptance = brief.kpis.find((k) => k.id === "acceptance");

  const periodOrders = filterOrdersByPeriod(orders, period);
  const periodSupplements = filterSupplementsByPeriod(supplements, period);
  const acceptanceSummary = getAcceptanceEvaluationSummary(periodOrders);
  const perfRows = getDispatcherPerformanceRows(
    orders,
    supplements,
    null,
    options?.staffRecords ?? [],
    period,
  );
  const storeRows = getStoreDispatcherAmountRows(
    periodOrders,
    periodSupplements,
    null,
  );
  const scopedStoreRows = options?.scopeLabel
    ? storeRows.filter((r) => {
        if (r.isWorkflowSummary) return true;
        if (r.label === options.scopeLabel) return true;
        if (options.scopeLabel!.includes("、")) {
          return options.scopeLabel!.split("、").includes(r.label);
        }
        return false;
      })
    : storeRows;

  return {
    ...base,
    cockpit: {
      newDispatchCount: dispatch?.count ?? 0,
      newDispatchAmount: dispatch?.amount ?? 0,
      signedContractAmount: signed?.amount ?? 0,
      signedCount: signed?.count,
      orderedAmount: ordered?.amount ?? 0,
      orderedCount: ordered?.count,
      refundCount: refund?.count ?? 0,
      refundAmount: refund?.amount ?? 0,
      acceptedAmount: acceptance?.amount ?? 0,
      acceptedCount: acceptance?.count,
      acceptanceAvg:
        acceptanceSummary.ratedCount > 0
          ? acceptanceSummary.avgOverall
          : null,
      electronicAcceptanceRate: acceptanceSummary.electronicRate,
      pendingAcceptanceCount: countPendingAcceptanceScan(orders),
      funnel: funnel.map((s) => ({
        key: s.key,
        label: s.label,
        count: s.count,
        rate: s.rate,
      })),
      dispatchers: perfRows.slice(0, 20).map((r) => ({
        key: r.key,
        label: r.label,
        contributionScore: r.contributionScore,
        newDispatchCount: r.newDispatchCount,
        depositTotal: r.depositTotal,
      })),
      stores: scopedStoreRows
        .filter((r) => !r.isWorkflowSummary)
        .map((r) => ({
          key: r.key,
          label: r.label,
          orderedCount: r.ordered.count,
          orderedAmount: r.ordered.amount,
        })),
    },
  };
}

/** 上月自动归档；本月每 24h 更新一次 */
export async function ensureOverviewMonthlySnapshot(
  snapshot: MonthlyMetricsSnapshot,
): Promise<AutoSnapshotResult> {
  const currentYm = getCurrentYearMonth();
  const isCurrentMonth = snapshot.yearMonth === currentYm;
  const scopeKey = evaluationSnapshotScopeKey(snapshot.scopeLabel);
  const scopeQuery = scopeKey
    ? `&scope=${encodeURIComponent(scopeKey)}`
    : "";

  try {
    const existingRes = await apiFetch(
      `/api/monthly-snapshots?month=${encodeURIComponent(snapshot.yearMonth)}${scopeQuery}`,
    );

    if (existingRes.ok) {
      if (!isCurrentMonth) return "exists";
      const existing = (await existingRes.json()) as MonthlyMetricsSnapshot;
      if (
        !monthlySnapshotMatchesScope(existing, snapshot.scopeLabel ?? null)
      ) {
        return "failed";
      }
      const ageMs = Date.now() - new Date(existing.savedAt).getTime();
      if (ageMs < 24 * 60 * 60 * 1000) return "exists";
    } else if (existingRes.status !== 404) {
      return "failed";
    }

    const postRes = await apiFetch("/api/monthly-snapshots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
    return postRes.ok ? "saved" : "failed";
  } catch {
    return "failed";
  }
}

export async function fetchMonthlySnapshotClient(
  yearMonth: string,
  scopeLabel?: string | null,
): Promise<MonthlyMetricsSnapshot | null> {
  try {
    const scopeKey = evaluationSnapshotScopeKey(scopeLabel);
    const scopeQuery = scopeKey
      ? `&scope=${encodeURIComponent(scopeKey)}`
      : "";
    const res = await apiFetch(
      `/api/monthly-snapshots?month=${encodeURIComponent(yearMonth)}${scopeQuery}`,
    );
    if (!res.ok) return null;
    const snapshot = (await res.json()) as MonthlyMetricsSnapshot;
    if (!monthlySnapshotMatchesScope(snapshot, scopeLabel ?? null)) {
      return null;
    }
    return snapshot;
  } catch {
    return null;
  }
}

export async function fetchMonthlySnapshotIndexClient(
  scopeLabel?: string | null,
): Promise<string[]> {
  try {
    const res = await apiFetch("/api/monthly-snapshots");
    if (!res.ok) return [];
    const index = (await res.json()) as {
      items: { yearMonth: string; scopeLabel?: string }[];
    };
    return filterMonthlySnapshotMonthsForScope(
      index.items ?? [],
      scopeLabel ?? null,
    );
  } catch {
    return [];
  }
}
