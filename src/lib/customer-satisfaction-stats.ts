import {
  aggregatePersonRatings,
  buildCustomerRatingEntries,
  buildOrderCustomerRatingRecords,
  summarizeCustomerRatings,
  type CustomerRatingEntry,
  type OrderCustomerRatingRecord,
  type PersonRatingAggregate,
} from "./customer-ratings";
import type { Order } from "./types";

/** @deprecated 请使用 buildOrderCustomerRatingRecords */
export interface CustomerSatisfactionRow {
  orderId: string;
  customerName: string;
  designer: string;
  dispatcherName: string;
  dispatchStore: string;
  acceptedAt: string;
  avgRating: number;
  salesManager: number;
  designerRating: number;
  installTeam: number;
  product: number;
  comment?: string;
  installerName?: string;
}

export interface CustomerSatisfactionSummary {
  count: number;
  avgOverall: number;
  avgSales: number;
  avgDesigner: number;
  avgInstall: number;
  avgProduct: number;
  acceptanceRate: number;
}

export function getAcceptedOrders(orders: Order[]): Order[] {
  return orders.filter(
    (o) => o.status === "已验收" && o.acceptance?.ratings,
  );
}

export function getInstalledPendingAcceptance(orders: Order[]): Order[] {
  return orders.filter((o) => o.status === "已安装");
}

export function buildCustomerSatisfactionRows(
  orders: Order[],
): CustomerSatisfactionRow[] {
  return buildOrderCustomerRatingRecords(orders).map((record) => {
    const dispatcher = record.attributions.find((a) => a.role === "dispatcher");
    const designer = record.attributions.find((a) => a.role === "designer");
    const installer = record.attributions.find((a) => a.role === "installer");
    const overall = record.attributions.find((a) => a.role === "overall");
    return {
      orderId: record.orderId,
      customerName: record.customerName,
      designer: designer?.personName ?? "—",
      dispatcherName: dispatcher?.personName ?? "—",
      dispatchStore: record.dispatchStore,
      acceptedAt: record.acceptedAt,
      avgRating: record.avgRating,
      salesManager: dispatcher?.stars ?? 0,
      designerRating: designer?.stars ?? 0,
      installTeam: installer?.stars ?? 0,
      product: overall?.stars ?? 0,
      comment: record.comment,
      installerName: installer?.personName ?? undefined,
    };
  });
}

export function summarizeCustomerSatisfaction(
  orders: Order[],
): CustomerSatisfactionSummary {
  const summary = summarizeCustomerRatings(orders);
  const installedOrDone = orders.filter(
    (o) => o.status === "已安装" || o.status === "已验收",
  );
  return {
    count: summary.ratedCount,
    avgOverall: summary.avgOverall,
    avgSales: summary.avgByRole.dispatcher,
    avgDesigner: summary.avgByRole.designer,
    avgInstall: summary.avgByRole.installer,
    avgProduct: summary.avgOverallSatisfaction,
    acceptanceRate: installedOrDone.length
      ? summary.ratedCount / installedOrDone.length
      : summary.ratedCount > 0
        ? 1
        : 0,
  };
}

export {
  aggregatePersonRatings,
  buildCustomerRatingEntries,
  buildOrderCustomerRatingRecords,
  summarizeCustomerRatings,
};
export type {
  CustomerRatingEntry,
  OrderCustomerRatingRecord,
  PersonRatingAggregate,
};
