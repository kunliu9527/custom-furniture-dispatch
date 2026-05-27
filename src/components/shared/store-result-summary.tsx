import { ResultSummaryShell } from "@/components/shared/result-summary-shell";
import { getAdminDrillFlow } from "@/lib/drill-flow";
import { getManagerDrillFlow } from "@/lib/drill-flow";
import type { ViewMode } from "@/lib/manager-stats";
import type { AdminViewMode } from "@/lib/admin-stats";
import type { ResultDrillFilters } from "@/lib/result-drill";
import type { DesignerName, Order, OrderStatus, StoreName, SupplementOrder } from "@/lib/types";

interface StoreResultSummaryProps {
  orders: Order[];
  supplements: SupplementOrder[];
  storeFilter: StoreName | "全部";
  isKeywordSearch?: boolean;
  drill: ResultDrillFilters;
  onDrillChange: (drill: ResultDrillFilters) => void;
  /** admin 店长看板 | manager 设计经理看板 */
  board?: "admin" | "manager";
  managerViewMode?: ViewMode;
  statusFilter?: OrderStatus | "全部";
  designerFilter?: DesignerName | "全部";
}

export function StoreResultSummary({
  orders,
  supplements,
  storeFilter,
  isKeywordSearch = false,
  drill,
  onDrillChange,
  board = "manager",
  managerViewMode = "store",
  statusFilter = "全部",
  designerFilter = "全部",
}: StoreResultSummaryProps) {
  const flow =
    board === "admin"
      ? getAdminDrillFlow("store" as AdminViewMode)
      : getManagerDrillFlow(managerViewMode, statusFilter, designerFilter);

  return (
    <ResultSummaryShell
      title={board === "admin" ? "查找结果统计" : "门店汇总统计"}
      baseOrders={orders}
      supplements={supplements}
      drill={drill}
      onDrillChange={onDrillChange}
      flow={flow}
      totalAmountClassName={
        board === "admin" ? "text-emerald-700" : "text-violet-700"
      }
    />
  );
}
