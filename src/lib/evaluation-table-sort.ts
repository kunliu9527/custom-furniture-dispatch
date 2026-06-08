import type {
  AggregateRowRankNumbers,
  DesignerExtendedRankNumbers,
  MetricDualRank,
} from "./evaluation-ranking";
import type {
  DispatcherEvaluationRow,
  EvaluationMetricCell,
  WorkflowEvaluationRow,
} from "./evaluation-stats";
import type { DesignerPerformanceRow } from "./designer-performance";
import type { DispatcherPerformanceRow } from "./dispatcher-performance";
import type { AcceptanceStoreRow } from "./acceptance-evaluation-stats";
import type { OrderStatus } from "./types";
import {
  compareNullableNumbers,
  compareNumbers,
  compareRankPlace,
  compareStrings,
  type SortDirection,
  type TableSortState,
} from "./table-sort";

export type AggregateSortColumn =
  | "label"
  | "total"
  | "notOrdered"
  | "ordered"
  | "pendingRefund"
  | "confirmedRefund"
  | "conversion"
  | "average"
  | "afterSales";

export type WorkflowSortColumn = "label" | "total" | OrderStatus;

export type RankingSortColumn =
  | "label"
  | "totalRank"
  | "notOrderedRank"
  | "orderedRank"
  | "conversionRank"
  | "averageRank"
  | "afterSalesRank"
  | "pendingRefund"
  | "confirmedRefund";

export type DesignerPerformanceSortColumn =
  | "label"
  | "inProgressCount"
  | "orderedCount"
  | "orderedAmount"
  | "orderConversionRate"
  | "avgDrawDays"
  | "avgTotalDays"
  | "timeoutCount"
  | "transfer"
  | "activityTotal"
  | "activityAdvances"
  | "contributionScore";

export type DispatcherPerformanceSortColumn =
  | "label"
  | "contributionScore"
  | "depositTotal"
  | "signedContractAmount"
  | "orderedAmount"
  | "preMeasureDepositCount"
  | "signTimeoutCount";

export type AcceptanceStoreSortColumn =
  | "label"
  | "ratedCount"
  | "pendingCount"
  | "avgOverall"
  | "electronicRate";

export function defaultAggregateSortDirection(
  column: AggregateSortColumn,
): SortDirection {
  return column === "label" ? "asc" : "desc";
}

export function defaultWorkflowSortDirection(
  column: WorkflowSortColumn,
): SortDirection {
  return column === "label" ? "asc" : "desc";
}

export function defaultRankingSortDirection(
  column: RankingSortColumn,
): SortDirection {
  if (column === "label") return "asc";
  if (column === "pendingRefund" || column === "confirmedRefund") return "desc";
  return "asc";
}

export function defaultDesignerPerformanceSortDirection(
  column: DesignerPerformanceSortColumn,
): SortDirection {
  if (column === "label") return "asc";
  if (
    column === "avgDrawDays" ||
    column === "avgTotalDays" ||
    column === "timeoutCount" ||
    column === "transfer"
  ) {
    return "asc";
  }
  return "desc";
}

export function defaultDispatcherPerformanceSortDirection(
  column: DispatcherPerformanceSortColumn,
): SortDirection {
  if (column === "label") return "asc";
  if (column === "signTimeoutCount") return "asc";
  return "desc";
}

export function defaultAcceptanceStoreSortDirection(
  column: AcceptanceStoreSortColumn,
): SortDirection {
  return column === "label" ? "asc" : "desc";
}

/** 笔数/金额双指标列：优先按金额，其次按笔数 */
function compareMetricCell(
  a: EvaluationMetricCell,
  b: EvaluationMetricCell,
  direction: SortDirection,
): number {
  const amountCmp = compareNumbers(a.amount, b.amount, direction);
  if (amountCmp !== 0) return amountCmp;
  return compareNumbers(a.count, b.count, direction);
}

function compareDualRankByAmount(
  a: MetricDualRank,
  b: MetricDualRank,
  direction: SortDirection,
): number {
  const amountCmp = compareRankPlace(a.amountPlace, b.amountPlace, direction);
  if (amountCmp !== 0) return amountCmp;
  return compareRankPlace(a.countPlace, b.countPlace, direction);
}

function sortCopy<T>(
  rows: T[],
  compare: (a: T, b: T) => number,
): T[] {
  return [...rows].sort(compare);
}

export function sortDispatcherEvaluationDataRows(
  rows: DispatcherEvaluationRow[],
  sort: TableSortState<AggregateSortColumn>,
): DispatcherEvaluationRow[] {
  if (!sort.column) return rows;

  return sortCopy(rows, (a, b) => {
    switch (sort.column) {
      case "label":
        return compareStrings(a.label, b.label, sort.direction);
      case "total":
        return compareNumbers(a.totalAmount, b.totalAmount, sort.direction) ||
          compareNumbers(a.total, b.total, sort.direction);
      case "notOrdered":
        return compareMetricCell(a.notOrdered, b.notOrdered, sort.direction);
      case "ordered":
        return compareMetricCell(a.ordered, b.ordered, sort.direction);
      case "pendingRefund":
        return compareMetricCell(
          a.pendingRefund,
          b.pendingRefund,
          sort.direction,
        );
      case "confirmedRefund":
        return compareMetricCell(
          a.confirmedRefund,
          b.confirmedRefund,
          sort.direction,
        );
      case "conversion":
        return compareNullableNumbers(
          a.orderConversionRate,
          b.orderConversionRate,
          sort.direction,
        );
      case "average":
        return compareNullableNumbers(
          a.averageOrderAmount,
          b.averageOrderAmount,
          sort.direction,
        );
      case "afterSales":
        return compareNumbers(
          a.afterSalesAmount,
          b.afterSalesAmount,
          sort.direction,
        );
      default:
        return 0;
    }
  });
}

export function sortWorkflowDataRows(
  rows: WorkflowEvaluationRow[],
  sort: TableSortState<WorkflowSortColumn>,
): WorkflowEvaluationRow[] {
  if (!sort.column) return rows;

  return sortCopy(rows, (a, b) => {
    if (sort.column === "label") {
      return compareStrings(a.label, b.label, sort.direction);
    }
    if (sort.column === "total") {
      return (
        compareNumbers(a.totalAmount, b.totalAmount, sort.direction) ||
        compareNumbers(a.total, b.total, sort.direction)
      );
    }
    const status = sort.column as OrderStatus;
    return (
      compareNumbers(
        a.byStatusAmount[status],
        b.byStatusAmount[status],
        sort.direction,
      ) ||
      compareNumbers(a.byStatus[status], b.byStatus[status], sort.direction)
    );
  });
}

export function sortRankingDisplayRows(
  rows: DispatcherEvaluationRow[],
  sort: TableSortState<RankingSortColumn>,
  rankNumbers: Map<string, AggregateRowRankNumbers>,
  extendedRanks: Map<string, DesignerExtendedRankNumbers> | null,
): DispatcherEvaluationRow[] {
  if (!sort.column) return rows;

  return sortCopy(rows, (a, b) => {
    const ranksA = rankNumbers.get(a.key);
    const ranksB = rankNumbers.get(b.key);
    const extendedA = extendedRanks?.get(a.key);
    const extendedB = extendedRanks?.get(b.key);

    switch (sort.column) {
      case "label":
        return compareStrings(a.label, b.label, sort.direction);
      case "totalRank":
        return compareDualRankByAmount(
          ranksA?.total ?? { countPlace: null, amountPlace: null },
          ranksB?.total ?? { countPlace: null, amountPlace: null },
          sort.direction,
        );
      case "notOrderedRank":
        return compareDualRankByAmount(
          ranksA?.notOrdered ?? { countPlace: null, amountPlace: null },
          ranksB?.notOrdered ?? { countPlace: null, amountPlace: null },
          sort.direction,
        );
      case "orderedRank":
        return compareDualRankByAmount(
          ranksA?.ordered ?? { countPlace: null, amountPlace: null },
          ranksB?.ordered ?? { countPlace: null, amountPlace: null },
          sort.direction,
        );
      case "conversionRank":
        return compareRankPlace(
          extendedA?.orderConversionRatePlace,
          extendedB?.orderConversionRatePlace,
          sort.direction,
        );
      case "averageRank":
        return compareRankPlace(
          extendedA?.averageOrderAmountPlace,
          extendedB?.averageOrderAmountPlace,
          sort.direction,
        );
      case "afterSalesRank":
        return compareRankPlace(
          extendedA?.afterSalesAmountPlace,
          extendedB?.afterSalesAmountPlace,
          sort.direction,
        );
      case "pendingRefund":
        return compareMetricCell(a.pendingRefund, b.pendingRefund, sort.direction);
      case "confirmedRefund":
        return compareMetricCell(
          a.confirmedRefund,
          b.confirmedRefund,
          sort.direction,
        );
      default:
        return 0;
    }
  });
}

export function sortDesignerPerformanceRowsByColumn(
  rows: DesignerPerformanceRow[],
  sort: TableSortState<DesignerPerformanceSortColumn>,
): DesignerPerformanceRow[] {
  if (!sort.column) return rows;

  return sortCopy(rows, (a, b) => {
    switch (sort.column) {
      case "label":
        return compareStrings(a.label, b.label, sort.direction);
      case "inProgressCount":
        return compareNumbers(a.inProgressCount, b.inProgressCount, sort.direction);
      case "orderedCount":
        return (
          compareNumbers(a.orderedAmount, b.orderedAmount, sort.direction) ||
          compareNumbers(a.orderedCount, b.orderedCount, sort.direction)
        );
      case "orderedAmount":
        return compareNumbers(a.orderedAmount, b.orderedAmount, sort.direction);
      case "orderConversionRate":
        return compareNullableNumbers(
          a.orderConversionRate,
          b.orderConversionRate,
          sort.direction,
        );
      case "avgDrawDays":
        return compareNullableNumbers(a.avgDrawDays, b.avgDrawDays, sort.direction);
      case "avgTotalDays":
        return compareNullableNumbers(a.avgTotalDays, b.avgTotalDays, sort.direction);
      case "timeoutCount":
        return compareNumbers(a.timeoutCount, b.timeoutCount, sort.direction);
      case "transfer": {
        const totalA = a.transferOut + a.transferIn;
        const totalB = b.transferOut + b.transferIn;
        return compareNumbers(totalA, totalB, sort.direction);
      }
      case "activityTotal":
        return compareNumbers(a.activityTotal, b.activityTotal, sort.direction);
      case "activityAdvances":
        return compareNumbers(
          a.activityAdvances,
          b.activityAdvances,
          sort.direction,
        );
      case "contributionScore":
        return compareNumbers(
          a.contributionScore,
          b.contributionScore,
          sort.direction,
        );
      default:
        return 0;
    }
  });
}

export function sortDispatcherPerformanceRowsByColumn(
  rows: DispatcherPerformanceRow[],
  sort: TableSortState<DispatcherPerformanceSortColumn>,
): DispatcherPerformanceRow[] {
  if (!sort.column) return rows;

  return sortCopy(rows, (a, b) => {
    switch (sort.column) {
      case "label":
        return compareStrings(a.label, b.label, sort.direction);
      case "contributionScore":
        return compareNumbers(
          a.contributionScore,
          b.contributionScore,
          sort.direction,
        );
      case "depositTotal":
        return compareNumbers(a.depositTotal, b.depositTotal, sort.direction);
      case "signedContractAmount":
        return compareNumbers(
          a.signedContractAmount,
          b.signedContractAmount,
          sort.direction,
        );
      case "orderedAmount":
        return compareNumbers(a.orderedAmount, b.orderedAmount, sort.direction);
      case "preMeasureDepositCount":
        return compareNumbers(
          a.preMeasureDepositCount,
          b.preMeasureDepositCount,
          sort.direction,
        );
      case "signTimeoutCount":
        return compareNumbers(
          a.signTimeoutCount,
          b.signTimeoutCount,
          sort.direction,
        );
      default:
        return 0;
    }
  });
}

export function sortAcceptanceStoreRows(
  rows: AcceptanceStoreRow[],
  sort: TableSortState<AcceptanceStoreSortColumn>,
): AcceptanceStoreRow[] {
  if (!sort.column) return rows;

  return sortCopy(rows, (a, b) => {
    switch (sort.column) {
      case "label":
        return compareStrings(a.label, b.label, sort.direction);
      case "ratedCount":
        return compareNumbers(a.ratedCount, b.ratedCount, sort.direction);
      case "pendingCount":
        return compareNumbers(a.pendingCount, b.pendingCount, sort.direction);
      case "avgOverall":
        return compareNumbers(a.avgOverall, b.avgOverall, sort.direction);
      case "electronicRate":
        return compareNumbers(a.electronicRate, b.electronicRate, sort.direction);
      default:
        return 0;
    }
  });
}
