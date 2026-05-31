import type { OrderStatus } from "./types";

export type ManagerFocus =
  | "flow-timeout"
  | "sign-timeout"
  | "pending-acceptance"
  | "pending-refund";

export const MANAGER_FOCUS_LABELS: Record<ManagerFocus, string> = {
  "flow-timeout": "流程超时",
  "sign-timeout": "签约超时",
  "pending-acceptance": "待扫码验收",
  "pending-refund": "待退单",
};

export function managerFocusHref(focus: ManagerFocus): string {
  return `/manager?focus=${encodeURIComponent(focus)}`;
}

export function managerAnomalyTodosHref(options?: { orderId?: string }): string {
  const params = new URLSearchParams({ section: "reports" });
  if (options?.orderId) {
    params.set("orderId", options.orderId);
  }
  return `/manager?${params.toString()}`;
}

/** 项目进程管理 · 订单查询 */
export function managerOrderLookupHref(): string {
  return "/manager?section=lookup";
}

export function parseManagerFocus(raw: string | null): ManagerFocus | null {
  if (
    raw === "flow-timeout" ||
    raw === "sign-timeout" ||
    raw === "pending-acceptance" ||
    raw === "pending-refund"
  ) {
    return raw;
  }
  return null;
}

export function parseManagerOrderStatus(
  raw: string | null,
): OrderStatus | null {
  if (
    raw === "未派单" ||
    raw === "待量尺" ||
    raw === "已量尺" ||
    raw === "已出图" ||
    raw === "待签约" ||
    raw === "已签约" ||
    raw === "已下单" ||
    raw === "已安装" ||
    raw === "已验收" ||
    raw === "待退单" ||
    raw === "已退单"
  ) {
    return raw;
  }
  return null;
}
