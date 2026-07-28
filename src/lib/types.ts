import type { DesignerName } from "./designers";
import type { OrderMeasurement } from "./measure/types";

export type { DesignerName, OrderMeasurement };

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
  | "未派单"
  | "待量尺"
  | "已量尺"
  | "已出图"
  | "待签约"
  | "已签约"
  | "已下单"
  | "已安装"
  | "已验收";

/** 退单状态（独立于主流程，仅可在已下单之前标记） */
export type RefundOrderStatus = "待退单" | "已退单";

export type OrderStatus = FlowOrderStatus | RefundOrderStatus;

/** 主流程各段间隔（天），按 0.5 天取整记录 */
export interface StageIntervalDays {
  /** 待量尺 → 已量尺 */
  toMeasured?: number;
  /** 已量尺 → 已出图 */
  toDrawn?: number;
  /** 已出图 → 待签约（进入签约等待） */
  toPendingSign?: number;
  /** 待签约 → 已签约 */
  toSigned?: number;
  /** 已签约 → 已下单 */
  toOrdered?: number;
  /** 已下单 → 已安装 */
  toInstalled?: number;
  /** 已安装 → 已验收 */
  toAccepted?: number;
}

/** 流程备注阶段：派单录入 + 订单状态 */
export type WorkflowRemarkStage = "派单录入" | OrderStatus;

export interface WorkflowRemarkEntry {
  stage: WorkflowRemarkStage;
  text: string;
  at: string;
}

/** 订单操作日志（推进、转派、退单等） */
export type OrderEventKind =
  | "派单录入"
  | "指派设计师"
  | "发起签约"
  | "客户签约"
  | "线下签约"
  | "跳过电子签约"
  | "发起验收"
  | "客户验收"
  | "跳过电子验收"
  | "状态推进"
  | "状态撤回"
  | "待退单"
  | "已退单"
  | "转派"
  | "增补单"
  | "售后金"
  | "接单确认"
  | "量尺记录"
  | "流程备注"
  | "问题标记";

export interface OrderEvent {
  id: string;
  kind: OrderEventKind;
  at: string;
  actorName: string;
  fromStatus?: OrderStatus;
  toStatus?: OrderStatus;
  note?: string;
}

/** 设计经理标记的问题类型 */
export type OrderIssueTag =
  | "效果图未过"
  | "工艺错误"
  | "沟通问题"
  | "客户变卦"
  | "派单信息不全"
  | "效率过慢"
  | "其他";

/** 设计经理转派记录 */
export interface TransferRecord {
  id: string;
  fromDesigner: DesignerName;
  toDesigner: DesignerName;
  transferredAt: string;
}

export interface ContractAttachment {
  name: string;
  url?: string;
}

export interface OrderContract {
  token: string;
  contractAmount: number;
  /** 发起签约时确认的已交定金（快照） */
  depositPaid?: number;
  deliveryDate?: string;
  attachments?: ContractAttachment[];
  termsNote?: string;
  initiatedAt: string;
  initiatedBy?: string;
  signedAt?: string;
  signatureDataUrl?: string;
  signedByName?: string;
  /** 经理线下确认已签 */
  offlineConfirmed?: boolean;
  /** 客户方案确认 */
  planConfirmed?: boolean;
  planConfirmRemark?: string;
  planConfirmedAt?: string;
  /** 发起签约时快照的标准合同正文 */
  standardContractText?: string;
  /** 跳过电子签约（经理操作） */
  skippedElectronicSign?: boolean;
  /** 签约完成后锁定，非管理员不可撤回 */
  signLocked?: boolean;
}

export interface OrderInstallation {
  installedAt?: string;
  installerName?: string;
  installerStaffId?: string;
  /** 已安装阶段备注 */
  installStageRemark?: string;
}

export interface CustomerRatings {
  salesManager: 1 | 2 | 3 | 4 | 5;
  designer: 1 | 2 | 3 | 4 | 5;
  installTeam: 1 | 2 | 3 | 4 | 5;
  product: 1 | 2 | 3 | 4 | 5;
}

/** 验收提交时快照的被评价人，与星级一一对应 */
export interface OrderAcceptanceRatedPersons {
  dispatcherName: string;
  designer: string | null;
  installerName: string | null;
}

export interface OrderAcceptance {
  token: string;
  initiatedAt: string;
  acceptedAt?: string;
  ratings?: CustomerRatings;
  /** 提交评价时的派单人/设计师/安装师快照 */
  ratedPersons?: OrderAcceptanceRatedPersons;
  /** 生成验收码时快照的客户姓名（录单「客户姓名」） */
  customerDisplayName?: string;
  comment?: string;
  hasInstallIssue?: boolean;
  /** 无电子验收直接更新 */
  skippedElectronicAccept?: boolean;
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
  /** 量尺前未交定、流程中补交定金后自动标记 */
  preMeasureDeposit?: boolean;
  /** 最近一次修改定金时间 */
  depositUpdatedAt?: string;
  orderAmount?: number | null;
  /** 售后金（元），由设计经理填写；无售后时为 null */
  afterSalesAmount?: number | null;
  dispatcherName: string;
  originalDesigner: DesignerName | null;
  designer: DesignerName | null;
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
  /** 设计师确认接单时间 */
  designerAcceptedAt?: string | null;
  /** 易测量量尺记录 */
  measurement?: OrderMeasurement | null;
  /** 操作日志 */
  orderEvents?: OrderEvent[];
  /** 问题标签（经理维护） */
  issueTags?: OrderIssueTag[];
  /** 电子签约 */
  contract?: OrderContract | null;
  /** 安装信息 */
  installation?: OrderInstallation | null;
  /** 客户验收评价 */
  acceptance?: OrderAcceptance | null;
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

export type DispatchMode = "entry_only" | "direct_dispatch";

export interface DispatchFormData {
  customerName: string;
  phone: string;
  address: string;
  spaces: CustomSpace[];
  budget: number;
  dispatchStore: StoreName;
  deposit: number;
  dispatcherName: string;
  designer: DesignerName | null;
  /** 仅录信息（待派单）或 直接派单 */
  dispatchMode: DispatchMode;
  /** 派单录入时的备注 */
  dispatchRemark?: string;
  /** 设计经理确认超额派单 */
  forceOverCapacity?: boolean;
  /** 经理确认忽略地址重复 */
  forceDuplicateAddress?: boolean;
}

export interface AppPersistedData {
  orders: Order[];
  supplements: SupplementOrder[];
}
