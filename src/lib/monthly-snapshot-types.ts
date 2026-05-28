import type { MonthlyReportOverview } from "./designer-performance";
import type { OrderIssueTag } from "./types";

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
}

export interface MonthlySnapshotIndex {
  items: { yearMonth: string; savedAt: string; savedBy?: string }[];
}
