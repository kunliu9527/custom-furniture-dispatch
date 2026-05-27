import type { Order } from "./types";

export function hasAfterSales(
  order: Pick<Order, "afterSalesAmount">,
): boolean {
  return (
    order.afterSalesAmount != null && order.afterSalesAmount > 0
  );
}
