import type { ViewMode } from "./manager-stats";
import type { SessionUser } from "./permissions";
import type { DrillFlow } from "./result-drill";
import type { DesignerName, OrderStatus } from "./types";

/** 按状态查找时，结果区第二维度：设计师看派单人，其余看设计师 */
export function getStatusViewSecondaryDimension(
  user: SessionUser | null,
): "designer" | "dispatcher" {
  return user?.role === "designer" ? "dispatcher" : "designer";
}

/** 设计经理看板：结果区钻取维度顺序 */
export function getManagerDrillFlow(
  viewMode: ViewMode,
  statusFilter: OrderStatus | "全部",
  designerFilter: DesignerName | "全部",
  user: SessionUser | null = null,
): DrillFlow {
  if (viewMode === "store") return ["status", "designer"];
  if (viewMode === "dispatcher") return ["status", "designer"];
  if (viewMode === "status") {
    return [getStatusViewSecondaryDimension(user)];
  }
  if (viewMode === "designer" && designerFilter === "全部") {
    return ["status", "designer"];
  }
  return ["status"];
}
