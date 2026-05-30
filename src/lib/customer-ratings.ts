import { averageCustomerRating } from "./customer-flow";
import { resolveOrderCustomerName } from "./order-remark";
import {
  getEffectiveAcceptanceRatings,
  isSkippedElectronicAcceptance,
} from "./acceptance-rating";
import { normalizeDispatcherName } from "./admin-stats";
import type { CustomerRatings, FlowOrderStatus, Order, OrderAcceptanceRatedPersons, StoreName } from "./types";

export type CustomerRatingRole = "dispatcher" | "designer" | "installer" | "overall";

export type AcceptanceLookupFilter = "全部" | "待扫码" | "已评价" | "无电子验收";

export const CUSTOMER_RATING_DIMENSIONS: {
  role: CustomerRatingRole;
  ratingKey: keyof CustomerRatings;
  label: string;
  personLabel: string;
}[] = [
  { role: "dispatcher", ratingKey: "salesManager", label: "客户经理", personLabel: "客户经理" },
  { role: "designer", ratingKey: "designer", label: "设计师", personLabel: "设计师" },
  { role: "installer", ratingKey: "installTeam", label: "安装师", personLabel: "安装师" },
  {
    role: "overall",
    ratingKey: "product",
    label: "整体满意度",
    personLabel: "整体",
  },
];

export interface CustomerRatingAttribution {
  role: CustomerRatingRole;
  roleLabel: string;
  personName: string | null;
  stars: 1 | 2 | 3 | 4 | 5;
}

export interface OrderCustomerRatingRecord {
  orderId: string;
  customerName: string;
  dispatchStore: string;
  acceptedAt: string;
  avgRating: number;
  comment?: string;
  /** 无电子验收默认四星计入统计 */
  skippedDefaultRating?: boolean;
  attributions: CustomerRatingAttribution[];
  /** 扁平明细：每行一条「订单 × 人 × 星级」 */
  entries: CustomerRatingEntry[];
}

export interface CustomerRatingEntry {
  orderId: string;
  customerName: string;
  dispatchStore: string;
  acceptedAt: string;
  role: CustomerRatingRole;
  roleLabel: string;
  personName: string | null;
  stars: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}

export interface PersonRatingAggregate {
  role: CustomerRatingRole;
  roleLabel: string;
  personName: string;
  count: number;
  avgStars: number;
  orderIds: string[];
}

export interface CustomerRatingSummary {
  ratedCount: number;
  skippedCount: number;
  pendingScanCount: number;
  avgOverall: number;
  avgByRole: Record<Exclude<CustomerRatingRole, "overall">, number>;
  avgOverallSatisfaction: number;
  electronicRate: number;
}

export function resolveRatedPersons(order: Order): OrderAcceptanceRatedPersons {
  const snap = order.acceptance?.ratedPersons;
  if (snap && typeof snap.dispatcherName === "string") {
    return {
      dispatcherName: snap.dispatcherName,
      designer: snap.designer ?? null,
      installerName: snap.installerName ?? null,
    };
  }
  return {
    dispatcherName: order.dispatcherName,
    designer: order.designer ?? null,
    installerName: order.installation?.installerName ?? null,
  };
}

export function buildRatedPersonsSnapshot(order: Order): OrderAcceptanceRatedPersons {
  return resolveRatedPersons(order);
}

function personNameForRole(
  role: CustomerRatingRole,
  persons: OrderAcceptanceRatedPersons,
): string | null {
  switch (role) {
    case "dispatcher":
      return persons.dispatcherName || null;
    case "designer":
      return persons.designer;
    case "installer":
      return persons.installerName;
    case "overall":
      return null;
  }
}

export function buildOrderRatingAttributions(
  order: Order,
  ratingsOverride?: CustomerRatings,
): CustomerRatingAttribution[] {
  const ratings = ratingsOverride ?? order.acceptance?.ratings;
  if (!ratings) return [];
  const persons = resolveRatedPersons(order);
  return CUSTOMER_RATING_DIMENSIONS.map((dim) => ({
    role: dim.role,
    roleLabel: dim.label,
    personName: personNameForRole(dim.role, persons),
    stars: ratings[dim.ratingKey],
  }));
}

export function buildOrderCustomerRatingRecord(order: Order): OrderCustomerRatingRecord | null {
  const ratings = getEffectiveAcceptanceRatings(order);
  if (!ratings || order.status !== "已验收") return null;
  const skippedDefault = isSkippedElectronicAcceptance(order);
  const attributions = buildOrderRatingAttributions(order, ratings);
  const acceptedAt = order.acceptance!.acceptedAt ?? order.createdAt;
  const comment = order.acceptance?.comment;
  const entries: CustomerRatingEntry[] = attributions.map((a) => ({
    orderId: order.id,
    customerName: resolveOrderCustomerName(order),
    dispatchStore: order.dispatchStore,
    acceptedAt,
    role: a.role,
    roleLabel: a.roleLabel,
    personName: a.personName,
    stars: a.stars,
    comment,
  }));
  return {
    orderId: order.id,
    customerName: resolveOrderCustomerName(order),
    dispatchStore: order.dispatchStore,
    acceptedAt,
    avgRating: averageCustomerRating(ratings),
    comment,
    skippedDefaultRating: skippedDefault,
    attributions,
    entries,
  };
}

export function buildCustomerRatingEntries(orders: Order[]): CustomerRatingEntry[] {
  return orders
    .map(buildOrderCustomerRatingRecord)
    .filter((r): r is OrderCustomerRatingRecord => r != null)
    .flatMap((r) => r.entries)
    .sort(
      (a, b) =>
        new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime(),
    );
}

export function buildOrderCustomerRatingRecords(
  orders: Order[],
): OrderCustomerRatingRecord[] {
  return orders
    .map(buildOrderCustomerRatingRecord)
    .filter((r): r is OrderCustomerRatingRecord => r != null)
    .sort(
      (a, b) =>
        new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime(),
    );
}

export function aggregatePersonRatings(
  orders: Order[],
  role?: CustomerRatingRole,
): PersonRatingAggregate[] {
  const map = new Map<string, PersonRatingAggregate>();
  for (const record of buildOrderCustomerRatingRecords(orders)) {
    for (const attr of record.attributions) {
      if (role && attr.role !== role) continue;
      if (attr.role === "overall") continue;
      const name = attr.personName?.trim() || "未指定";
      const key = `${attr.role}:${name}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.avgStars =
          (existing.avgStars * (existing.count - 1) + attr.stars) / existing.count;
        existing.orderIds.push(record.orderId);
      } else {
        map.set(key, {
          role: attr.role,
          roleLabel: attr.roleLabel,
          personName: name,
          count: 1,
          avgStars: attr.stars,
          orderIds: [record.orderId],
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => b.avgStars - a.avgStars || b.count - a.count);
}

export function summarizeCustomerRatings(orders: Order[]): CustomerRatingSummary {
  const records = buildOrderCustomerRatingRecords(orders);
  const skippedCount = orders.filter((o) => isSkippedElectronicAcceptance(o)).length;
  const electronicCount = records.filter((r) => !r.skippedDefaultRating).length;
  const pendingScanCount = orders.filter((o) => o.status === "已安装").length;
  const ratedCount = records.length;

  if (ratedCount === 0) {
    return {
      ratedCount: 0,
      skippedCount,
      pendingScanCount,
      avgOverall: 0,
      avgByRole: { dispatcher: 0, designer: 0, installer: 0 },
      avgOverallSatisfaction: 0,
      electronicRate: ratedCount + skippedCount > 0 ? 0 : 0,
    };
  }

  let dispatcher = 0;
  let designer = 0;
  let installer = 0;
  let overallSat = 0;
  let overall = 0;

  for (const record of records) {
    overall += record.avgRating;
    for (const attr of record.attributions) {
      if (attr.role === "dispatcher") dispatcher += attr.stars;
      if (attr.role === "designer") designer += attr.stars;
      if (attr.role === "installer") installer += attr.stars;
      if (attr.role === "overall") overallSat += attr.stars;
    }
  }

  const n = ratedCount;
  const completed = electronicCount + skippedCount;
  return {
    ratedCount: n,
    skippedCount,
    pendingScanCount,
    avgOverall: overall / n,
    avgByRole: {
      dispatcher: dispatcher / n,
      designer: designer / n,
      installer: installer / n,
    },
    avgOverallSatisfaction: overallSat / n,
    electronicRate: completed > 0 ? electronicCount / completed : 1,
  };
}

export function filterOrdersByAcceptanceLookup(
  orders: Order[],
  filter: AcceptanceLookupFilter,
): Order[] {
  switch (filter) {
    case "待扫码":
      return orders.filter((o) => o.status === "已安装");
    case "已评价":
      return orders.filter((o) => getEffectiveAcceptanceRatings(o) != null);
    case "无电子验收":
      return orders.filter(
        (o) => o.status === "已验收" && o.acceptance?.skippedElectronicAccept,
      );
    case "全部":
    default:
      return orders.filter(
        (o) =>
          o.status === "已安装" ||
          (o.status === "已验收" &&
            (o.acceptance?.ratings || o.acceptance?.skippedElectronicAccept)),
      );
  }
}

export function formatPersonRatingAvg(avg: number | null | undefined): string {
  if (avg == null || avg <= 0) return "";
  return `${avg.toFixed(1)}★`;
}

export const DELIVERY_FLOW_STATUSES: FlowOrderStatus[] = [
  "已下单",
  "已安装",
  "已验收",
];

export function isDeliveryFlowOrder(order: Order): boolean {
  return DELIVERY_FLOW_STATUSES.includes(order.status as FlowOrderStatus);
}

export function filterDeliveryOrders(orders: Order[]): Order[] {
  return orders.filter(isDeliveryFlowOrder);
}

export interface StoreDeliveryPersonScope {
  store: StoreName | "全部";
  dispatcher: string | "全部";
  designer: string | "全部";
  installer: string | "全部";
}

export function formatStoreDeliveryScopeLabel(
  scope: StoreDeliveryPersonScope,
): string {
  return [
    `门店 ${scope.store}`,
    `派单人 ${scope.dispatcher}`,
    `设计师 ${scope.designer}`,
    `安装师 ${scope.installer}`,
  ].join(" · ");
}

function personRatingAvg(
  orders: Order[],
  role: Exclude<CustomerRatingRole, "overall">,
  selected: string | "全部",
  fallback: number,
): number {
  if (selected === "全部") return fallback;
  const aggregates = aggregatePersonRatings(orders, role);
  const match = aggregates.find((a) => {
    if (role === "dispatcher") {
      return (
        normalizeDispatcherName(a.personName) === normalizeDispatcherName(selected)
      );
    }
    return a.personName === selected;
  });
  return match?.avgStars ?? 0;
}

export function summarizeScopedStoreDeliveryRatings(
  orders: Order[],
  scope: StoreDeliveryPersonScope,
): CustomerRatingSummary & {
  scopeLabel: string;
  roleMetricLabels: Record<"dispatcher" | "designer" | "installer", string>;
} {
  const base = summarizeCustomerRatings(orders);
  return {
    ...base,
    avgByRole: {
      dispatcher: personRatingAvg(
        orders,
        "dispatcher",
        scope.dispatcher,
        base.avgByRole.dispatcher,
      ),
      designer: personRatingAvg(
        orders,
        "designer",
        scope.designer,
        base.avgByRole.designer,
      ),
      installer: personRatingAvg(
        orders,
        "installer",
        scope.installer,
        base.avgByRole.installer,
      ),
    },
    scopeLabel: formatStoreDeliveryScopeLabel(scope),
    roleMetricLabels: {
      dispatcher:
        scope.dispatcher === "全部" ? "派单人均分" : `${scope.dispatcher} 均分`,
      designer:
        scope.designer === "全部" ? "设计师均分" : `${scope.designer} 均分`,
      installer:
        scope.installer === "全部" ? "安装师均分" : `${scope.installer} 均分`,
    },
  };
}
