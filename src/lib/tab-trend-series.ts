import { getAcceptanceEvaluationSummary } from "./acceptance-evaluation-stats";
import { getDispatcherPerformanceRows } from "./dispatcher-performance";
import {
  getStoreDispatcherAmountRows,
  classifyDispatcherOrder,
} from "./evaluation-stats";
import { computeOrderAmountConversionRate } from "./aggregate-metric-rates";
import {
  filterOrdersByPeriod,
  filterSupplementsByPeriod,
  getPeriodBounds,
  listRecentYearMonths,
  parseYearMonth,
  yearMonthToPeriod,
  type PeriodSelection,
} from "./period-filter";
import type { Order, SupplementOrder } from "./types";

export interface DispatcherMiniPoint {
  yearMonth: string;
  label: string;
  newDispatchCount: number;
  signedContractAmount: number;
}

export interface DesignerMiniPoint {
  yearMonth: string;
  label: string;
  orderedAmount: number;
  avgConversion: number | null;
}

export interface StoreBarItem {
  key: string;
  label: string;
  orderedAmount: number;
}

export interface AcceptanceMiniPoint {
  yearMonth: string;
  label: string;
  avgOverall: number | null;
  electronicRate: number;
}

function monthLabel(ym: string): string {
  const p = parseYearMonth(ym);
  return p ? `${p.month}月` : ym;
}

function signedInPeriod(order: Order, period: PeriodSelection): boolean {
  const at = order.contract?.signedAt;
  if (!at) return false;
  return filterOrdersByPeriod([order], period).length > 0;
}

export function buildDispatcherMiniSeries(
  orders: Order[],
  _supplements: SupplementOrder[],
  monthCount = 6,
  ref = new Date(),
): DispatcherMiniPoint[] {
  return listRecentYearMonths(monthCount, ref).map((ym) => {
    const period = yearMonthToPeriod(ym);
    const periodOrders = filterOrdersByPeriod(orders, period);
    const bounds = getPeriodBounds(period);
    let signedContractAmount = 0;
    for (const order of periodOrders) {
      if (signedInPeriod(order, period)) {
        signedContractAmount += order.contract?.contractAmount ?? 0;
      }
    }
    const newDispatchCount = bounds
      ? orders.filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return (
            Number.isFinite(t) &&
            t >= bounds.start.getTime() &&
            t < bounds.end.getTime()
          );
        }).length
      : periodOrders.length;
    return {
      yearMonth: ym,
      label: monthLabel(ym),
      newDispatchCount,
      signedContractAmount,
    };
  });
}

export function buildDesignerMiniSeries(
  orders: Order[],
  supplements: SupplementOrder[],
  monthCount = 6,
  ref = new Date(),
): DesignerMiniPoint[] {
  return listRecentYearMonths(monthCount, ref).map((ym) => {
    const period = yearMonthToPeriod(ym);
    const periodOrders = filterOrdersByPeriod(orders, period);
    const periodSupplements = filterSupplementsByPeriod(supplements, period);
    let orderedAmount = 0;
    let totalAmount = 0;
    for (const order of periodOrders) {
      const parts = classifyDispatcherOrder(order, periodSupplements);
      orderedAmount += parts.ordered.amount;
      totalAmount +=
        parts.ordered.amount +
        parts.notOrdered.amount +
        parts.pendingRefund.amount +
        parts.confirmedRefund.amount;
    }
    return {
      yearMonth: ym,
      label: monthLabel(ym),
      orderedAmount,
      avgConversion: computeOrderAmountConversionRate(
        orderedAmount,
        totalAmount,
      ),
    };
  });
}

export function buildStoreBarItems(
  orders: Order[],
  supplements: SupplementOrder[],
  period: PeriodSelection,
  storeNames: string[] | null,
): StoreBarItem[] {
  const rows = getStoreDispatcherAmountRows(
    filterOrdersByPeriod(orders, period),
    filterSupplementsByPeriod(supplements, period),
    storeNames,
  );
  return rows
    .filter((r) => !r.isWorkflowSummary)
    .map((r) => ({
      key: r.key,
      label: r.label,
      orderedAmount: r.ordered.amount,
    }))
    .sort((a, b) => b.orderedAmount - a.orderedAmount)
    .slice(0, 8);
}

export function buildAcceptanceMiniSeries(
  orders: Order[],
  monthCount = 6,
  ref = new Date(),
): AcceptanceMiniPoint[] {
  return listRecentYearMonths(monthCount, ref).map((ym) => {
    const period = yearMonthToPeriod(ym);
    const periodOrders = filterOrdersByPeriod(orders, period);
    const s = getAcceptanceEvaluationSummary(periodOrders);
    return {
      yearMonth: ym,
      label: monthLabel(ym),
      avgOverall: s.ratedCount > 0 ? s.avgOverall : null,
      electronicRate: s.electronicRate,
    };
  });
}

export function getDispatcherTop5(
  orders: Order[],
  supplements: SupplementOrder[],
  dispatcherNames: string[] | null,
  staffRecords: Parameters<typeof getDispatcherPerformanceRows>[3],
  period: PeriodSelection,
) {
  return getDispatcherPerformanceRows(
    orders,
    supplements,
    dispatcherNames,
    staffRecords ?? [],
    period,
  )
    .filter((r) => r.contributionScore > 0)
    .slice(0, 5);
}
