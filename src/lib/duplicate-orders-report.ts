import { normalizeOrderAddress } from "./address-unique";
import { isRefundStatus } from "./order-utils";
import { resolveOrderCustomerName } from "./order-remark";
import type { Order } from "./types";

export interface DuplicateAddressGroup {
  addressKey: string;
  displayAddress: string;
  orders: Order[];
}

export function findDuplicateAddressGroups(orders: Order[]): DuplicateAddressGroup[] {
  const groups = new Map<string, Order[]>();

  for (const order of orders) {
    if (isRefundStatus(order.status)) continue;
    const key = normalizeOrderAddress(order.address);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(order);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([addressKey, list]) => ({
      addressKey,
      displayAddress: list[0]?.address?.trim() || addressKey,
      orders: [...list].sort((a, b) => a.id.localeCompare(b.id)),
    }))
    .sort((a, b) => b.orders.length - a.orders.length);
}

export function formatDuplicateGroupSummary(group: DuplicateAddressGroup): string {
  const parts = group.orders.map((order) => {
    const person = resolveOrderCustomerName(order);
    const personLabel = person ? `${person} · ` : "";
    return `${personLabel}${order.status}（${order.dispatcherName}）`;
  });
  return parts.join("；");
}
