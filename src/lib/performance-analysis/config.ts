import { normalizeDispatcherName } from "../admin-stats";
import { getDispatcherHomeStore } from "../dispatchers";
import {
  DESIGNER_NARRATIVE_FOOTNOTE,
  DISPATCHER_NARRATIVE_FOOTNOTE,
  STORE_NARRATIVE_FOOTNOTE,
} from "../performance-narrative-core";
import type { Order } from "../types";
import type { PerformanceAnalysisRole } from "./types";

export interface PerformanceAnalysisRoleConfig {
  role: PerformanceAnalysisRole;
  roleLabel: string;
  titleSuffix: string;
  teamScope: string;
  emptyDataMessage: string;
  footnote: string;
  isStore: boolean;
  matchPerson: (order: Order, name: string) => boolean;
}

export const DESIGNER_ANALYSIS_CONFIG: PerformanceAnalysisRoleConfig = {
  role: "designer",
  roleLabel: "设计师",
  titleSuffix: "设计师绩效评价",
  teamScope: "全员",
  emptyDataMessage: "当前周期与权限范围内暂无设计师订单数据。",
  footnote: DESIGNER_NARRATIVE_FOOTNOTE,
  isStore: false,
  matchPerson: (order, name) => order.designer === name,
};

export const DISPATCHER_ANALYSIS_CONFIG: PerformanceAnalysisRoleConfig = {
  role: "dispatcher",
  roleLabel: "派单人",
  titleSuffix: "派单人绩效评价",
  teamScope: "全体派单人",
  emptyDataMessage: "当前周期与权限范围内暂无派单人订单数据。",
  footnote: DISPATCHER_NARRATIVE_FOOTNOTE,
  isStore: false,
  matchPerson: (order, name) =>
    normalizeDispatcherName(order.dispatcherName) === name,
};

export const STORE_ANALYSIS_CONFIG: PerformanceAnalysisRoleConfig = {
  role: "store",
  roleLabel: "店面",
  titleSuffix: "各店面绩效评价",
  teamScope: "全部门店",
  emptyDataMessage: "当前周期与权限范围内暂无店面订单数据。",
  footnote: STORE_NARRATIVE_FOOTNOTE,
  isStore: true,
  matchPerson: (order, storeName) =>
    getDispatcherHomeStore(order.dispatcherName, order.dispatchStore) ===
    storeName,
};

export function getPerformanceAnalysisConfig(
  role: PerformanceAnalysisRole,
): PerformanceAnalysisRoleConfig {
  switch (role) {
    case "designer":
      return DESIGNER_ANALYSIS_CONFIG;
    case "dispatcher":
      return DISPATCHER_ANALYSIS_CONFIG;
    case "store":
      return STORE_ANALYSIS_CONFIG;
  }
}

export const PERFORMANCE_ANALYSIS_METRIC_DEFINITIONS: Record<string, string> = {
  conversionRate: "已下单金额 ÷ 合计金额（未下单 + 已下单 + 待退单 + 已退单）",
  averageOrderAmount: "已下单金额 ÷ 已下单数量",
  pipelineAmount: "未下单金额 + 待退单金额",
  refundAmount: "待退单金额 + 已退单金额",
  refundRate: "退单金额 ÷ 合计金额",
  totalRank: "按合计金额降序排名，剔除合计为 0",
  conversionSample: "转化评价需合计 ≥ 5 单",
};
