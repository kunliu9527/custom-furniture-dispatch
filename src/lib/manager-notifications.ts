import { countAnomalyTodos } from "./anomaly-todos";
import type { Order } from "./types";

/** 与「异常待办」列表条数一致；处理完毕后自动减少 */
export function notificationBadgeCount(
  orders: Order[],
  username: string | undefined,
  now = new Date(),
): number {
  return countAnomalyTodos(orders, username, now);
}
