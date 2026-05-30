import {
  buildFollowUpSnapshot,
  followUpAttentionPriority,
  followUpKindLabel,
  type FollowUpItem,
  type FollowUpKind,
} from "./follow-up";
import { isFollowUpAcked, loadFollowUpAcks } from "./follow-up-ack";
import {
  DESIGNER_ACCEPTANCE_HOURS,
} from "./designer-load";
import {
  buildPendingConfirmSnapshot,
  pendingConfirmKindLabel,
  PENDING_CONFIRM_GROUP_ORDER,
  type PendingConfirmKind,
  type PendingConfirmOrderItem,
} from "./pending-confirm";
import {
  followUpKindRequiresAck,
  isTransferredAcked,
} from "./anomaly-ack";
import { resolveOrderDisplayName } from "./order-remark";
import { getLatestTransferAt, hasBeenTransferred } from "./transfer-utils";
import { REPORT_THRESHOLDS } from "./report-thresholds";
import { getStatusEnteredAt } from "./stage-intervals";
import type { FlowOrderStatus, Order } from "./types";

const MS_HOUR = 3600000;
const MS_DAY = 86400000;

export interface AnomalyTodoLabel {
  key: string;
  label: string;
  source: "pending" | "followup" | "transfer";
  pendingKind?: PendingConfirmKind;
  followUpKind?: FollowUpKind;
  triggeredAt: number;
}

export interface AnomalyTodoOrderRow {
  orderId: string;
  customerName: string;
  designer: string;
  status: Order["status"];
  dispatchStore: Order["dispatchStore"];
  budget: number;
  labels: AnomalyTodoLabel[];
  /** 最新一条异常触发时间，用于排序 */
  sortTime: number;
}

export interface AnomalyTodoCapacityRow {
  type: "capacity";
  designer: string;
  label: string;
  hint: string;
}

export interface AnomalyTodosSnapshot {
  orderRows: AnomalyTodoOrderRow[];
  capacityRows: AnomalyTodoCapacityRow[];
  totalCount: number;
  summaryParts: string[];
}

function timestamp(iso: string): number {
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function triggeredAfter(iso: string, msOffset: number): number {
  return timestamp(iso) + msOffset;
}

function pendingKindPriority(kind: PendingConfirmKind): number {
  const index = PENDING_CONFIRM_GROUP_ORDER.indexOf(kind);
  return index >= 0 ? index : PENDING_CONFIRM_GROUP_ORDER.length;
}

function triggeredAtForPending(
  order: Order,
  item: PendingConfirmOrderItem,
): number {
  switch (item.kind) {
    case "designer-accept":
      if (item.isOverdue) {
        return triggeredAfter(
          order.createdAt,
          DESIGNER_ACCEPTANCE_HOURS * MS_HOUR,
        );
      }
      return timestamp(order.createdAt);
    case "undispatched":
      return timestamp(order.createdAt);
    case "pending-refund": {
      const from =
        getStatusEnteredAt(order, "待退单" as FlowOrderStatus) ??
        order.createdAt;
      return timestamp(from);
    }
    default:
      return timestamp(order.createdAt);
  }
}

function stageTimeoutTriggeredAt(order: Order, alert: string): number | null {
  const status = order.status as FlowOrderStatus;
  const entered = getStatusEnteredAt(order, status);
  if (!entered) return null;
  switch (alert) {
    case "量尺超时":
      return triggeredAfter(entered, 3 * MS_DAY);
    case "出图超时": {
      const days =
        order.budget > 200_000 ? 15 * MS_DAY : 9 * MS_DAY;
      return triggeredAfter(entered, days);
    }
    case "签约超时":
      return triggeredAfter(entered, 7 * MS_DAY);
    case "下单超时":
      return triggeredAfter(entered, 3 * MS_DAY);
    default:
      return timestamp(entered);
  }
}

function triggeredAtForFollowUp(order: Order, item: FollowUpItem): number {
  switch (item.kind) {
    case "accept-overdue":
      return triggeredAfter(
        order.createdAt,
        DESIGNER_ACCEPTANCE_HOURS * MS_HOUR,
      );
    case "undispatched-stale":
      return triggeredAfter(
        order.createdAt,
        REPORT_THRESHOLDS.undispatchedStaleDays * MS_DAY,
      );
    case "stage-timeout": {
      const stageAt = item.stageAlert
        ? stageTimeoutTriggeredAt(order, item.stageAlert)
        : null;
      if (stageAt != null) return stageAt;
      const entered = getStatusEnteredAt(order, order.status as FlowOrderStatus);
      return entered ? timestamp(entered) : timestamp(order.createdAt);
    }
    case "install-lag": {
      const from = getStatusEnteredAt(order, "已下单" as FlowOrderStatus);
      return from
        ? triggeredAfter(from, REPORT_THRESHOLDS.installLagDays * MS_DAY)
        : timestamp(order.createdAt);
    }
    case "acceptance-lag": {
      const from = getStatusEnteredAt(order, "已安装" as FlowOrderStatus);
      return from
        ? triggeredAfter(from, REPORT_THRESHOLDS.acceptanceLagDays * MS_DAY)
        : timestamp(order.createdAt);
    }
    case "refund-stale": {
      const from =
        getStatusEnteredAt(order, "待退单" as FlowOrderStatus) ??
        order.createdAt;
      return triggeredAfter(from, REPORT_THRESHOLDS.refundStaleDays * MS_DAY);
    }
    default:
      return timestamp(order.createdAt);
  }
}

function upsertOrderRow(
  map: Map<string, AnomalyTodoOrderRow>,
  order: Order,
  label: AnomalyTodoLabel,
): void {
  const existing = map.get(order.id);
  if (!existing) {
    map.set(order.id, {
      orderId: order.id,
      customerName: resolveOrderDisplayName(order),
      designer: order.designer ?? "—",
      status: order.status,
      dispatchStore: order.dispatchStore,
      budget: order.budget,
      labels: [label],
      sortTime: label.triggeredAt,
    });
    return;
  }
  if (existing.labels.some((l) => l.key === label.key)) return;
  existing.labels.push(label);
  existing.sortTime = Math.max(existing.sortTime, label.triggeredAt);
}

function labelSummary(labels: AnomalyTodoLabel[]): string[] {
  return [...new Set(labels.map((l) => l.label))];
}

export function buildAnomalyTodosSnapshot(
  orders: Order[],
  username: string | undefined,
  now = new Date(),
): AnomalyTodosSnapshot {
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const rowMap = new Map<string, AnomalyTodoOrderRow>();
  const pending = buildPendingConfirmSnapshot(orders, now);
  const pendingOrderIds = new Set(
    pending.orderItems.map((item) => item.orderId),
  );

  for (const item of pending.orderItems) {
    const order = orderById.get(item.orderId);
    if (!order) continue;
    upsertOrderRow(rowMap, order, {
      key: `pending:${item.kind}:${item.orderId}`,
      label: item.label,
      source: "pending",
      pendingKind: item.kind,
      triggeredAt: triggeredAtForPending(order, item),
    });
  }

  const acks = loadFollowUpAcks(username);
  for (const item of buildFollowUpSnapshot(orders, now).items) {
    if (
      followUpKindRequiresAck(item.kind) &&
      isFollowUpAcked(acks, item)
    ) {
      continue;
    }
    if (
      item.kind === "accept-overdue" &&
      pendingOrderIds.has(item.orderId)
    ) {
      continue;
    }
    const order = orderById.get(item.orderId);
    if (!order) continue;
    upsertOrderRow(rowMap, order, {
      key: `followup:${item.kind}:${item.label}:${item.orderId}`,
      label: item.stageAlert ?? item.label,
      source: "followup",
      followUpKind: item.kind,
      triggeredAt: triggeredAtForFollowUp(order, item),
    });
  }

  for (const order of orders) {
    if (!hasBeenTransferred(order)) continue;
    if (isTransferredAcked(acks, order.id)) continue;
    const at =
      getLatestTransferAt(order) ?? order.createdAt;
    upsertOrderRow(rowMap, order, {
      key: `transfer:${order.id}`,
      label: "已转派",
      source: "transfer",
      triggeredAt: timestamp(at),
    });
  }

  const orderRows = [...rowMap.values()].sort(
    (a, b) => b.sortTime - a.sortTime || a.customerName.localeCompare(b.customerName, "zh-CN"),
  );

  const capacityRows: AnomalyTodoCapacityRow[] = pending.designerItems.map(
    (item) => ({
      type: "capacity",
      designer: item.designer,
      label: item.label,
      hint: item.hint,
    }),
  );

  const labelCounts = new Map<string, number>();
  for (const row of orderRows) {
    for (const label of labelSummary(row.labels)) {
      labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
    }
  }
  if (capacityRows.length > 0) {
    labelCounts.set("在途已满", capacityRows.length);
  }

  const summaryParts = [...labelCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => `${label} ${count}`);

  return {
    orderRows,
    capacityRows,
    totalCount: orderRows.length + capacityRows.length,
    summaryParts,
  };
}

export function countAnomalyTodos(
  orders: Order[],
  username: string | undefined,
  now = new Date(),
): number {
  return buildAnomalyTodosSnapshot(orders, username, now).totalCount;
}

export function pickPrimaryAnomalyLabel(
  row: AnomalyTodoOrderRow,
): AnomalyTodoLabel {
  return row.labels.reduce((best, label) => {
    const bestPriority =
      label.source === "pending" && label.pendingKind
        ? pendingKindPriority(label.pendingKind)
        : 100 + (label.followUpKind ? followUpAttentionPriority(label.followUpKind) : 99);
    const labelPriority =
      label.source === "pending" && label.pendingKind
        ? pendingKindPriority(label.pendingKind)
        : 100 + (label.followUpKind ? followUpAttentionPriority(label.followUpKind) : 99);
    if (labelPriority < bestPriority) return label;
    if (labelPriority > bestPriority) return best;
    return label.triggeredAt > best.triggeredAt ? label : best;
  });
}

export function formatAnomalySortHint(sortTime: number, now = new Date()): string {
  const diffMs = now.getTime() - sortTime;
  if (diffMs < MS_HOUR) return "刚刚出现异常";
  if (diffMs < MS_DAY) {
    const hours = Math.floor(diffMs / MS_HOUR);
    return `${hours} 小时前`;
  }
  const days = Math.floor(diffMs / MS_DAY);
  return `${days} 天前`;
}

export function anomalyLabelText(label: AnomalyTodoLabel): string {
  if (label.source === "pending" && label.pendingKind) {
    return pendingConfirmKindLabel(label.pendingKind);
  }
  if (label.followUpKind) {
    return followUpKindLabel(label.followUpKind);
  }
  return label.label;
}
