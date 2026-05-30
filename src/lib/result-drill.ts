import { normalizeDispatcherName } from "./admin-stats";
import { filterOrdersByStatus } from "./manager-stats";
import { orderBelongsToStoreSummary } from "./dispatchers";
import { STORES } from "./designers";
import type { Order, OrderStatus, StoreName } from "./types";

export type DrillDimension = "status" | "designer" | "dispatcher" | "store";

export type DrillFlow = DrillDimension[];

export interface ResultDrillFilters {
  status: OrderStatus | "全部";
  designer: string | "全部";
  dispatcher: string | "全部";
  store: StoreName | "全部";
}

export const EMPTY_RESULT_DRILL: ResultDrillFilters = {
  status: "全部",
  designer: "全部",
  dispatcher: "全部",
  store: "全部",
};

export function applyResultDrillFilters(
  orders: Order[],
  drill: ResultDrillFilters,
): Order[] {
  let list = orders;
  if (drill.status !== "全部") {
    list = filterOrdersByStatus(list, drill.status);
  }
  if (drill.designer !== "全部") {
    list = list.filter((o) => o.designer === drill.designer);
  }
  if (drill.dispatcher !== "全部") {
    list = list.filter(
      (o) => normalizeDispatcherName(o.dispatcherName) === drill.dispatcher,
    );
  }
  if (drill.store !== "全部") {
    const store = drill.store;
    list = list.filter((o) => orderBelongsToStoreSummary(o, store));
  }
  return list;
}

/** 统计某一维度时排除该维度本身的筛选 */
export function drillSourceForDimension(
  baseOrders: Order[],
  drill: ResultDrillFilters,
  dimension: DrillDimension,
): Order[] {
  const partial = { ...drill };
  if (dimension === "status") partial.status = "全部";
  if (dimension === "designer") partial.designer = "全部";
  if (dimension === "dispatcher") partial.dispatcher = "全部";
  if (dimension === "store") partial.store = "全部";
  return applyResultDrillFilters(baseOrders, partial);
}

export function countByDesigner(orders: Order[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const order of orders) {
    const key = order.designer ?? "未指派";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export function countByDispatcher(orders: Order[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const order of orders) {
    const name = normalizeDispatcherName(order.dispatcherName);
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return map;
}

export function countByStore(orders: Order[]): Map<StoreName, number> {
  const map = new Map<StoreName, number>();
  for (const store of STORES) {
    map.set(store, 0);
  }
  for (const order of orders) {
    for (const store of STORES) {
      if (orderBelongsToStoreSummary(order, store)) {
        map.set(store, (map.get(store) ?? 0) + 1);
      }
    }
  }
  return map;
}

export function hasActiveDrill(drill: ResultDrillFilters): boolean {
  return (
    drill.status !== "全部" ||
    drill.designer !== "全部" ||
    drill.dispatcher !== "全部" ||
    drill.store !== "全部"
  );
}

export function drillFilterLabel(drill: ResultDrillFilters): string {
  const parts: string[] = [];
  if (drill.status !== "全部") parts.push(`状态 ${drill.status}`);
  if (drill.designer !== "全部") parts.push(`设计师 ${drill.designer}`);
  if (drill.dispatcher !== "全部") parts.push(`派单人 ${drill.dispatcher}`);
  if (drill.store !== "全部") parts.push(`门店 ${drill.store}`);
  return parts.length > 0 ? parts.join(" · ") : "";
}
