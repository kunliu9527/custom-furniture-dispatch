import { buildFollowUpSnapshot, type FollowUpKind } from "./follow-up";
import { resolveOrderDisplayName } from "./order-remark";
import {
  getPeriodBounds,
  formatPeriodLabel,
  type PeriodSelection,
} from "./period-filter";
import { isReportInProgressOrder } from "./report-metric-definitions";
import { getStatusEnteredAt, rawIntervalDays } from "./stage-intervals";
import type { FlowOrderStatus, Order, StoreName } from "./types";

/**
 * 月报「关注订单」逐单清单。
 *
 * 目的：月报不只看总量，还要能逐单盯住动向，防止订单无管控。
 * 纳入范围（当前订单快照，不受统计周期限制）：
 * 1. 无管控：未派单（无人跟单）、在途但未指派设计师；
 * 2. 跨期遗留：本周期开始前创建、至今仍未完结的在途单；
 * 3. 超时/滞留/低评：来自 buildFollowUpSnapshot 的跟进项。
 */
export type WatchlistReasonKind =
  | "unmanaged"
  | "carried-over"
  | FollowUpKind;

export interface WatchlistRow {
  orderId: string;
  customerName: string;
  designer: string;
  dispatchStore: StoreName;
  status: Order["status"];
  /** 当前环节（未派单按创建时间）停留天数 */
  daysStuck: number;
  budget: number;
  /** 关注原因（去重，主因在前） */
  reasons: string[];
  /** 主关注类型，决定排序优先级 */
  kind: WatchlistReasonKind;
  /** 跨期遗留未完结 */
  carriedOver: boolean;
  /** 无管控（未派单 / 未指派设计师） */
  unmanaged: boolean;
}

export interface OrderWatchlist {
  periodLabel: string;
  generatedAt: string;
  rows: WatchlistRow[];
  totalCount: number;
  unmanagedCount: number;
  carriedOverCount: number;
  countByKind: Record<string, number>;
  summaryParts: string[];
}

const KIND_PRIORITY: WatchlistReasonKind[] = [
  "unmanaged",
  "carried-over",
  "undispatched-stale",
  "accept-overdue",
  "stage-timeout",
  "install-lag",
  "acceptance-lag",
  "refund-stale",
  "bad-acceptance",
  "low-dimension",
];

export function watchlistKindPriority(kind: WatchlistReasonKind): number {
  const index = KIND_PRIORITY.indexOf(kind);
  return index >= 0 ? index : KIND_PRIORITY.length;
}

/** 清单头部已单独展示计数的类别 */
export const HEADLINE_KINDS: WatchlistReasonKind[] = ["unmanaged", "carried-over"];

export const WATCHLIST_KIND_LABELS: Record<WatchlistReasonKind, string> = {
  unmanaged: "无管控",
  "carried-over": "跨期遗留",
  "undispatched-stale": "未派单滞留",
  "accept-overdue": "接单超时",
  "stage-timeout": "流程超时",
  "install-lag": "安装滞后",
  "acceptance-lag": "久未验收",
  "refund-stale": "退单久未处理",
  "bad-acceptance": "验收低评",
  "low-dimension": "维度低评",
};

function daysSince(iso: string | undefined, now: Date): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor(rawIntervalDays(iso, now.toISOString())));
}

function currentStageDays(order: Order, now: Date): number {
  return daysSince(
    getStatusEnteredAt(order, order.status as FlowOrderStatus) ??
      order.createdAt,
    now,
  );
}

export interface OrderWatchlistOptions {
  /** 报表人员范围：null 表示不限制；空数组表示无可见人员 */
  designerNames?: string[] | null;
  dispatcherNames?: string[] | null;
}

export function buildOrderWatchlist(
  orders: Order[],
  period: PeriodSelection,
  now = new Date(),
  options: OrderWatchlistOptions = {},
): OrderWatchlist {
  const bounds = getPeriodBounds(period);
  const byId = new Map(orders.map((o) => [o.id, o]));
  const map = new Map<string, WatchlistRow>();

  const designerAllowed = options.designerNames
    ? new Set(options.designerNames)
    : null;
  const dispatcherAllowed = options.dispatcherNames
    ? new Set(options.dispatcherNames)
    : null;

  function inPersonScope(order: Order): boolean {
    if (!designerAllowed && !dispatcherAllowed) return true;
    if (designerAllowed && order.designer && designerAllowed.has(order.designer)) {
      return true;
    }
    if (
      dispatcherAllowed &&
      order.dispatcherName &&
      dispatcherAllowed.has(order.dispatcherName)
    ) {
      return true;
    }
    // 无归属人的订单（如未派单）在门店/总部视角始终要盯住
    return !order.designer && !order.dispatcherName;
  }

  function upsert(
    order: Order,
    reason: string,
    kind: WatchlistReasonKind,
    daysStuck: number,
  ) {
    const existing = map.get(order.id);
    if (!existing) {
      map.set(order.id, {
        orderId: order.id,
        customerName: resolveOrderDisplayName(order),
        designer: order.designer ?? "未指派",
        dispatchStore: order.dispatchStore,
        status: order.status,
        daysStuck,
        budget: order.budget,
        reasons: [reason],
        kind,
        carriedOver: kind === "carried-over",
        unmanaged: kind === "unmanaged",
      });
      return;
    }
    if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
    existing.daysStuck = Math.max(existing.daysStuck, daysStuck);
    if (
      watchlistKindPriority(kind) < watchlistKindPriority(existing.kind)
    ) {
      existing.kind = kind;
    }
    if (kind === "carried-over") existing.carriedOver = true;
    if (kind === "unmanaged") existing.unmanaged = true;
  }

  for (const order of orders) {
    if (!inPersonScope(order)) continue;
    if (order.status === "未派单") {
      upsert(order, "未派单，无人跟单", "unmanaged", currentStageDays(order, now));
      continue;
    }
    if (isReportInProgressOrder(order) && !order.designer) {
      upsert(order, "未指派设计师", "unmanaged", currentStageDays(order, now));
    }
  }

  if (bounds) {
    for (const order of orders) {
      if (!isReportInProgressOrder(order)) continue;
      if (!inPersonScope(order)) continue;
      const created = new Date(order.createdAt).getTime();
      if (!Number.isFinite(created) || created >= bounds.start.getTime()) {
        continue;
      }
      upsert(
        order,
        "跨期遗留：本期前创建仍未完结",
        "carried-over",
        currentStageDays(order, now),
      );
    }
  }

  for (const item of buildFollowUpSnapshot(orders, now).items) {
    const order = byId.get(item.orderId);
    if (!order || !inPersonScope(order)) continue;
    upsert(order, item.label, item.kind, item.daysStuck);
  }

  const rows = [...map.values()].sort(
    (a, b) =>
      watchlistKindPriority(a.kind) - watchlistKindPriority(b.kind) ||
      b.daysStuck - a.daysStuck ||
      a.customerName.localeCompare(b.customerName, "zh-CN"),
  );

  const countByKind: Record<string, number> = {};
  for (const row of rows) {
    countByKind[row.kind] = (countByKind[row.kind] ?? 0) + 1;
  }

  // 「无管控」「跨期遗留」已在清单头部单独展示，此处只列其余关注原因，避免重复
  const summaryParts = KIND_PRIORITY.filter(
    (k) =>
      (countByKind[k] ?? 0) > 0 && !HEADLINE_KINDS.includes(k),
  ).map((k) => `${WATCHLIST_KIND_LABELS[k]} ${countByKind[k]}`);

  return {
    periodLabel: formatPeriodLabel(period),
    generatedAt: now.toISOString(),
    rows,
    totalCount: rows.length,
    unmanagedCount: rows.filter((r) => r.unmanaged).length,
    carriedOverCount: rows.filter((r) => r.carriedOver).length,
    countByKind,
    summaryParts,
  };
}

export function formatOrderWatchlistText(
  watchlist: OrderWatchlist,
  limit = 10,
): string[] {
  if (watchlist.totalCount === 0) return ["关注订单：当前无需逐单跟进的订单"];
  const lines = [
    `关注订单：${watchlist.totalCount} 单待逐单跟进（无管控 ${watchlist.unmanagedCount} · 跨期遗留 ${watchlist.carriedOverCount}）`,
  ];
  for (const row of watchlist.rows.slice(0, limit)) {
    lines.push(
      `- ${row.customerName} · ${row.designer} · ${row.dispatchStore} · ${row.status} · 停留 ${row.daysStuck} 天 · ${row.reasons.join("/")}`,
    );
  }
  if (watchlist.totalCount > limit) {
    lines.push(`- …另有 ${watchlist.totalCount - limit} 单，详见月报关注订单清单`);
  }
  return lines;
}
