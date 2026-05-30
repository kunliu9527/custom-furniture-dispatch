import { searchOrders } from "@/lib/order-search";
import { resolveOrderDisplayName } from "@/lib/order-remark";
import type { Order } from "@/lib/types";

export type StrongPinResolution =
  | { kind: "idle" }
  | { kind: "none" }
  | { kind: "ambiguous"; count: number }
  | { kind: "pin"; order: Order };

/** 查询框强定位：仅在当前订单池内唯一匹配时锁定 */
export function resolveStrongPinOrder(
  orders: Order[],
  query: string,
): StrongPinResolution {
  const q = query.trim();
  if (!q) return { kind: "idle" };

  const matches = searchOrders(orders, q);
  if (matches.length === 0) return { kind: "none" };
  if (matches.length === 1) return { kind: "pin", order: matches[0] };
  return { kind: "ambiguous", count: matches.length };
}

export function isStrongPinQueryActive(
  query: string,
  strongPin: StrongPinResolution,
): boolean {
  return query.trim().length > 0 || strongPin.kind === "pin";
}

export function formatStrongPinSearchHint(
  strongPin: StrongPinResolution,
  query: string,
  defaultHint?: string,
): string | undefined {
  const q = query.trim();
  if (strongPin.kind === "pin") {
    return `强定位 · 侧栏已同步「${strongPin.order.status}」· 更新后将跟随状态`;
  }
  if (q && strongPin.kind === "none") {
    return "未找到唯一订单，请核对查询或切换统计周期为「全部」";
  }
  if (q && strongPin.kind === "ambiguous") {
    return `匹配 ${strongPin.count} 笔，请缩小查询范围以强定位`;
  }
  return defaultHint;
}

export function formatStrongPinEmptyMessage(
  strongPin: StrongPinResolution,
  query: string,
  fallback: string,
): string {
  const q = query.trim();
  if (q && strongPin.kind === "none") {
    return "当前周期内未找到唯一订单，请核对查询或切换统计周期为「全部」";
  }
  if (q && strongPin.kind === "ambiguous") {
    return "匹配多笔订单，请缩小查询范围";
  }
  if (q) return "未找到匹配订单";
  return fallback;
}

export function formatStrongPinHeading(
  strongPin: StrongPinResolution,
  defaultHeading: string,
): string {
  if (strongPin.kind === "pin") {
    const label = resolveOrderDisplayName(strongPin.order);
    return `强定位 · ${label}`;
  }
  return defaultHeading;
}

/** 强定位单条；否则返回查询匹配列表（0 或多条） */
export function resolveStrongPinOrSearchMatches(
  orders: Order[],
  query: string,
  strongPin: StrongPinResolution,
): Order[] {
  if (strongPin.kind === "pin") return [strongPin.order];
  const q = query.trim();
  if (!q) return [];
  return searchOrders(orders, query);
}
