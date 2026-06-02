import { STORES } from "./designers";
import { orderBelongsToDispatchStore } from "./order-store-attribution";
import {
  aggregatePersonRatings,
  buildOrderCustomerRatingRecords,
  summarizeCustomerRatings,
} from "./customer-ratings";
import type { Order, StoreName } from "./types";

export interface AcceptanceEvaluationSummary {
  ratedCount: number;
  avgOverall: number;
  electronicRate: number;
}

export interface AcceptanceStoreRow {
  key: string;
  label: string;
  ratedCount: number;
  pendingCount: number;
  avgOverall: number;
  electronicRate: number;
}

export function getAcceptanceEvaluationSummary(
  orders: Order[],
): AcceptanceEvaluationSummary {
  const s = summarizeCustomerRatings(orders);
  return {
    ratedCount: s.ratedCount,
    avgOverall: s.avgOverall,
    electronicRate: s.electronicRate,
  };
}

export function getAcceptanceStoreRows(
  orders: Order[],
  storeNames: StoreName[] | null,
): AcceptanceStoreRow[] {
  const stores = storeNames?.length ? storeNames : [...STORES];
  return stores.map((store) => {
    const storeOrders = orders.filter((o) => orderBelongsToDispatchStore(o, store));
    const summary = summarizeCustomerRatings(storeOrders);
    const pendingCount = storeOrders.filter((o) => o.status === "已安装").length;
    return {
      key: store,
      label: store,
      ratedCount: summary.ratedCount,
      pendingCount,
      avgOverall: summary.avgOverall,
      electronicRate: summary.electronicRate,
    };
  });
}

export function getAcceptancePersonRanking(orders: Order[]) {
  return {
    dispatchers: aggregatePersonRatings(orders, "dispatcher"),
    designers: aggregatePersonRatings(orders, "designer"),
    installers: aggregatePersonRatings(orders, "installer"),
  };
}

export function formatAcceptanceTabMetric(
  summary: AcceptanceEvaluationSummary,
): string {
  if (summary.ratedCount <= 0) return "—";
  return `${summary.ratedCount} 单 · ${summary.avgOverall.toFixed(1)} 星`;
}

export function getAcceptanceRatingRecords(orders: Order[]) {
  return buildOrderCustomerRatingRecords(orders);
}
