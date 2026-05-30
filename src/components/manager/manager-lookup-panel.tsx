"use client";

import { DispatcherResultSummary } from "@/components/admin/dispatcher-result-summary";
import { DispatcherSummaryBar } from "@/components/admin/dispatcher-summary-bar";
import { DesignerSummaryBar } from "@/components/manager/designer-summary-bar";
import { ManagerOrderTable } from "@/components/manager/manager-order-table";
import { ManagerResultSummary } from "@/components/manager/manager-result-summary";
import { ManagerSupplementTable } from "@/components/manager/manager-supplement-table";
import { StatusSummaryBar } from "@/components/manager/status-summary-bar";
import { ViewTabs } from "@/components/manager/view-tabs";
import { StoreResultSummary } from "@/components/shared/store-result-summary";
import { StoreSummaryBar } from "@/components/shared/store-summary-bar";
import { useAuth } from "@/context/auth-context";
import type { ViewMode, DesignerOrderStats } from "@/lib/manager-stats";
import type { DispatcherOrderStats } from "@/lib/admin-stats";
import type { StoreOrderStats } from "@/lib/store-stats";
import { drillFilterLabel, type ResultDrillFilters } from "@/lib/result-drill";
import {
  getVisibleManagerViewModes,
} from "@/lib/lookup-scope";
import { CrossStoreAssignHint } from "@/components/shared/cross-store-assign-hint";
import { showLookupAllOption, showStoreSummaryAllOption, isPersonalDispatcherLookup } from "@/lib/permissions";
import type { SessionUser } from "@/lib/permissions";
import type {
  DesignerName,
  Order,
  OrderIssueTag,
  OrderStatus,
  StoreName,
  SupplementOrder,
} from "@/lib/types";

interface ManagerLookupPanelProps {
  user: SessionUser | null;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isSearching: boolean;
  statusFilter: OrderStatus | "全部";
  onStatusFilterChange: (value: OrderStatus | "全部") => void;
  designerFilter: DesignerName | "全部";
  onDesignerFilterChange: (value: DesignerName | "全部") => void;
  dispatcherFilter: string | "全部";
  onDispatcherFilterChange: (value: string | "全部") => void;
  storeFilter: StoreName | "全部";
  onStoreFilterChange: (value: StoreName | "全部") => void;
  statusCounts: Record<OrderStatus, number>;
  designerStats: DesignerOrderStats[];
  dispatcherStats: DispatcherOrderStats[];
  storeStats: StoreOrderStats[];
  periodScopedOrderCount: number;
  designerLookupOrderCount: number;
  dispatcherLookupOrderCount: number;
  managedStoresLabel: string;
  filteredOrders: Order[];
  displayOrders: Order[];
  supplements: SupplementOrder[];
  filteredSupplements: SupplementOrder[];
  orderTableDetailMode: boolean;
  managerReadOnly: boolean;
  isOrderReadOnly: (order: Order) => boolean;
  designerRoster?: readonly { name: string; homeStore: StoreName }[];
  onReassign?: (orderId: string, designer: DesignerName) => void;
  onSetAfterSalesAmount?: (orderId: string, amount: number | null) => void;
  onSetIssueTags?: (orderId: string, tags: OrderIssueTag[]) => void;
  resultDrill: ResultDrillFilters;
  onResultDrillChange: (drill: ResultDrillFilters) => void;
  /** 覆盖默认空列表文案（强定位 none/ambiguous 等） */
  lookupEmptyMessage?: string;
}

function lookupEmptyMessage(
  viewMode: ViewMode,
  isSearching: boolean,
  resultDrill: ResultDrillFilters,
): string {
  if (isSearching) return "未找到匹配的订单";
  const drillLabel = drillFilterLabel(resultDrill);
  if (drillLabel) return `当前筛选（${drillLabel}）下暂无订单`;
  switch (viewMode) {
    case "dispatcher":
      return "该派单人暂无相关订单";
    case "store":
      return "该门店暂无相关订单";
    case "designer":
      return "该设计师暂无承接订单";
    default:
      return "该状态下暂无订单";
  }
}

export function ManagerLookupPanel({
  user,
  viewMode,
  onViewModeChange,
  isSearching,
  statusFilter,
  onStatusFilterChange,
  designerFilter,
  onDesignerFilterChange,
  dispatcherFilter,
  onDispatcherFilterChange,
  storeFilter,
  onStoreFilterChange,
  statusCounts,
  designerStats,
  dispatcherStats,
  storeStats,
  periodScopedOrderCount,
  designerLookupOrderCount,
  dispatcherLookupOrderCount,
  managedStoresLabel,
  filteredOrders,
  displayOrders,
  supplements,
  filteredSupplements,
  orderTableDetailMode,
  managerReadOnly,
  isOrderReadOnly,
  designerRoster,
  onReassign,
  onSetAfterSalesAmount,
  onSetIssueTags,
  resultDrill,
  onResultDrillChange,
  lookupEmptyMessage: lookupEmptyMessageOverride,
}: ManagerLookupPanelProps) {
  const { designerHomeStoreIndex } = useAuth();
  const anomalyOptions = {
    highlightCrossStore: true,
    designerHomeStoreIndex,
  };
  const storeSummaryShowAll = showStoreSummaryAllOption(user);
  const visibleViewModes = getVisibleManagerViewModes(user);
  const personalDispatcher = isPersonalDispatcherLookup(user);
  const emptyMessage =
    lookupEmptyMessageOverride ??
    lookupEmptyMessage(viewMode, isSearching, resultDrill);

  return (
    <div className="space-y-4">
      <ViewTabs
        value={viewMode}
        onChange={onViewModeChange}
        modes={visibleViewModes}
      />

      {!isSearching ? (
        <section className="space-y-2">
          {personalDispatcher && viewMode === "designer" ? (
            <CrossStoreAssignHint />
          ) : null}
          {viewMode === "dispatcher" && managedStoresLabel ? (
            <p className="text-xs text-slate-500">{managedStoresLabel}</p>
          ) : null}
          {viewMode === "status" ? (
            <StatusSummaryBar
              counts={statusCounts}
              total={periodScopedOrderCount}
              selected={statusFilter}
              onSelect={onStatusFilterChange}
            />
          ) : viewMode === "dispatcher" ? (
            <DispatcherSummaryBar
              stats={dispatcherStats}
              total={dispatcherLookupOrderCount}
              selected={dispatcherFilter}
              onSelect={onDispatcherFilterChange}
              showAllOption={showLookupAllOption(user, "dispatcher")}
            />
          ) : viewMode === "designer" ? (
            <DesignerSummaryBar
              stats={designerStats}
              total={designerLookupOrderCount}
              selected={designerFilter}
              onSelect={onDesignerFilterChange}
              showAllOption={showLookupAllOption(user, "designer")}
            />
          ) : (
            <StoreSummaryBar
              stats={storeStats}
              total={periodScopedOrderCount}
              selected={storeFilter}
              onSelect={onStoreFilterChange}
              accent="indigo"
              showAllOption={storeSummaryShowAll}
            />
          )}
        </section>
      ) : null}

      <section className="space-y-3">
        {viewMode === "dispatcher" ? (
          <DispatcherResultSummary
            orders={filteredOrders}
            supplements={supplements}
            dispatcherFilter={dispatcherFilter}
            isKeywordSearch={isSearching}
            drill={resultDrill}
            onDrillChange={onResultDrillChange}
            anomalyOptions={anomalyOptions}
          />
        ) : viewMode === "store" ? (
          <StoreResultSummary
            orders={filteredOrders}
            supplements={supplements}
            storeFilter={storeFilter}
            isKeywordSearch={isSearching}
            drill={resultDrill}
            onDrillChange={onResultDrillChange}
            managerViewMode={viewMode}
            statusFilter={statusFilter}
            designerFilter={designerFilter}
            anomalyOptions={anomalyOptions}
          />
        ) : (
          <ManagerResultSummary
            user={user}
            viewMode={viewMode}
            orders={filteredOrders}
            supplements={supplements}
            statusFilter={statusFilter}
            designerFilter={designerFilter}
            isKeywordSearch={isSearching}
            drill={resultDrill}
            onDrillChange={onResultDrillChange}
            anomalyOptions={anomalyOptions}
          />
        )}

        <ManagerOrderTable
          orders={displayOrders}
          supplements={supplements}
          detailMode={orderTableDetailMode}
          showDesigner
          readOnly={managerReadOnly}
          isOrderReadOnly={isOrderReadOnly}
          designerRoster={designerRoster}
          onReassign={onReassign}
          onSetAfterSalesAmount={onSetAfterSalesAmount}
          onSetIssueTags={onSetIssueTags}
          emptyMessage={emptyMessage}
        />
      </section>

      {filteredSupplements.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">增补单明细</h2>
          <ManagerSupplementTable supplements={filteredSupplements} />
        </section>
      ) : null}
    </div>
  );
}
