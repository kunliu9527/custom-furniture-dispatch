import {
  getDispatcherHomeStore,
  getEffectiveDispatcherRoster,
} from "./dispatchers";
import type { StoreName } from "./types";
import { createEmptyStatusCounts } from "./manager-stats";
import type { StaffRecord } from "./staff-roster";
import type { Order, OrderStatus } from "./types";

/** 门店派单页 Tab */
export type AdminViewMode = "dispatch" | "orderLookup" | "staff" | "branding";

export function normalizeDispatcherName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed === "—") return "未填写";
  return trimmed;
}

export interface DispatcherOrderStats {
  dispatcher: string;
  total: number;
  byStatus: Record<OrderStatus, number>;
}

function dispatcherInStoreFilter(
  dispatcherName: string,
  storeFilter: StoreName[],
  staffRecords: StaffRecord[],
): boolean {
  const home = getDispatcherHomeStore(dispatcherName, "东岸天冠", staffRecords);
  return storeFilter.includes(home);
}

export function getDispatcherStats(
  orders: Order[],
  staffRecords: StaffRecord[] = [],
  storeFilter?: StoreName[] | null,
): DispatcherOrderStats[] {
  const map = new Map<string, Order[]>();

  for (const order of orders) {
    const key = normalizeDispatcherName(order.dispatcherName);
    const list = map.get(key) ?? [];
    list.push(order);
    map.set(key, list);
  }

  let stats = [...map.entries()].map(([dispatcher, dispatcherOrders]) => {
    const byStatus = createEmptyStatusCounts();
    for (const order of dispatcherOrders) {
      byStatus[order.status] += 1;
    }
    return {
      dispatcher,
      total: dispatcherOrders.length,
      byStatus,
    };
  });

  if (storeFilter?.length) {
    stats = stats.filter((s) =>
      dispatcherInStoreFilter(s.dispatcher, storeFilter, staffRecords),
    );
  }

  const seen = new Set(stats.map((s) => s.dispatcher));
  for (const profile of getEffectiveDispatcherRoster(staffRecords)) {
    if (storeFilter?.length && !storeFilter.includes(profile.homeStore)) {
      continue;
    }
    if (seen.has(profile.name)) continue;
    seen.add(profile.name);
    stats.push({
      dispatcher: profile.name,
      total: 0,
      byStatus: createEmptyStatusCounts(),
    });
  }

  return stats.sort(
    (a, b) =>
      b.total - a.total ||
      a.dispatcher.localeCompare(b.dispatcher, "zh-CN"),
  );
}

export function filterOrdersByDispatcher(
  orders: Order[],
  dispatcher: string | "全部",
): Order[] {
  if (dispatcher === "全部") return orders;
  return orders.filter(
    (o) => normalizeDispatcherName(o.dispatcherName) === dispatcher,
  );
}
