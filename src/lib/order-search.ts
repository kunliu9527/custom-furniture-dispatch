import type { Order } from "./types";

export function searchOrders(orders: Order[], query: string): Order[] {
  const q = query.trim().toLowerCase();
  if (!q) return orders;

  return orders.filter((order) => {
    const fields = [
      order.id,
      order.customerName,
      order.phone,
      order.address,
      order.designer ?? "未指派",
      order.originalDesigner ?? "",
      order.dispatcherName,
      order.dispatchStore,
      order.status,
    ];
    return fields.some((field) =>
      String(field).toLowerCase().includes(q),
    );
  });
}
