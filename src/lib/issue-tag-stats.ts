import type { PeriodSelection } from "./period-filter";
import { filterOrdersByPeriod } from "./period-filter";
import type { Order, OrderIssueTag } from "./types";

export function aggregateIssueTags(
  orders: Order[],
  period: PeriodSelection,
): { tag: OrderIssueTag; count: number }[] {
  const filtered = filterOrdersByPeriod(orders, period);
  const counts = new Map<OrderIssueTag, number>();

  for (const order of filtered) {
    for (const tag of order.issueTags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
