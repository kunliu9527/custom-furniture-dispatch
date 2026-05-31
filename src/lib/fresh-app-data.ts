import { INITIAL_DATA } from "./initial-data";
import type { Order, SupplementOrder } from "./types";

/** 重新初始化时清除订单内操作日志与流程备注 */
export function stripOrderOperationalHistory(order: Order): Order {
  return {
    ...order,
    orderEvents: [],
    workflowRemark: null,
    workflowRemarks: [],
  };
}

export function buildFreshPersistedOrders(): Order[] {
  return INITIAL_DATA.orders.map(stripOrderOperationalHistory);
}

export function buildFreshPersistedSupplements(): SupplementOrder[] {
  return [...INITIAL_DATA.supplements];
}
