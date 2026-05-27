import type { ViewMode } from "./manager-stats";
import type { AdminViewMode } from "./admin-stats";
import type { DrillFlow } from "./result-drill";
import type { DesignerName, OrderStatus } from "./types";

/** 设计经理看板：结果区钻取维度顺序 */
export function getManagerDrillFlow(
  viewMode: ViewMode,
  statusFilter: OrderStatus | "全部",
  designerFilter: DesignerName | "全部",
): DrillFlow {
  if (viewMode === "store") return ["status", "designer"];
  if (viewMode === "dispatcher") return ["status", "designer"];
  if (viewMode === "status" && statusFilter === "全部") {
    return ["status", "designer"];
  }
  if (viewMode === "status") return ["designer"];
  if (viewMode === "designer" && designerFilter === "全部") {
    return ["status", "designer"];
  }
  return ["status"];
}

/** 店长看板 */
export function getAdminDrillFlow(
  viewMode: AdminViewMode,
  designerFilter?: DesignerName | "全部",
): DrillFlow {
  if (viewMode === "store") return ["status", "dispatcher"];
  if (viewMode === "designer") {
    return designerFilter === "全部"
      ? ["status", "designer"]
      : ["status"];
  }
  if (viewMode === "dispatcher") return ["status", "designer"];
  return ["status", "designer"];
}
