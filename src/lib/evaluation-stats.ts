import { normalizeDispatcherName } from "./admin-stats";
import { ORDER_STATUSES } from "./constants";
import { formatDispatchMoney } from "./dispatch-totals";
import { DISPATCHER_ROSTER, getDispatcherHomeStore } from "./dispatchers";
import { orderBelongsToStoreSummary } from "./dispatchers";
import { DESIGNER_ROSTER } from "./designers";
import { createEmptyStatusCounts } from "./manager-stats";
import { isRefundStatus } from "./order-utils";
import { sumSupplementAmount } from "./supplement-utils";
import { STORES } from "./designers";
import type { Order, OrderStatus, StoreName, SupplementOrder } from "./types";

export type EvaluationViewMode = "dispatcher" | "designer" | "store";

export interface EvaluationMetricCell {
  count: number;
  amount: number;
}

export interface EvaluationTabSummary {
  count: number;
  amount: number;
}

/** 派单人：未下单 / 已下单 / 已退单 三类金额 */
export interface DispatcherEvaluationRow {
  key: string;
  label: string;
  subtitle?: string;
  total: number;
  totalAmount: number;
  notOrdered: EvaluationMetricCell;
  ordered: EvaluationMetricCell;
  refunded: EvaluationMetricCell;
  /** 已下单金额 ÷ 合计金额（百分比，0–100） */
  orderConversionRate: number | null;
  /** 已下单金额 ÷ 已下单数量 */
  averageOrderAmount: number | null;
  /** 售后金合计 */
  afterSalesAmount: number;
  isWorkflowSummary?: boolean;
}

/** 设计师 / 门店：按流程状态 */
export interface WorkflowEvaluationRow {
  key: string;
  label: string;
  subtitle?: string;
  total: number;
  totalAmount: number;
  byStatus: Record<OrderStatus, number>;
  byStatusAmount: Record<OrderStatus, number>;
  isWorkflowSummary?: boolean;
}

function createEmptyStatusAmounts(): Record<OrderStatus, number> {
  return ORDER_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<OrderStatus, number>,
  );
}

function emptyMetricCell(): EvaluationMetricCell {
  return { count: 0, amount: 0 };
}

function addMetricCell(
  target: EvaluationMetricCell,
  count: number,
  amount: number,
): void {
  target.count += count;
  target.amount += amount;
}

export function formatEvaluationMetric(
  count: number,
  amount: number,
): string {
  if (count <= 0 && amount <= 0) return "—";
  const countText = count > 0 ? String(count) : "0";
  const amountText = amount > 0 ? formatDispatchMoney(amount) : "¥0";
  return `${countText} / ${amountText}`;
}

export function formatOrderConversionRate(rate: number | null): string {
  if (rate == null || !Number.isFinite(rate)) return "—";
  return `${rate.toFixed(1)}%`;
}

export function formatAverageOrderAmount(amount: number | null): string {
  if (amount == null || amount <= 0) return "—";
  return formatDispatchMoney(amount);
}

export function formatAfterSalesTotal(amount: number): string {
  if (amount <= 0) return "—";
  return formatDispatchMoney(amount);
}

function isOrderReachedPlaced(order: Order): boolean {
  return order.status === "已下单" || order.status === "已安装";
}

/** 派单人定单三类金额拆分 */
export function classifyDispatcherOrder(
  order: Order,
  supplements: SupplementOrder[],
): {
  notOrdered: EvaluationMetricCell;
  ordered: EvaluationMetricCell;
  refunded: EvaluationMetricCell;
} {
  const supplementTotal = sumSupplementAmount(supplements, order.id);
  const notOrdered = emptyMetricCell();
  const ordered = emptyMetricCell();
  const refunded = emptyMetricCell();

  if (order.status === "已退单") {
    const main =
      order.orderAmount != null && order.orderAmount > 0
        ? order.orderAmount
        : order.budget > 0
          ? order.budget
          : 0;
    addMetricCell(refunded, 1, main + supplementTotal);
    return { notOrdered, ordered, refunded };
  }

  if (isOrderReachedPlaced(order)) {
    const main =
      order.orderAmount != null && order.orderAmount > 0
        ? order.orderAmount
        : 0;
    addMetricCell(ordered, 1, main + supplementTotal);
    return { notOrdered, ordered, refunded };
  }

  const budget = order.budget > 0 ? order.budget : 0;
  addMetricCell(notOrdered, 1, budget);
  return { notOrdered, ordered, refunded };
}

function aggregateDispatcherOrders(
  orders: Order[],
  supplements: SupplementOrder[],
): Omit<
  DispatcherEvaluationRow,
  "key" | "label" | "subtitle" | "isWorkflowSummary"
> {
  const notOrdered = emptyMetricCell();
  const ordered = emptyMetricCell();
  const refunded = emptyMetricCell();

  let afterSalesTotal = 0;

  for (const order of orders) {
    const parts = classifyDispatcherOrder(order, supplements);
    addMetricCell(notOrdered, parts.notOrdered.count, parts.notOrdered.amount);
    addMetricCell(ordered, parts.ordered.count, parts.ordered.amount);
    addMetricCell(refunded, parts.refunded.count, parts.refunded.amount);
    if (order.afterSalesAmount != null && order.afterSalesAmount > 0) {
      afterSalesTotal += order.afterSalesAmount;
    }
  }

  const totalAmount =
    notOrdered.amount + ordered.amount + refunded.amount;

  const orderConversionRate =
    totalAmount > 0 ? (ordered.amount / totalAmount) * 100 : null;
  const averageOrderAmount =
    ordered.count > 0 ? ordered.amount / ordered.count : null;

  return {
    total: orders.length,
    totalAmount,
    notOrdered,
    ordered,
    refunded,
    orderConversionRate,
    averageOrderAmount,
    afterSalesAmount: afterSalesTotal,
  };
}

function buildDispatcherRow(
  key: string,
  label: string,
  orders: Order[],
  supplements: SupplementOrder[],
  subtitle?: string,
): DispatcherEvaluationRow {
  return {
    key,
    label,
    subtitle,
    ...aggregateDispatcherOrders(orders, supplements),
  };
}

function buildDispatcherWorkflowRow(
  orders: Order[],
  supplements: SupplementOrder[],
): DispatcherEvaluationRow {
  return {
    key: "workflow-summary",
    label: "流程累计",
    isWorkflowSummary: true,
    ...aggregateDispatcherOrders(orders, supplements),
  };
}

export function getDispatcherEvaluationRows(
  orders: Order[],
  supplements: SupplementOrder[],
  nameFilter: string[] | null = null,
): DispatcherEvaluationRow[] {
  const allowedNames = nameFilter ? new Set(nameFilter) : null;
  const seen = new Set<string>();
  const dataRows: DispatcherEvaluationRow[] = [];

  for (const profile of DISPATCHER_ROSTER) {
    if (allowedNames && !allowedNames.has(profile.name)) continue;
    seen.add(profile.name);
    const personOrders = orders.filter(
      (o) => normalizeDispatcherName(o.dispatcherName) === profile.name,
    );
    dataRows.push(
      buildDispatcherRow(
        profile.name,
        profile.name,
        personOrders,
        supplements,
        profile.homeStore,
      ),
    );
  }

  const extraNames = new Set<string>();
  for (const order of orders) {
    const name = normalizeDispatcherName(order.dispatcherName);
    if (!seen.has(name)) extraNames.add(name);
  }

  for (const name of extraNames) {
    if (allowedNames && !allowedNames.has(name)) continue;
    const personOrders = orders.filter(
      (o) => normalizeDispatcherName(o.dispatcherName) === name,
    );
    dataRows.push(
      buildDispatcherRow(name, name, personOrders, supplements, "其他"),
    );
  }

  const sorted = dataRows.sort(
    (a, b) => b.total - a.total || a.label.localeCompare(b.label, "zh-CN"),
  );

  if (orders.length === 0) return sorted;
  return [...sorted, buildDispatcherWorkflowRow(orders, supplements)];
}

/** 设计师：按订单 designer 字段归集未下单 / 已下单 / 已退单（口径同派单人归总） */
export function getDesignerAmountRows(
  orders: Order[],
  supplements: SupplementOrder[],
  nameFilter: string[] | null = null,
  resolveSubtitle?: (name: string) => string | undefined,
): DispatcherEvaluationRow[] {
  const allowedNames = nameFilter ? new Set(nameFilter) : null;
  const rosterNames = new Set<string>(DESIGNER_ROSTER.map((d) => d.name));
  const seen = new Set<string>();
  const dataRows: DispatcherEvaluationRow[] = [];

  for (const profile of DESIGNER_ROSTER) {
    if (allowedNames && !allowedNames.has(profile.name)) continue;
    seen.add(profile.name);
    const personOrders = orders.filter((o) => o.designer === profile.name);
    dataRows.push(
      buildDispatcherRow(
        profile.name,
        profile.name,
        personOrders,
        supplements,
        resolveSubtitle?.(profile.name) ?? profile.homeStore,
      ),
    );
  }

  const extraNames = new Set<string>();
  for (const order of orders) {
    if (!seen.has(order.designer)) extraNames.add(order.designer);
  }

  for (const name of extraNames) {
    if (allowedNames && !allowedNames.has(name)) continue;
    const personOrders = orders.filter((o) => o.designer === name);
    dataRows.push(
      buildDispatcherRow(
        name,
        name,
        personOrders,
        supplements,
        resolveSubtitle?.(name) ??
          (rosterNames.has(name) ? undefined : "其他"),
      ),
    );
  }

  const sorted = dataRows.sort(
    (a, b) => b.total - a.total || a.label.localeCompare(b.label, "zh-CN"),
  );

  if (orders.length === 0) return sorted;
  return [...sorted, buildDispatcherWorkflowRow(orders, supplements)];
}

export function getDispatcherTabSummary(
  rows: DispatcherEvaluationRow[],
): EvaluationTabSummary {
  const workflow = rows.find((row) => row.isWorkflowSummary);
  if (workflow) {
    return { count: workflow.total, amount: workflow.totalAmount };
  }
  return { count: 0, amount: 0 };
}

function getOrderWorkflowAmount(
  order: Order,
  supplements: SupplementOrder[],
): number {
  const supplementTotal = sumSupplementAmount(supplements, order.id);
  if (isRefundStatus(order.status)) {
    const main =
      order.orderAmount != null && order.orderAmount > 0
        ? order.orderAmount
        : order.budget > 0
          ? order.budget
          : 0;
    return main + supplementTotal;
  }
  if (isOrderReachedPlaced(order)) {
    const main =
      order.orderAmount != null && order.orderAmount > 0
        ? order.orderAmount
        : 0;
    return main + supplementTotal;
  }
  return order.budget > 0 ? order.budget : 0;
}

function aggregateWorkflowOrders(
  orders: Order[],
  supplements: SupplementOrder[],
): Pick<
  WorkflowEvaluationRow,
  "total" | "totalAmount" | "byStatus" | "byStatusAmount"
> {
  const byStatus = createEmptyStatusCounts();
  const byStatusAmount = createEmptyStatusAmounts();
  let totalAmount = 0;

  for (const order of orders) {
    byStatus[order.status] += 1;
    const amount = getOrderWorkflowAmount(order, supplements);
    byStatusAmount[order.status] += amount;
    totalAmount += amount;
  }

  return {
    total: orders.length,
    totalAmount,
    byStatus,
    byStatusAmount,
  };
}

function buildWorkflowRow(
  key: string,
  label: string,
  orders: Order[],
  supplements: SupplementOrder[],
  subtitle?: string,
): WorkflowEvaluationRow {
  return {
    key,
    label,
    subtitle,
    ...aggregateWorkflowOrders(orders, supplements),
  };
}

function buildWorkflowSummaryRow(
  orders: Order[],
  supplements: SupplementOrder[],
): WorkflowEvaluationRow {
  return {
    key: "workflow-summary",
    label: "流程累计",
    isWorkflowSummary: true,
    ...aggregateWorkflowOrders(orders, supplements),
  };
}

function appendWorkflowSummary(
  rows: WorkflowEvaluationRow[],
  orders: Order[],
  supplements: SupplementOrder[],
): WorkflowEvaluationRow[] {
  if (orders.length === 0) return rows;
  return [...rows, buildWorkflowSummaryRow(orders, supplements)];
}

/** 设计师：仅按订单 designer 字段归集 */
export function getDesignerEvaluationRows(
  orders: Order[],
  supplements: SupplementOrder[],
  nameFilter: string[] | null = null,
  resolveSubtitle?: (name: string) => string | undefined,
): WorkflowEvaluationRow[] {
  const rosterNames = new Set<string>(DESIGNER_ROSTER.map((d) => d.name));
  const targetNames = new Set<string>();

  if (nameFilter?.length) {
    for (const name of nameFilter) targetNames.add(name);
  } else {
    for (const d of DESIGNER_ROSTER) targetNames.add(d.name);
    for (const order of orders) {
      if (!rosterNames.has(order.designer)) {
        targetNames.add(order.designer);
      }
    }
  }

  const dataRows: WorkflowEvaluationRow[] = [];
  for (const name of targetNames) {
    const personOrders = orders.filter((o) => o.designer === name);
    const rosterProfile = DESIGNER_ROSTER.find((d) => d.name === name);
    dataRows.push(
      buildWorkflowRow(
        name,
        name,
        personOrders,
        supplements,
        resolveSubtitle?.(name) ??
          rosterProfile?.homeStore ??
          (rosterNames.has(name) ? undefined : "其他"),
      ),
    );
  }

  const sorted = dataRows.sort(
    (a, b) => b.total - a.total || a.label.localeCompare(b.label, "zh-CN"),
  );

  return appendWorkflowSummary(sorted, orders, supplements);
}

/** 门店：派单门店或派单人所属门店 */
export function getStoreEvaluationRows(
  orders: Order[],
  supplements: SupplementOrder[],
  storeFilter: StoreName[] | null = null,
): WorkflowEvaluationRow[] {
  const stores = storeFilter?.length ? storeFilter : [...STORES];
  const dataRows = stores.map((store) => {
    const storeOrders = orders.filter((o) =>
      orderBelongsToStoreSummary(o, store),
    );
    return buildWorkflowRow(store, store, storeOrders, supplements);
  });

  const sorted = dataRows.sort(
    (a, b) => b.total - a.total || a.label.localeCompare(b.label, "zh-CN"),
  );

  return appendWorkflowSummary(sorted, orders, supplements);
}

/** 门店：按派单人所属门店汇总未下单 / 已下单 / 已退单金额 */
export function getStoreDispatcherAmountRows(
  orders: Order[],
  supplements: SupplementOrder[],
  storeFilter: StoreName[] | null = null,
): DispatcherEvaluationRow[] {
  const stores = storeFilter?.length ? storeFilter : [...STORES];
  const dataRows = stores.map((store) => {
    const storeOrders = orders.filter(
      (o) =>
        getDispatcherHomeStore(o.dispatcherName, o.dispatchStore) === store,
    );
    return buildDispatcherRow(store, store, storeOrders, supplements);
  });

  const sorted = dataRows.sort(
    (a, b) => b.total - a.total || a.label.localeCompare(b.label, "zh-CN"),
  );

  if (orders.length === 0) return sorted;
  return [...sorted, buildDispatcherWorkflowRow(orders, supplements)];
}

export function getWorkflowTabSummary(
  rows: WorkflowEvaluationRow[],
): EvaluationTabSummary {
  const workflow = rows.find((row) => row.isWorkflowSummary);
  if (workflow) {
    return { count: workflow.total, amount: workflow.totalAmount };
  }
  return { count: 0, amount: 0 };
}

export function getScopedTabSummary(
  orders: Order[],
  supplements: SupplementOrder[],
): EvaluationTabSummary {
  const agg = aggregateWorkflowOrders(orders, supplements);
  return { count: agg.total, amount: agg.totalAmount };
}
