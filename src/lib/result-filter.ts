import { filterOrdersByStatus } from "./manager-stats";
import type { Order, OrderStatus } from "./types";

export function applyResultStatusFilter(
  orders: Order[],
  resultStatusFilter: OrderStatus | "全部",
): Order[] {
  if (resultStatusFilter === "全部") return orders;
  return filterOrdersByStatus(orders, resultStatusFilter);
}
