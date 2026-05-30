import { ResultSummaryShell } from "@/components/shared/result-summary-shell";
import { getManagerDrillFlow } from "@/lib/drill-flow";
import type { OrderAnomalyOptions } from "@/lib/order-anomaly";
import type { ViewMode } from "@/lib/manager-stats";
import type { SessionUser } from "@/lib/permissions";
import type { DrillFlow, ResultDrillFilters } from "@/lib/result-drill";
import type { DesignerName, Order, OrderStatus, SupplementOrder } from "@/lib/types";

interface ManagerResultSummaryProps {
  user: SessionUser | null;
  viewMode: ViewMode;
  orders: Order[];
  supplements: SupplementOrder[];
  statusFilter: OrderStatus | "全部";
  designerFilter: DesignerName | "全部";
  isKeywordSearch?: boolean;
  drill: ResultDrillFilters;
  onDrillChange: (drill: ResultDrillFilters) => void;
  anomalyOptions?: OrderAnomalyOptions;
}

export function ManagerResultSummary({
  user,
  viewMode,
  orders,
  supplements,
  statusFilter,
  designerFilter,
  isKeywordSearch = false,
  drill,
  onDrillChange,
  anomalyOptions,
}: ManagerResultSummaryProps) {
  const flow: DrillFlow = getManagerDrillFlow(
    viewMode,
    statusFilter,
    designerFilter,
    user,
  );

  return (
    <ResultSummaryShell
      baseOrders={orders}
      supplements={supplements}
      drill={drill}
      onDrillChange={onDrillChange}
      flow={flow}
      lookupStatusFilter={viewMode === "status" ? statusFilter : undefined}
      anomalyOptions={anomalyOptions}
    />
  );
}
