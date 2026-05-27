import type { Order, SupplementOrder } from "./types";

/** 增补单仅保留与当前筛选结果订单匹配的条目 */
export function filterSupplementsByOrders(
  supplements: SupplementOrder[],
  orders: Order[],
): SupplementOrder[] {
  if (orders.length === 0) return [];
  const orderIds = new Set(orders.map((o) => o.id));
  return supplements.filter((s) => orderIds.has(s.parentOrderId));
}
