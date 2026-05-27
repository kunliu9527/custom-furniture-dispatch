import type { DesignerName } from "./designers";

export type { DesignerName };

export type StoreName =
  | "东岸天冠"
  | "东岸万象"
  | "高桥天冠"
  | "郁金香天冠"
  | "郁金香万象"
  | "总部"
  | (string & {});

export type CustomSpace = "全屋" | "橱柜" | "衣柜" | "房门";

/** 主流程状态（线性推进） */
export type FlowOrderStatus =
  | "待量尺"
  | "已量尺"
  | "已出图"
  | "已签约"
  | "已下单"
  | "已安装";

/** 退单状态（独立于主流程，仅可在已下单之前标记） */
export type RefundOrderStatus = "待退单" | "已退单";

export type OrderStatus = FlowOrderStatus | RefundOrderStatus;

/** 主流程各段间隔（天），按 0.5 天取整记录 */
export interface StageIntervalDays {
  /** 待量尺 → 已量尺 */
  toMeasured?: number;
  /** 已量尺 → 已出图 */
  toDrawn?: number;
  /** 已出图 → 已签约 */
  toSigned?: number;
  /** 已签约 → 已下单 */
  toOrdered?: number;
}

/** 流程备注阶段：派单录入 + 订单状态 */
export type WorkflowRemarkStage = "派单录入" | OrderStatus;

export interface WorkflowRemarkEntry {
  stage: WorkflowRemarkStage;
  text: string;
  at: string;
}

/** 设计经理转派记录 */
export interface TransferRecord {
  id: string;
  fromDesigner: DesignerName;
  toDesigner: DesignerName;
  transferredAt: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  spaces: CustomSpace[];
  budget: number;
  dispatchStore: StoreName;
  deposit: number;
  orderAmount?: number | null;
  /** 售后金（元），由设计经理填写；无售后时为 null */
  afterSalesAmount?: number | null;
  dispatcherName: string;
  originalDesigner: DesignerName;
  designer: DesignerName;
  transferRecords: TransferRecord[];
  status: OrderStatus;
  /** @deprecated 旧版单条备注，读取时合并入 workflowRemarks */
  workflowRemark?: string | null;
  /** 按流程阶段累计的备注 */
  workflowRemarks?: WorkflowRemarkEntry[];
  /** 个人权限：已从该状态撤回过的记录（每环节限撤回一次） */
  revertedFromStatuses?: OrderStatus[];
  /** 进入各主流程状态的时间（用于间隔与超时计算） */
  statusEnteredAt?: Partial<Record<FlowOrderStatus, string>>;
  /** 各段流程间隔天数（0.5 天步长取整） */
  stageIntervalDays?: StageIntervalDays;
  /** 待量尺→已下单累计天数；无完整间隔记录时为 null */
  totalElapsedDays?: number | null;
  createdAt: string;
}

/** 增补单：仅记录已下单状态，代表补单完成 */
export interface SupplementOrder {
  id: string;
  parentOrderId: string;
  customerName: string;
  designer: DesignerName;
  supplementAmount: number;
  status: "已下单";
  createdAt: string;
}

export interface DispatchFormData {
  customerName: string;
  phone: string;
  address: string;
  spaces: CustomSpace[];
  budget: number;
  dispatchStore: StoreName;
  deposit: number;
  dispatcherName: string;
  designer: DesignerName;
  /** 派单录入时的备注 */
  dispatchRemark?: string;
}

export interface AppPersistedData {
  orders: Order[];
  supplements: SupplementOrder[];
}
