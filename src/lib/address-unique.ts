import { resolveOrderCustomerName } from "./order-remark";
import { isRefundStatus } from "./order-utils";
import type { Order } from "./types";

export function normalizeOrderAddress(address: string): string {
  return address.trim().replace(/\s+/g, "").toLowerCase();
}

export function findDuplicateAddressOrder(
  orders: Order[],
  address: string,
  excludeOrderId?: string,
): Order | undefined {
  const key = normalizeOrderAddress(address);
  if (!key) return undefined;
  return orders.find((order) => {
    if (excludeOrderId && order.id === excludeOrderId) return false;
    if (isRefundStatus(order.status)) return false;
    return normalizeOrderAddress(order.address) === key;
  });
}

export function formatDuplicateAddressMessage(order: Order): string {
  const person = resolveOrderCustomerName(order);
  const personLabel = person ? `客户：${person}，` : "";
  return `该地址已有订单（${personLabel}状态：${order.status}），请勿重复录入`;
}
