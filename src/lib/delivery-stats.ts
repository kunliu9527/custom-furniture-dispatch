import {
  filterDeliveryOrders,
  type AcceptanceLookupFilter,
} from "./customer-ratings";
import { formatOrderAmount } from "./order-format";
import type { FlowOrderStatus, Order } from "./types";

export type DeliveryViewMode = "status" | "installer" | "store" | "acceptance";

export interface InstallerDeliveryStats {
  installerName: string;
  total: number;
  byStatus: Record<"已下单" | "已安装" | "已验收", number>;
  avgInstallRating: number | null;
}

function emptyDeliveryStatusCounts(): Record<"已下单" | "已安装" | "已验收", number> {
  return { 已下单: 0, 已安装: 0, 已验收: 0 };
}

export function countDeliveryByStatus(
  orders: Order[],
): Record<FlowOrderStatus | "全部", number> {
  const delivery = filterDeliveryOrders(orders);
  const counts = {
    全部: delivery.length,
    已下单: 0,
    已安装: 0,
    已验收: 0,
  } as Record<FlowOrderStatus | "全部", number>;
  for (const order of delivery) {
    if (order.status === "已下单") counts["已下单"] += 1;
    if (order.status === "已安装") counts["已安装"] += 1;
    if (order.status === "已验收") counts["已验收"] += 1;
  }
  return counts;
}

export function sumDeliveryOrderAmount(orders: Order[]): number {
  return filterDeliveryOrders(orders).reduce((sum, order) => {
    const amount = order.orderAmount;
    return sum + (amount != null && amount > 0 ? amount : 0);
  }, 0);
}

export function formatDeliveryOrderAmountTotal(orders: Order[]): string {
  const total = sumDeliveryOrderAmount(orders);
  if (total <= 0) return "—";
  return formatOrderAmount(total);
}

export function filterOrdersByDeliveryStatus(
  orders: Order[],
  status: FlowOrderStatus | "全部",
): Order[] {
  const delivery = filterDeliveryOrders(orders);
  if (status === "全部") return delivery;
  return delivery.filter((o) => o.status === status);
}

export function getInstallerDeliveryStats(orders: Order[]): InstallerDeliveryStats[] {
  const delivery = filterDeliveryOrders(orders);
  const map = new Map<
    string,
    InstallerDeliveryStats & { installStars: number; ratingCount: number }
  >();

  for (const order of delivery) {
    const name = order.installation?.installerName?.trim() || "未指定";
    const existing = map.get(name) ?? {
      installerName: name,
      total: 0,
      byStatus: emptyDeliveryStatusCounts(),
      avgInstallRating: null,
      ratingCount: 0,
      installStars: 0,
    };
    existing.total += 1;
    if (order.status === "已下单") existing.byStatus["已下单"] += 1;
    if (order.status === "已安装") existing.byStatus["已安装"] += 1;
    if (order.status === "已验收") existing.byStatus["已验收"] += 1;

    const installStars = order.acceptance?.ratings?.installTeam;
    if (installStars) {
      existing.ratingCount += 1;
      existing.installStars += installStars;
      existing.avgInstallRating = existing.installStars / existing.ratingCount;
    }
    map.set(name, existing);
  }

  return [...map.values()]
    .map(({ installStars: _s, ratingCount: _c, ...rest }) => rest)
    .sort((a, b) => b.total - a.total || a.installerName.localeCompare(b.installerName, "zh-CN"));
}

export function filterOrdersByInstaller(
  orders: Order[],
  installer: string | "全部",
): Order[] {
  const delivery = filterDeliveryOrders(orders);
  if (installer === "全部") return delivery;
  return delivery.filter((o) => {
    const name = o.installation?.installerName?.trim() || "未指定";
    return name === installer;
  });
}

export function countAcceptanceLookup(
  orders: Order[],
): Record<AcceptanceLookupFilter, number> {
  const delivery = filterDeliveryOrders(orders);
  return {
    全部: delivery.filter(
      (o) =>
        o.status === "已安装" ||
        (o.status === "已验收" &&
          (o.acceptance?.ratings || o.acceptance?.skippedElectronicAccept)),
    ).length,
    待扫码: delivery.filter((o) => o.status === "已安装").length,
    已评价: delivery.filter((o) => Boolean(o.acceptance?.ratings)).length,
    无电子验收: delivery.filter(
      (o) => o.status === "已验收" && o.acceptance?.skippedElectronicAccept,
    ).length,
  };
}
