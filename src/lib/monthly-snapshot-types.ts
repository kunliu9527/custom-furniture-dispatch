import type { MonthlyReportOverview } from "./designer-performance";
import type { OrderIssueTag } from "./types";

export interface MonthlySnapshotDispatcherRow {
  key: string;
  label: string;
  contributionScore: number;
  newDispatchCount: number;
  depositTotal: number;
}

export interface MonthlySnapshotStoreRow {
  key: string;
  label: string;
  orderedCount: number;
  orderedAmount: number;
}

export interface MonthlyCockpitSnapshot {
  newDispatchCount: number;
  /** 新派单金额（驾驶舱同比用） */
  newDispatchAmount?: number;
  signedContractAmount: number;
  signedCount?: number;
  orderedAmount: number;
  orderedCount?: number;
  refundCount: number;
  refundAmount?: number;
  /** 已验收订单金额（驾驶舱同比用） */
  acceptedAmount?: number;
  acceptedCount?: number;
  acceptanceAvg: number | null;
  electronicAcceptanceRate?: number | null;
  pendingAcceptanceCount?: number;
  funnel: { key: string; label: string; count: number; rate: number | null }[];
  dispatchers?: MonthlySnapshotDispatcherRow[];
  stores?: MonthlySnapshotStoreRow[];
}

export interface MonthlySnapshotDesignerRow {
  key: string;
  label: string;
  orderedCount: number;
  orderedAmount: number;
  contributionScore: number;
  timeoutCount: number;
  refundCount: number;
}

export interface MonthlyMetricsSnapshot {
  yearMonth: string;
  savedAt: string;
  savedBy?: string;
  scopeLabel?: string;
  overview: MonthlyReportOverview;
  designers: MonthlySnapshotDesignerRow[];
  issueTagStats: { tag: OrderIssueTag; count: number }[];
  /** 综合看板驾驶舱归档（可选，向后兼容） */
  cockpit?: MonthlyCockpitSnapshot;
}

export interface MonthlySnapshotIndex {
  items: {
    yearMonth: string;
    savedAt: string;
    savedBy?: string;
    scopeLabel?: string;
  }[];
}
