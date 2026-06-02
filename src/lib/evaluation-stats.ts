import { normalizeDispatcherName } from "./admin-stats";
import { ORDER_STATUSES } from "./constants";
import { formatDispatchMoney } from "./dispatch-totals";
import {
  classifyOrderAmount,
  netNotOrderedCell,
  type OrderAmountMetricCell,
} from "./order-amount";
import {
  getDispatcherHomeStore,
  getEffectiveDispatcherRoster,
} from "./dispatchers";
import {
  orderBelongsToDispatcherStore,
  resolveDesignerDispatchStoreSubtitle,
} from "./order-store-attribution";
import { buildDesignerHomeStoreIndex } from "./designer-staff-store";
import { buildEffectiveDesignerRoster } from "./personnel-roster";
import type { StaffRecord } from "./staff-roster";
import { createEmptyStatusCounts } from "./manager-stats";
import { STORES } from "./designers";
import type { Order, OrderStatus, StoreName, SupplementOrder } from "./types";

export type EvaluationViewMode = "dispatcher" | "designer" | "store" | "acceptance";

export interface EvaluationMetricCell {
  count: number;
  amount: number;
}

/** 展示用未下单（已减已退单）；原始桶见 rawNotOrdered */
export interface NotOrderedDisplayCell extends EvaluationMetricCell {
  rawNotOrdered: EvaluationMetricCell;
}

export interface EvaluationTabSummary {
  count: number;
  amount: number;
  /** 覆盖默认「数量/金额」展示（如客户验收） */
  displayText?: string;
  metricHint?: string;
}

/** 派单人 / 门店 / 设计师：未下单 / 已下单 / 待退单 / 已退单 */
export interface DispatcherEvaluationRow {
  key: string;
  label: string;
  subtitle?: string;
  total: number;
  totalAmount: number;
  notOrdered: NotOrderedDisplayCell;
  ordered: EvaluationMetricCell;
  pendingRefund: EvaluationMetricCell;
  confirmedRefund: EvaluationMetricCell;
  /** @deprecated 使用 pendingRefund + confirmedRefund */
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

function toNotOrderedDisplay(
  raw: OrderAmountMetricCell,
  confirmedRefund: OrderAmountMetricCell,
): NotOrderedDisplayCell {
  const net = netNotOrderedCell(raw, confirmedRefund);
  return {
    count: net.count,
    amount: net.amount,
    rawNotOrdered: { ...raw },
  };
}

/** @deprecated 使用 classifyOrderAmount */
export function classifyDispatcherOrder(
  order: Order,
  supplements: SupplementOrder[],
): {
  notOrdered: EvaluationMetricCell;
  ordered: EvaluationMetricCell;
  pendingRefund: EvaluationMetricCell;
  confirmedRefund: EvaluationMetricCell;
  refunded: EvaluationMetricCell;
} {
  const parts = classifyOrderAmount(order, supplements);
  const refunded: EvaluationMetricCell = {
    count: parts.pendingRefund.count + parts.confirmedRefund.count,
    amount: parts.pendingRefund.amount + parts.confirmedRefund.amount,
  };
  return {
    notOrdered: parts.notOrdered,
    ordered: parts.ordered,
    pendingRefund: parts.pendingRefund,
    confirmedRefund: parts.confirmedRefund,
    refunded,
  };
}

function aggregateDispatcherOrders(
  orders: Order[],
  supplements: SupplementOrder[],
): Omit<
  DispatcherEvaluationRow,
  "key" | "label" | "subtitle" | "isWorkflowSummary"
> {
  const rawNotOrdered = emptyMetricCell();
  const ordered = emptyMetricCell();
  const pendingRefund = emptyMetricCell();
  const confirmedRefund = emptyMetricCell();

  let afterSalesTotal = 0;

  for (const order of orders) {
    const parts = classifyOrderAmount(order, supplements);
    addMetricCell(rawNotOrdered, parts.notOrdered.count, parts.notOrdered.amount);
    addMetricCell(ordered, parts.ordered.count, parts.ordered.amount);
    addMetricCell(
      pendingRefund,
      parts.pendingRefund.count,
      parts.pendingRefund.amount,
    );
    addMetricCell(
      confirmedRefund,
      parts.confirmedRefund.count,
      parts.confirmedRefund.amount,
    );
    if (order.afterSalesAmount != null && order.afterSalesAmount > 0) {
      afterSalesTotal += order.afterSalesAmount;
    }
  }

  const notOrdered = toNotOrderedDisplay(rawNotOrdered, confirmedRefund);
  const refunded: EvaluationMetricCell = {
    count: pendingRefund.count + confirmedRefund.count,
    amount: pendingRefund.amount + confirmedRefund.amount,
  };

  const totalAmount =
    rawNotOrdered.amount +
    ordered.amount +
    pendingRefund.amount +
    confirmedRefund.amount;

  const netPipeline =
    rawNotOrdered.amount +
    ordered.amount -
    pendingRefund.amount -
    confirmedRefund.amount;

  const orderConversionRate =
    netPipeline > 0 ? (ordered.amount / netPipeline) * 100 : null;
  const averageOrderAmount =
    ordered.count > 0 ? ordered.amount / ordered.count : null;

  return {
    total: orders.length,
    totalAmount,
    notOrdered,
    ordered,
    pendingRefund,
    confirmedRefund,
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
  staffRecords: StaffRecord[] = [],
): DispatcherEvaluationRow[] {
  const allowedNames = nameFilter ? new Set(nameFilter) : null;
  const seen = new Set<string>();
  const dataRows: DispatcherEvaluationRow[] = [];
  const roster = getEffectiveDispatcherRoster(staffRecords);

  for (const profile of roster) {
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

/** 派单人：按订单 dispatcherName 字段归集各流程状态 */
export function getDispatcherWorkflowRows(
  orders: Order[],
  supplements: SupplementOrder[],
  nameFilter: string[] | null = null,
  staffRecords: StaffRecord[] = [],
): WorkflowEvaluationRow[] {
  const allowedNames = nameFilter ? new Set(nameFilter) : null;
  const roster = getEffectiveDispatcherRoster(staffRecords);
  const rosterNames = new Set(roster.map((d) => d.name));
  const targetNames = new Set<string>();

  if (nameFilter?.length) {
    for (const name of nameFilter) targetNames.add(name);
  } else {
    for (const d of roster) targetNames.add(d.name);
    for (const order of orders) {
      const name = normalizeDispatcherName(order.dispatcherName);
      if (!name || rosterNames.has(name)) continue;
      targetNames.add(name);
    }
  }

  const dataRows: WorkflowEvaluationRow[] = [];
  for (const name of targetNames) {
    if (allowedNames && !allowedNames.has(name)) continue;
    const personOrders = orders.filter(
      (o) => normalizeDispatcherName(o.dispatcherName) === name,
    );
    const rosterProfile = roster.find((d) => d.name === name);
    dataRows.push(
      buildWorkflowRow(
        name,
        name,
        personOrders,
        supplements,
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

/** 设计师：按订单 designer 字段归集未下单 / 已下单 / 已退单（口径同派单人归总） */
export function getDesignerAmountRows(
  orders: Order[],
  supplements: SupplementOrder[],
  nameFilter: string[] | null = null,
  resolveSubtitle?: (name: string) => string | undefined,
  staffRecords: StaffRecord[] = [],
): DispatcherEvaluationRow[] {
  const allowedNames = nameFilter ? new Set(nameFilter) : null;
  const designerIndex = buildDesignerHomeStoreIndex(staffRecords);
  const roster = buildEffectiveDesignerRoster(staffRecords, designerIndex);
  const rosterNames = new Set<string>(roster.map((d) => d.name));
  const seen = new Set<string>();
  const dataRows: DispatcherEvaluationRow[] = [];

  for (const profile of roster) {
    if (allowedNames && !allowedNames.has(profile.name)) continue;
    seen.add(profile.name);
    const personOrders = orders.filter((o) => o.designer === profile.name);
    dataRows.push(
      buildDispatcherRow(
        profile.name,
        profile.name,
        personOrders,
        supplements,
        resolveSubtitle?.(profile.name) ??
          resolveDesignerDispatchStoreSubtitle(personOrders),
      ),
    );
  }

  const extraNames = new Set<string>();
  for (const order of orders) {
    if (!order.designer || seen.has(order.designer)) continue;
    extraNames.add(order.designer);
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
          resolveDesignerDispatchStoreSubtitle(personOrders) ??
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
  const parts = classifyOrderAmount(order, supplements);
  return (
    parts.notOrdered.amount +
    parts.ordered.amount +
    parts.pendingRefund.amount +
    parts.confirmedRefund.amount
  );
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
  staffRecords: StaffRecord[] = [],
): WorkflowEvaluationRow[] {
  const designerIndex = buildDesignerHomeStoreIndex(staffRecords);
  const roster = buildEffectiveDesignerRoster(staffRecords, designerIndex);
  const rosterNames = new Set<string>(roster.map((d) => d.name));
  const targetNames = new Set<string>();

  if (nameFilter?.length) {
    for (const name of nameFilter) targetNames.add(name);
  } else {
    for (const d of roster) targetNames.add(d.name);
    for (const order of orders) {
      if (!order.designer || rosterNames.has(order.designer)) continue;
      targetNames.add(order.designer);
    }
  }

  const dataRows: WorkflowEvaluationRow[] = [];
  for (const name of targetNames) {
    const personOrders = orders.filter((o) => o.designer === name);
    const rosterProfile = roster.find((d) => d.name === name);
    dataRows.push(
      buildWorkflowRow(
        name,
        name,
        personOrders,
        supplements,
        resolveSubtitle?.(name) ??
          resolveDesignerDispatchStoreSubtitle(personOrders) ??
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

/** 门店：按派单人所属门店（= 本店派单人之和） */
export function getStoreEvaluationRows(
  orders: Order[],
  supplements: SupplementOrder[],
  storeFilter: StoreName[] | null = null,
): WorkflowEvaluationRow[] {
  const stores = storeFilter?.length ? storeFilter : [...STORES];
  const dataRows = stores.map((store) => {
    const storeOrders = orders.filter((o) =>
      orderBelongsToDispatcherStore(o, store),
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
