import { applyStageIntervalOnAdvance } from "./stage-intervals";
import { createShortId } from "./create-id";
import { isSeedOrderId } from "./seed-order-id";
import { reconcileOrderBusinessRules } from "./workflow-remarks";
import type { Order } from "./types";

export interface BulkSkipSeedAcceptanceResult {
  orders: Order[];
  updatedCount: number;
  updatedIds: string[];
  skipped: {
    notSeed: number;
    notInstalled: number;
    alreadyAccepted: number;
    hasElectronicRating: number;
  };
}

export function shouldBulkSkipSeedAcceptance(order: Order): boolean {
  if (!isSeedOrderId(order.id)) return false;
  if (order.status !== "已安装") return false;
  if (order.acceptance?.ratings) return false;
  return true;
}

/** 与 orders-context skipElectronicAcceptance 字段一致（不写 orderEvents） */
export function applyBulkSkipElectronicAcceptance(
  order: Order,
  atIso: string,
): Order {
  const token = order.acceptance?.token ?? createShortId("ac");
  const intervalUpdates = applyStageIntervalOnAdvance(order, "已验收", atIso);
  return reconcileOrderBusinessRules({
    ...order,
    ...intervalUpdates,
    status: "已验收",
    acceptance: {
      token,
      initiatedAt: order.acceptance?.initiatedAt ?? atIso,
      acceptedAt: atIso,
      skippedElectronicAccept: true,
    },
  });
}

export function bulkSkipSeedInstalledOrders(
  orders: Order[],
  atIso = new Date().toISOString(),
): BulkSkipSeedAcceptanceResult {
  const updatedIds: string[] = [];
  const skipped = {
    notSeed: 0,
    notInstalled: 0,
    alreadyAccepted: 0,
    hasElectronicRating: 0,
  };

  const next = orders.map((order) => {
    if (!isSeedOrderId(order.id)) {
      if (order.status === "已安装") skipped.notSeed += 1;
      return order;
    }
    if (order.status === "已验收") {
      skipped.alreadyAccepted += 1;
      return order;
    }
    if (order.status !== "已安装") {
      skipped.notInstalled += 1;
      return order;
    }
    if (order.acceptance?.ratings) {
      skipped.hasElectronicRating += 1;
      return order;
    }

    updatedIds.push(order.id);
    return applyBulkSkipElectronicAcceptance(order, atIso);
  });

  return {
    orders: next,
    updatedCount: updatedIds.length,
    updatedIds,
    skipped,
  };
}
