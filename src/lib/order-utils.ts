import { normalizeDispatcherName } from "./admin-stats";
import type { SessionUser } from "./permissions";
import type { Order } from "./types";
import { CUSTOMER_GATE_STATUSES, FLOW_ORDER_STATUSES, REFUND_ELIGIBLE_STATUSES, REFUND_ORDER_STATUSES, SUPPLEMENT_ELIGIBLE_STATUSES } from "./constants";
import type { DesignerName, FlowOrderStatus, OrderStatus } from "./types";

export function getNextStatus(current: OrderStatus): FlowOrderStatus | null {
  if (current === "未派单") return null;
  if (CUSTOMER_GATE_STATUSES.includes(current as FlowOrderStatus)) return null;
  if (!FLOW_ORDER_STATUSES.includes(current as FlowOrderStatus)) return null;
  const index = FLOW_ORDER_STATUSES.indexOf(current as FlowOrderStatus);
  if (index < 0 || index >= FLOW_ORDER_STATUSES.length - 1) return null;
  return FLOW_ORDER_STATUSES[index + 1];
}

export function getPreviousStatus(current: OrderStatus): FlowOrderStatus | null {
  if (!FLOW_ORDER_STATUSES.includes(current as FlowOrderStatus)) return null;
  const index = FLOW_ORDER_STATUSES.indexOf(current as FlowOrderStatus);
  if (index <= 0) return null;
  const prev = FLOW_ORDER_STATUSES[index - 1];
  if (prev === "未派单") return null;
  return prev;
}

/** 主流程状态可撤回至上一环节（不含待量尺、已验收） */
export function canRevertStatus(status: OrderStatus): boolean {
  if (status === "已验收") return false;
  const prev = getPreviousStatus(status);
  return prev !== null;
}

export function canMarkPendingRefund(status: OrderStatus): boolean {
  return REFUND_ELIGIBLE_STATUSES.includes(status as FlowOrderStatus);
}

/** 增补单仅可关联「已下单」及之后主流程状态的订单 */
export function isSupplementEligibleOrder(order: {
  status: OrderStatus;
}): boolean {
  return SUPPLEMENT_ELIGIBLE_STATUSES.includes(order.status as FlowOrderStatus);
}

export function isRefundStatus(status: OrderStatus): boolean {
  return status === "待退单" || status === "已退单";
}

export function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** 列表派单时间：仅显示到日 */
export function formatOrderDateDay(iso: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** 筛选结果仅定位到单笔订单地址时，展示完整列表字段 */
export function isSingleOrderDetailView(orders: { id: string }[]): boolean {
  return orders.length === 1;
}

export function isUndispatchedOrder(order: { status: OrderStatus }): boolean {
  return order.status === "未派单";
}

export function hasAssignedDesigner(
  order: { designer: DesignerName | null },
): order is { designer: DesignerName } {
  return order.designer != null && order.designer.length > 0;
}

export function isActiveOrder(order: { status: OrderStatus }): boolean {
  return order.status !== "已验收" && order.status !== "已退单";
}

export function isCompletedOrder(order: { status: OrderStatus }): boolean {
  return order.status === "已验收" || order.status === "已退单";
}

export function sortOrdersNewestFirst<T extends { createdAt: string }>(
  list: T[],
): T[] {
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function getFlowStatusSortIndex(status: OrderStatus): number {
  const flowIndex = FLOW_ORDER_STATUSES.indexOf(status as FlowOrderStatus);
  if (flowIndex >= 0) return flowIndex;
  const refundIndex = REFUND_ORDER_STATUSES.indexOf(
    status as (typeof REFUND_ORDER_STATUSES)[number],
  );
  if (refundIndex >= 0) return FLOW_ORDER_STATUSES.length + refundIndex;
  return FLOW_ORDER_STATUSES.length + REFUND_ORDER_STATUSES.length;
}

/** 主流程从前到后；同状态内按派单时间倒序 */
export function sortOrdersByFlowStatus<
  T extends { status: OrderStatus; createdAt: string },
>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const statusDiff =
      getFlowStatusSortIndex(a.status) - getFlowStatusSortIndex(b.status);
    if (statusDiff !== 0) return statusDiff;
    return (
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });
}

/** 进行中订单：派单人/设计师字段与登录姓名一致 */
export function orderMatchesLoginAccount(
  order: Order,
  user: SessionUser,
): boolean {
  const name = user.displayName;
  if (user.role === "dispatcher") {
    return normalizeDispatcherName(order.dispatcherName) === name;
  }
  if (user.role === "designer") {
    return order.designer === name;
  }
  return (
    normalizeDispatcherName(order.dispatcherName) === name ||
    order.designer === name
  );
}

/** 登录账号相关订单优先，同组内按派单时间倒序 */
export function sortOrdersByLoginAccountPriority(
  list: Order[],
  user: SessionUser | null,
): Order[] {
  if (!user) {
    return [...list].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  return [...list].sort((a, b) => {
    const aMatch = orderMatchesLoginAccount(a, user) ? 1 : 0;
    const bMatch = orderMatchesLoginAccount(b, user) ? 1 : 0;
    if (bMatch !== aMatch) return bMatch - aMatch;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
