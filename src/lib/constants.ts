import type { CustomSpace, FlowOrderStatus, OrderStatus } from "./types";

export { DESIGNER_ROSTER, STORES } from "./designers";

export const CUSTOM_SPACES: CustomSpace[] = ["全屋", "橱柜", "衣柜", "房门"];

/** 主流程状态（按顺序推进） */
export const FLOW_ORDER_STATUSES: FlowOrderStatus[] = [
  "未派单",
  "待量尺",
  "已量尺",
  "已出图",
  "待签约",
  "已签约",
  "已下单",
  "已安装",
  "已验收",
];

/** 退单相关状态 */
export const REFUND_ORDER_STATUSES = ["待退单", "已退单"] as const;

/** 全部订单状态（含退单，用于筛选与统计） */
export const ORDER_STATUSES: OrderStatus[] = [
  ...FLOW_ORDER_STATUSES,
  ...REFUND_ORDER_STATUSES,
];

/** 可标记为待退单的主流程状态（不含已下单、已安装、已验收） */
export const REFUND_ELIGIBLE_STATUSES: FlowOrderStatus[] = [
  "未派单",
  "待量尺",
  "已量尺",
  "已出图",
  "待签约",
  "已签约",
];

/** 可关联增补单的主流程状态（已下单及之后） */
export const SUPPLEMENT_ELIGIBLE_STATUSES: FlowOrderStatus[] = [
  "已下单",
  "已安装",
  "已验收",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  未派单: "未派单",
  待量尺: "待量尺",
  已量尺: "已量尺",
  已出图: "已出图",
  待签约: "待签约",
  已签约: "已签约",
  已下单: "已下单",
  已安装: "已安装",
  已验收: "已验收",
  待退单: "待退单",
  已退单: "已退单",
};

/** 从「已下单」起仅管理员可撤回 */
export const ADMIN_ONLY_REVERT_STATUSES: FlowOrderStatus[] = [
  "已下单",
  "已安装",
  "已验收",
];

/** 须客户扫码完成，不可手动推进 */
export const CUSTOMER_GATE_STATUSES: FlowOrderStatus[] = ["待签约", "已安装"];

export const STORAGE_KEY = "custom-furniture-dispatch-data-v13";
export const LEGACY_STORAGE_KEYS = [
  "custom-furniture-dispatch-data-v12",
  "custom-furniture-dispatch-data-v11",
] as const;
