import { formatWorkflowRemarkDisplay } from "./workflow-remarks";
import type { Order } from "./types";

export function isEmptyCustomerPhone(phone: string | undefined | null): boolean {
  const v = phone?.trim() ?? "";
  return !v || v === "—" || v === "-";
}

function isBlankOrderField(value: string | undefined | null): boolean {
  const v = value?.trim() ?? "";
  return !v || v === "—" || v === "-";
}

/** 订单名称：优先地址，无有效地址时用客户姓名 */
export function resolveOrderDisplayName(
  order: Pick<Order, "customerName" | "address">,
): string {
  const addr = order.address?.trim() ?? "";
  if (!isBlankOrderField(addr)) return addr;
  const name = order.customerName?.trim() ?? "";
  if (!isBlankOrderField(name)) return name;
  return "";
}

/** 客户姓名（录单填写的联系人，与地址无关） */
export function resolveOrderCustomerName(
  order: Pick<Order, "customerName" | "address">,
): string {
  const name = order.customerName?.trim() ?? "";
  if (isBlankOrderField(name)) return "";
  const addr = order.address?.trim() ?? "";
  if (!isBlankOrderField(addr) && name === addr) return "";
  return name;
}

export function displayCustomerNameColumn(order: Order): string {
  return resolveOrderCustomerName(order);
}

export function displayCustomerAddressColumn(order: Order): string {
  const addr = order.address?.trim() ?? "";
  return addr || "—";
}

export function displayOrderNameColumn(order: Order): string {
  return resolveOrderDisplayName(order) || "—";
}

export function displayCustomerPhoneColumn(order: Order): string {
  return isEmptyCustomerPhone(order.phone) ? "" : order.phone.trim();
}

/** 表格「备注」列：按流程顺序拼接各阶段备注 */
export function formatWorkflowRemark(order: Order): string {
  return formatWorkflowRemarkDisplay(order);
}
