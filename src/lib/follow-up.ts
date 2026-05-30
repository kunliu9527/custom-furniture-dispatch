import {
  buildAcceptanceBadReviewLabels,
} from "./acceptance-rating";
import {
  isAcceptanceOverdue,
  needsDesignerAcceptance,
} from "./designer-load";
import { getManagerAlerts, type ManagerAlertItem } from "./manager-alerts";
import { resolveOrderDisplayName } from "./order-remark";
import { REPORT_THRESHOLDS } from "./report-thresholds";
import { getStatusEnteredAt, rawIntervalDays } from "./stage-intervals";
import type { FlowOrderStatus, Order } from "./types";

export type FollowUpKind =
  | "undispatched-stale"
  | "stage-timeout"
  | "install-lag"
  | "acceptance-lag"
  | "refund-stale"
  | "bad-acceptance"
  | "low-dimension"
  | "accept-overdue";

export interface FollowUpItem {
  kind: FollowUpKind;
  orderId: string;
  customerName: string;
  designer: string;
  dispatchStore: Order["dispatchStore"];
  status: Order["status"];
  label: string;
  daysStuck: number;
  budget: number;
  /** 来自 manager-alerts 的超时类型 */
  stageAlert?: ManagerAlertItem["alert"];
}

export interface FollowUpSnapshot {
  items: FollowUpItem[];
  countByKind: Record<FollowUpKind, number>;
  totalCount: number;
  summaryParts: string[];
}

const GROUP_ORDER: FollowUpKind[] = [
  "undispatched-stale",
  "accept-overdue",
  "stage-timeout",
  "install-lag",
  "acceptance-lag",
  "refund-stale",
  "bad-acceptance",
  "low-dimension",
];

const KIND_LABELS: Record<FollowUpKind, string> = {
  "undispatched-stale": "未派单滞留",
  "accept-overdue": "接单超时",
  "stage-timeout": "流程超时",
  "install-lag": "安装滞后",
  "acceptance-lag": "久未验收",
  "refund-stale": "退单久未处理",
  "bad-acceptance": "验收低评",
  "low-dimension": "维度低评",
};

export function followUpKindLabel(kind: FollowUpKind): string {
  return KIND_LABELS[kind];
}

export { GROUP_ORDER as FOLLOW_UP_GROUP_ORDER };

function daysSince(iso: string | undefined, now: Date): number {
  if (!iso) return 0;
  return Math.floor(rawIntervalDays(iso, now.toISOString()));
}

export function buildFollowUpSnapshot(
  orders: Order[],
  now = new Date(),
): FollowUpSnapshot {
  const items: FollowUpItem[] = [];
  const seen = new Set<string>();

  function push(item: FollowUpItem) {
    const key = `${item.orderId}:${item.kind}:${item.label}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  }

  for (const order of orders) {
    if (order.status === "未派单") {
      const days = daysSince(order.createdAt, now);
      if (days >= REPORT_THRESHOLDS.undispatchedStaleDays) {
        push({
          kind: "undispatched-stale",
          orderId: order.id,
          customerName: resolveOrderDisplayName(order),
          designer: order.designer ?? "未指派",
          dispatchStore: order.dispatchStore,
          status: order.status,
          label: "未派单滞留",
          daysStuck: days,
          budget: order.budget,
        });
      }
    }

    if (needsDesignerAcceptance(order) && isAcceptanceOverdue(order, now)) {
      push({
        kind: "accept-overdue",
        orderId: order.id,
        customerName: resolveOrderDisplayName(order),
        designer: order.designer ?? "—",
        dispatchStore: order.dispatchStore,
        status: order.status,
        label: "接单超时",
        daysStuck: daysSince(order.createdAt, now),
        budget: order.budget,
      });
    }

    if (order.status === "已下单") {
      const from = getStatusEnteredAt(order, "已下单" as FlowOrderStatus);
      const days = daysSince(from, now);
      if (days >= REPORT_THRESHOLDS.installLagDays) {
        push({
          kind: "install-lag",
          orderId: order.id,
          customerName: resolveOrderDisplayName(order),
          designer: order.designer ?? "—",
          dispatchStore: order.dispatchStore,
          status: order.status,
          label: "安装滞后",
          daysStuck: days,
          budget: order.budget,
        });
      }
    }

    if (order.status === "已安装") {
      const from = getStatusEnteredAt(order, "已安装" as FlowOrderStatus);
      const days = daysSince(from, now);
      if (days >= REPORT_THRESHOLDS.acceptanceLagDays) {
        push({
          kind: "acceptance-lag",
          orderId: order.id,
          customerName: resolveOrderDisplayName(order),
          designer: order.designer ?? "—",
          dispatchStore: order.dispatchStore,
          status: order.status,
          label: "久未验收",
          daysStuck: days,
          budget: order.budget,
        });
      }
    }

    if (order.status === "待退单") {
      const from = getStatusEnteredAt(order, "待退单" as FlowOrderStatus);
      const days = daysSince(from ?? order.createdAt, now);
      if (days >= REPORT_THRESHOLDS.refundStaleDays) {
        push({
          kind: "refund-stale",
          orderId: order.id,
          customerName: resolveOrderDisplayName(order),
          designer: order.designer ?? "—",
          dispatchStore: order.dispatchStore,
          status: order.status,
          label: "退单久未处理",
          daysStuck: days,
          budget: order.budget,
        });
      }
    }

    for (const label of buildAcceptanceBadReviewLabels(order)) {
      push({
        kind: label === "综合低评" ? "bad-acceptance" : "low-dimension",
        orderId: order.id,
        customerName: resolveOrderDisplayName(order),
        designer: order.designer ?? "—",
        dispatchStore: order.dispatchStore,
        status: order.status,
        label,
        daysStuck: 0,
        budget: order.budget,
      });
    }
  }

  for (const alert of getManagerAlerts(orders, now)) {
    if (
      items.some(
        (i) => i.orderId === alert.orderId && i.kind === "accept-overdue",
      )
    ) {
      continue;
    }
    push({
      kind: "stage-timeout",
      orderId: alert.orderId,
      customerName: alert.customerName,
      designer: alert.designer,
      dispatchStore: alert.dispatchStore,
      status: alert.status,
      label: alert.alert,
      daysStuck: alert.daysStuck,
      budget: alert.budget,
      stageAlert: alert.alert,
    });
  }

  items.sort(
    (a, b) =>
      b.daysStuck - a.daysStuck ||
      a.customerName.localeCompare(b.customerName, "zh-CN"),
  );

  const countByKind = {} as Record<FollowUpKind, number>;
  for (const kind of GROUP_ORDER) {
    countByKind[kind] = items.filter((i) => i.kind === kind).length;
  }

  const summaryParts = GROUP_ORDER.filter((k) => countByKind[k] > 0).map(
    (k) => `${KIND_LABELS[k]} ${countByKind[k]}`,
  );

  return {
    items,
    countByKind,
    totalCount: items.length,
    summaryParts,
  };
}

export function followUpAttentionPriority(kind: FollowUpKind): number {
  const index = GROUP_ORDER.indexOf(kind);
  return index >= 0 ? index : GROUP_ORDER.length;
}

export function pickPrimaryFollowUpItem(items: FollowUpItem[]): FollowUpItem {
  return items.reduce((best, item) =>
    followUpAttentionPriority(item.kind) < followUpAttentionPriority(best.kind)
      ? item
      : best,
  );
}

export interface FollowUpAddressGroup {
  addressKey: string;
  items: FollowUpItem[];
}

/** 按地址合并跟进项（地址为空时按订单 id 区分） */
export function groupFollowUpItemsByAddress(
  items: FollowUpItem[],
): FollowUpAddressGroup[] {
  const map = new Map<string, FollowUpItem[]>();
  for (const item of items) {
    const key = item.customerName.trim() || item.orderId;
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }

  return [...map.entries()]
    .map(([addressKey, groupItems]) => ({ addressKey, items: groupItems }))
    .sort((a, b) => {
      const priority = (group: FollowUpAddressGroup) =>
        followUpAttentionPriority(pickPrimaryFollowUpItem(group.items).kind);
      const priorityDiff = priority(a) - priority(b);
      if (priorityDiff !== 0) return priorityDiff;
      const maxDays = (group: FollowUpAddressGroup) =>
        Math.max(...group.items.map((i) => i.daysStuck));
      return maxDays(b) - maxDays(a);
    });
}

export interface FollowUpOrderGroup {
  orderId: string;
  items: FollowUpItem[];
}

export function groupFollowUpItemsByOrder(
  items: FollowUpItem[],
): FollowUpOrderGroup[] {
  const map = new Map<string, FollowUpItem[]>();
  for (const item of items) {
    const list = map.get(item.orderId) ?? [];
    list.push(item);
    map.set(item.orderId, list);
  }

  return [...map.entries()]
    .map(([orderId, groupItems]) => ({ orderId, items: groupItems }))
    .sort((a, b) => {
      const maxDays = (group: FollowUpOrderGroup) =>
        Math.max(...group.items.map((i) => i.daysStuck));
      const daysDiff = maxDays(b) - maxDays(a);
      if (daysDiff !== 0) return daysDiff;
      return (a.items[0]?.customerName ?? "").localeCompare(
        b.items[0]?.customerName ?? "",
        "zh-CN",
      );
    });
}
