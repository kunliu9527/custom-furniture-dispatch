import type {
  DispatcherEvaluationRow,
  EvaluationMetricCell,
} from "./evaluation-stats";

export type RankBadge = "red" | "purple";

export interface MetricDualRank {
  countPlace: number | null;
  amountPlace: number | null;
}

export interface AggregateRowRankNumbers {
  total: MetricDualRank;
  notOrdered: MetricDualRank;
  ordered: MetricDualRank;
  pendingRefundFilled: boolean;
  confirmedRefundFilled: boolean;
  /** @deprecated */
  refundedFilled: boolean;
}

export interface DesignerExtendedRankNumbers {
  orderConversionRatePlace: number | null;
  averageOrderAmountPlace: number | null;
  afterSalesAmountPlace: number | null;
}

function rankByCountToPlace(
  dataRows: DispatcherEvaluationRow[],
  getCell: (row: DispatcherEvaluationRow) => EvaluationMetricCell,
): Map<string, number> {
  const places = new Map<string, number>();
  const sorted = [...dataRows].sort((a, b) => {
    const ca = getCell(a);
    const cb = getCell(b);
    if (cb.count !== ca.count) return cb.count - ca.count;
    return cb.amount - ca.amount;
  });

  let place = 0;
  let lastCount = -1;
  for (const row of sorted) {
    const count = getCell(row).count;
    if (count <= 0) continue;
    if (count !== lastCount) {
      place += 1;
      lastCount = count;
    }
    places.set(row.key, place);
  }

  return places;
}

function rankByAmountToPlace(
  dataRows: DispatcherEvaluationRow[],
  getCell: (row: DispatcherEvaluationRow) => EvaluationMetricCell,
): Map<string, number> {
  const places = new Map<string, number>();
  const sorted = [...dataRows].sort((a, b) => {
    const ca = getCell(a);
    const cb = getCell(b);
    if (cb.amount !== ca.amount) return cb.amount - ca.amount;
    return cb.count - ca.count;
  });

  let place = 0;
  let lastAmount = -1;
  for (const row of sorted) {
    const amount = getCell(row).amount;
    if (amount <= 0) continue;
    if (amount !== lastAmount) {
      place += 1;
      lastAmount = amount;
    }
    places.set(row.key, place);
  }

  return places;
}

function buildDualRank(
  countPlaces: Map<string, number>,
  amountPlaces: Map<string, number>,
  key: string,
): MetricDualRank {
  return {
    countPlace: countPlaces.get(key) ?? null,
    amountPlace: amountPlaces.get(key) ?? null,
  };
}

export function rankBadgeForPlace(place: number | null): RankBadge | null {
  if (place === 1) return "red";
  if (place === 2) return "purple";
  return null;
}

/** 按归总各列的「数」「金额」分别得出名次（退单不参与排名） */
export function computeAggregateRowRankNumbers(
  rows: DispatcherEvaluationRow[],
): Map<string, AggregateRowRankNumbers> {
  const dataRows = rows.filter((row) => !row.isWorkflowSummary);
  const totalCell = (row: DispatcherEvaluationRow) => ({
    count: row.total,
    amount: row.totalAmount,
  });

  const totalCountPlaces = rankByCountToPlace(dataRows, totalCell);
  const totalAmountPlaces = rankByAmountToPlace(dataRows, totalCell);

  const notOrderedCountPlaces = rankByCountToPlace(
    dataRows,
    (row) => row.notOrdered,
  );
  const notOrderedAmountPlaces = rankByAmountToPlace(
    dataRows,
    (row) => row.notOrdered,
  );

  const orderedCountPlaces = rankByCountToPlace(dataRows, (row) => row.ordered);
  const orderedAmountPlaces = rankByAmountToPlace(dataRows, (row) => row.ordered);

  const marks = new Map<string, AggregateRowRankNumbers>();
  for (const row of dataRows) {
    const pending = row.pendingRefund;
    const confirmed = row.confirmedRefund;
    marks.set(row.key, {
      total: buildDualRank(totalCountPlaces, totalAmountPlaces, row.key),
      notOrdered: buildDualRank(
        notOrderedCountPlaces,
        notOrderedAmountPlaces,
        row.key,
      ),
      ordered: buildDualRank(orderedCountPlaces, orderedAmountPlaces, row.key),
      pendingRefundFilled: pending.count > 0 || pending.amount > 0,
      confirmedRefundFilled: confirmed.count > 0 || confirmed.amount > 0,
      refundedFilled:
        pending.count > 0 ||
        pending.amount > 0 ||
        confirmed.count > 0 ||
        confirmed.amount > 0,
    });
  }
  return marks;
}

function rankScalarDescending(
  dataRows: DispatcherEvaluationRow[],
  getValue: (row: DispatcherEvaluationRow) => number | null,
): Map<string, number> {
  const places = new Map<string, number>();
  const sorted = [...dataRows].sort((a, b) => {
    const va = getValue(a) ?? -Infinity;
    const vb = getValue(b) ?? -Infinity;
    return vb - va;
  });

  let place = 0;
  let lastValue = -Infinity;
  for (const row of sorted) {
    const value = getValue(row);
    if (value == null || value <= 0) continue;
    if (value !== lastValue) {
      place += 1;
      lastValue = value;
    }
    places.set(row.key, place);
  }

  return places;
}

/** 设计师扩展指标：转化率 / 平均下单额 / 售后金额 名次（值越高名次越前） */
export function computeDesignerExtendedRankNumbers(
  rows: DispatcherEvaluationRow[],
): Map<string, DesignerExtendedRankNumbers> {
  const dataRows = rows.filter((row) => !row.isWorkflowSummary);

  const conversionPlaces = rankScalarDescending(
    dataRows,
    (row) => row.orderConversionRate,
  );
  const averagePlaces = rankScalarDescending(
    dataRows,
    (row) => row.averageOrderAmount,
  );
  const afterSalesPlaces = rankScalarDescending(dataRows, (row) =>
    row.afterSalesAmount > 0 ? row.afterSalesAmount : null,
  );

  const marks = new Map<string, DesignerExtendedRankNumbers>();
  for (const row of dataRows) {
    marks.set(row.key, {
      orderConversionRatePlace: conversionPlaces.get(row.key) ?? null,
      averageOrderAmountPlace: averagePlaces.get(row.key) ?? null,
      afterSalesAmountPlace: afterSalesPlaces.get(row.key) ?? null,
    });
  }
  return marks;
}

/** 排名表行序：按合计金额名次升序（无名次置后） */
export function sortRowsByTotalAmountRank(
  dataRows: DispatcherEvaluationRow[],
  rankNumbers: Map<string, AggregateRowRankNumbers>,
): DispatcherEvaluationRow[] {
  return [...dataRows].sort((a, b) => {
    const aPlace = rankNumbers.get(a.key)?.total.amountPlace;
    const bPlace = rankNumbers.get(b.key)?.total.amountPlace;
    const aRank = aPlace ?? Number.MAX_SAFE_INTEGER;
    const bRank = bPlace ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    if (b.totalAmount !== a.totalAmount) return b.totalAmount - a.totalAmount;
    return a.label.localeCompare(b.label, "zh-CN");
  });
}

export function filterRankingDisplayRows(
  rows: DispatcherEvaluationRow[],
  scopeKeys: string[] | null,
): DispatcherEvaluationRow[] {
  const data = rows.filter((row) => !row.isWorkflowSummary);
  if (scopeKeys === null) return data;
  const allowed = new Set(scopeKeys);
  return data.filter((row) => allowed.has(row.key));
}

export interface RankingPresentationOptions {
  rankAgainstRows?: DispatcherEvaluationRow[];
  designerExtended?: boolean;
}

export interface RankingPresentation {
  rankNumbers: Map<string, AggregateRowRankNumbers>;
  extendedRanks: Map<string, DesignerExtendedRankNumbers> | null;
  sortedRows: DispatcherEvaluationRow[];
}

/** 展示行 + 可选全量名次源 → 排名表所需数据 */
export function buildRankingPresentation(
  displayRows: DispatcherEvaluationRow[],
  options: RankingPresentationOptions = {},
): RankingPresentation {
  const rankSource = options.rankAgainstRows ?? displayRows;
  const rankNumbers = computeAggregateRowRankNumbers(rankSource);
  const extendedRanks = options.designerExtended
    ? computeDesignerExtendedRankNumbers(rankSource)
    : null;
  const dataRows = displayRows.filter((row) => !row.isWorkflowSummary);
  const sortedRows = sortRowsByTotalAmountRank(dataRows, rankNumbers);
  return { rankNumbers, extendedRanks, sortedRows };
}
