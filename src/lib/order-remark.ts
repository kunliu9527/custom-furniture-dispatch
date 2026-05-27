import { formatWorkflowRemarkDisplay } from "./workflow-remarks";
import type { Order } from "./types";

export function isEmptyCustomerPhone(phone: string | undefined | null): boolean {
  const v = phone?.trim() ?? "";
  return !v || v === "—" || v === "-";
}

export function displayCustomerNameColumn(order: Order): string {
  const name = order.customerName?.trim() ?? "";
  if (!name || name === "—") return "";
  if (name === order.address.trim()) return "";
  return name;
}

export function displayCustomerPhoneColumn(order: Order): string {
  return isEmptyCustomerPhone(order.phone) ? "" : order.phone.trim();
}

export function displayCustomerAddressColumn(order: Order): string {
  const addr = order.address?.trim() ?? "";
  return addr || order.customerName?.trim() || "";
}

/** 表格「备注」列：按流程顺序拼接各阶段备注 */
export function formatWorkflowRemark(order: Order): string {
  return formatWorkflowRemarkDisplay(order);
}
