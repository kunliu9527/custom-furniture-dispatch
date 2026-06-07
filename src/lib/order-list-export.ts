import { formatCurrency, formatSpaces } from "./order-format";
import { resolveOrderCustomerName } from "./order-remark";
import { downloadCsv, rowToCsvLine, stampForFilename } from "./csv-utils";
import type { Order } from "./types";

const HEADERS = [
  "订单ID",
  "客户姓名",
  "电话",
  "地址",
  "定制空间",
  "预算",
  "定金",
  "订单金额",
  "售后金",
  "派单门店",
  "派单人",
  "设计师",
  "状态",
  "录单时间",
  "问题标签",
];

function orderToRow(order: Order): string[] {
  const createdAt =
    order.statusEnteredAt?.["未派单"] ??
    order.orderEvents?.find((e) => e.kind === "派单录入")?.at ??
    "";
  return [
    order.id,
    resolveOrderCustomerName(order),
    order.phone,
    order.address,
    formatSpaces(order.spaces),
    formatCurrency(order.budget),
    formatCurrency(order.deposit),
    order.orderAmount != null ? formatCurrency(order.orderAmount) : "",
    order.afterSalesAmount != null ? formatCurrency(order.afterSalesAmount) : "",
    order.dispatchStore,
    order.dispatcherName,
    order.designer ?? "",
    order.status,
    createdAt ? new Date(createdAt).toLocaleString("zh-CN") : "",
    (order.issueTags ?? []).join("、"),
  ];
}

export function exportOrdersToCsv(orders: Order[], label = "订单"): void {
  if (orders.length === 0) return;
  const lines = [
    rowToCsvLine(HEADERS),
    ...orders.map((order) => rowToCsvLine(orderToRow(order))),
  ];
  downloadCsv(`${label}-${stampForFilename()}.csv`, lines.join("\n"));
}
