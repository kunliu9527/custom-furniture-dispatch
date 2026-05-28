"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RouteGuard } from "@/components/auth/route-guard";
import { DesignerSummaryBar } from "@/components/manager/designer-summary-bar";
import { DispatcherResultSummary } from "@/components/admin/dispatcher-result-summary";
import { DispatcherSummaryBar } from "@/components/admin/dispatcher-summary-bar";
import { ManagerResultSummary } from "@/components/manager/manager-result-summary";
import { ManagerSupplementTable } from "@/components/manager/manager-supplement-table";
import { ManagerOrderTable } from "@/components/manager/manager-order-table";
import { StatusSummaryBar } from "@/components/manager/status-summary-bar";
import { ViewTabs } from "@/components/manager/view-tabs";
import { LookupSectionHeading } from "@/components/shared/lookup-section-heading";
import { OrderSearchBar } from "@/components/manager/order-search-bar";
import { StoreResultSummary } from "@/components/shared/store-result-summary";
import { StoreSummaryBar } from "@/components/shared/store-summary-bar";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import {
  formatManagedStoresLabel,
  resolveAssignedStoresForUser,
} from "@/lib/assigned-stores";
import {
  canEditManagerPage,
  canModifyOrderInUserScope,
  hasFullOrderScope,
  resolveManagedStoreForLookup,
  resolveDesignerLookupStores,
  resolveDispatcherStatsStoreFilter,
  scopeOrdersForDispatcherLookup,
  scopeOrdersForDesignerLookup,
  scopeOrdersForUser,
  showLookupAllOption,
  showStoreSummaryAllOption,
} from "@/lib/permissions";
import { canAccessManagerPage } from "@/lib/nav-access";
import {
  getDefaultDispatcherFilter,
  getManagerRoleDefaults,
} from "@/lib/role-routes";
import {
  filterOrdersByDispatcher,
  getDispatcherStats,
} from "@/lib/admin-stats";
import {
  filterOrdersByDispatcherAffiliatedStore,
  resolveUserHomeStore,
} from "@/lib/store-manager-scope";
import {
  countOrdersByStatus,
  filterOrdersByDesigner,
  filterOrdersByStatus,
  getDesignerStats,
  type ViewMode,
} from "@/lib/manager-stats";
import { getEffectiveDesignersInStores } from "@/lib/designer-staff-store";
import { searchOrders } from "@/lib/order-search";
import {
  filterOrdersByDispatcherStore,
  filterStoreStatsByStores,
  getStoreStatsByDispatcher,
} from "@/lib/store-stats";
import {
  applyResultDrillFilters,
  drillFilterLabel,
  EMPTY_RESULT_DRILL,
  type ResultDrillFilters,
} from "@/lib/result-drill";
import { DispatchTotalsSummary } from "@/components/shared/dispatch-totals-summary";
import { sumDispatchTotals } from "@/lib/dispatch-totals";
import { filterSupplementsByOrders } from "@/lib/supplement-filter";
import { isSingleOrderDetailView } from "@/lib/order-utils";
import { getSessionResetKey } from "@/lib/session-user";
import { useOnSessionScopeChange } from "@/lib/use-on-session-scope-change";
import type { DesignerName, Order, OrderStatus, StoreName } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState } from "react";

function sortOrdersNewestFirst<T extends { createdAt: string }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export default function ManagerPage() {
  const { user, staffRecords, designerHomeStoreIndex } = useAuth();
  const { orders, supplements, isHydrated, reassignOrder, setAfterSalesAmount } =
    useOrders();
  const managerReadOnly = !canEditManagerPage(user);
  const [viewMode, setViewMode] = useState<ViewMode>("status");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "全部">("全部");
  const [designerFilter, setDesignerFilter] = useState<DesignerName | "全部">(
    "全部",
  );
  const [dispatcherFilter, setDispatcherFilter] = useState<string | "全部">(
    "全部",
  );
  const [storeFilter, setStoreFilter] = useState<StoreName | "全部">("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [resultDrill, setResultDrill] =
    useState<ResultDrillFilters>(EMPTY_RESULT_DRILL);

  const assignedStores = user ? resolveAssignedStoresForUser(user) : [];
  const managedStore = user ? resolveManagedStoreForLookup(user) : null;
  const managedStoresLabel =
    assignedStores.length > 0
      ? formatManagedStoresLabel(assignedStores)
      : managedStore ?? "";
  const storeSummaryShowAll = showStoreSummaryAllOption(user);

  const isOrderReadOnly = useCallback(
    (order: Order) =>
      managerReadOnly || !canModifyOrderInUserScope(user, order),
    [managerReadOnly, user],
  );

  const sessionResetKey = getSessionResetKey(user);

  const scopedOrders = useMemo(
    () => scopeOrdersForUser(orders, user),
    [orders, user],
  );

  const dispatcherLookupOrders = useMemo(
    () => scopeOrdersForDispatcherLookup(orders, user),
    [orders, user],
  );

  const designerLookupStores = resolveDesignerLookupStores(user);

  const reassignDesignerRoster = useMemo(() => {
    if (!designerLookupStores?.length) return undefined;
    return getEffectiveDesignersInStores(
      designerLookupStores,
      designerHomeStoreIndex,
      staffRecords,
    );
  }, [designerLookupStores, designerHomeStoreIndex, staffRecords]);

  const designerLookupOrders = useMemo(
    () => scopeOrdersForDesignerLookup(orders, user, staffRecords),
    [orders, user, staffRecords],
  );

  const statusCounts = useMemo(
    () => countOrdersByStatus(scopedOrders),
    [scopedOrders],
  );
  const designerStats = useMemo(
    () =>
      getDesignerStats(
        designerLookupOrders,
        designerLookupStores,
        designerHomeStoreIndex,
        staffRecords,
      ),
    [
      designerLookupOrders,
      designerLookupStores,
      designerHomeStoreIndex,
      staffRecords,
    ],
  );
  const storeStats = useMemo(() => {
    const all = getStoreStatsByDispatcher(scopedOrders);
    if (hasFullOrderScope(user)) return all;
    if (assignedStores.length > 0) {
      return filterStoreStatsByStores(all, assignedStores);
    }
    if (managedStore) {
      return all.filter((s) => s.store === managedStore);
    }
    return all;
  }, [scopedOrders, assignedStores, managedStore, user]);
  const dispatcherStatsStoreFilter = useMemo(
    () => resolveDispatcherStatsStoreFilter(user),
    [user],
  );
  const dispatcherStats = useMemo(
    () =>
      getDispatcherStats(
        dispatcherLookupOrders,
        staffRecords,
        dispatcherStatsStoreFilter,
      ),
    [dispatcherLookupOrders, staffRecords, dispatcherStatsStoreFilter],
  );

  const searchResults = useMemo(() => {
    const base =
      viewMode === "dispatcher"
        ? dispatcherLookupOrders
        : viewMode === "designer"
          ? designerLookupOrders
          : scopedOrders;
    return sortOrdersNewestFirst(searchOrders(base, searchQuery));
  }, [
    viewMode,
    dispatcherLookupOrders,
    designerLookupOrders,
    scopedOrders,
    searchQuery,
  ]);

  const isSearching = searchQuery.trim().length > 0;

  const filteredOrders = useMemo(() => {
    if (isSearching) return searchResults;
    const sorted = sortOrdersNewestFirst(
      viewMode === "designer" ? designerLookupOrders : scopedOrders,
    );
    if (viewMode === "status") {
      return filterOrdersByStatus(sorted, statusFilter);
    }
    if (viewMode === "designer") {
      return filterOrdersByDesigner(sorted, designerFilter);
    }
    if (viewMode === "dispatcher") {
      return filterOrdersByDispatcher(
        sortOrdersNewestFirst(dispatcherLookupOrders),
        dispatcherFilter,
      );
    }
    return filterOrdersByDispatcherStore(sorted, storeFilter);
  }, [
    scopedOrders,
    designerLookupOrders,
    dispatcherLookupOrders,
    viewMode,
    statusFilter,
    designerFilter,
    dispatcherFilter,
    storeFilter,
    isSearching,
    searchResults,
  ]);

  const dispatchTotals = useMemo(
    () => sumDispatchTotals(filteredOrders, supplements),
    [filteredOrders, supplements],
  );

  const displayOrders = useMemo(
    () => applyResultDrillFilters(filteredOrders, resultDrill),
    [filteredOrders, resultDrill],
  );

  const filteredSupplements = useMemo(
    () => filterSupplementsByOrders(supplements, displayOrders),
    [supplements, displayOrders],
  );

  const orderTableDetailMode = isSingleOrderDetailView(displayOrders);

  const resetManagerBoardForSession = useCallback(() => {
    if (!user) return;
    const defaults = getManagerRoleDefaults(user, staffRecords);
    setDesignerFilter(defaults.designerFilter);
    setStoreFilter(defaults.storeFilter);
    setDispatcherFilter(defaults.dispatcherFilter);
    setStatusFilter("全部");
    setSearchQuery("");
    setResultDrill(EMPTY_RESULT_DRILL);
    if (user.role === "designer") {
      setViewMode("designer");
    }
  }, [user, staffRecords]);

  useOnSessionScopeChange(sessionResetKey, resetManagerBoardForSession);

  useEffect(() => {
    if (!user) return;
    setStatusFilter("全部");
    if (user.role === "dispatcher") {
      const defaults = getManagerRoleDefaults(user, staffRecords);
      if (viewMode === "designer") {
        setDesignerFilter(defaults.designerFilter);
      }
      if (viewMode === "store") {
        setStoreFilter(defaults.storeFilter);
      }
    } else if (!hasFullOrderScope(user) && user.role !== "designer") {
      setDesignerFilter("全部");
      setStoreFilter(getManagerRoleDefaults(user, staffRecords).storeFilter);
    }
    setSearchQuery("");
    setResultDrill(EMPTY_RESULT_DRILL);
    if (viewMode === "dispatcher") {
      setDispatcherFilter(getDefaultDispatcherFilter(user, staffRecords));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅切换 Tab 时重置
  }, [viewMode, user]);

  useEffect(() => {
    if (!user || storeSummaryShowAll) return;
    if (assignedStores.length === 1 && storeFilter === "全部") {
      setStoreFilter(assignedStores[0]);
    }
  }, [user, storeFilter, storeSummaryShowAll, assignedStores]);

  useEffect(() => {
    if (!user || designerFilter === "全部" || !designerLookupStores?.length) {
      return;
    }
    const allowed = new Set(
      getEffectiveDesignersInStores(
        designerLookupStores,
        designerHomeStoreIndex,
        staffRecords,
      ).map((d) => d.name),
    );
    if (!allowed.has(designerFilter)) {
      setDesignerFilter("全部");
    }
  }, [user, designerFilter, designerLookupStores, designerHomeStoreIndex, staffRecords]);

  useEffect(() => {
    setResultDrill(EMPTY_RESULT_DRILL);
  }, [statusFilter, designerFilter, dispatcherFilter, storeFilter, searchQuery]);

  const tableTitle = isSearching
    ? `关键词查找结果（${searchResults.length}）`
    : viewMode === "status"
      ? statusFilter === "全部"
        ? "全部状态订单明细"
        : `「${statusFilter}」订单明细`
      : viewMode === "designer"
        ? designerFilter === "全部"
          ? "全部设计师订单明细"
          : `「${designerFilter}」订单明细`
        : viewMode === "dispatcher"
          ? dispatcherFilter === "全部"
            ? `全部派单人订单明细${managedStoresLabel ? `（${managedStoresLabel}）` : ""}`
            : `「${dispatcherFilter}」订单明细${managedStoresLabel ? `（${managedStoresLabel}）` : ""}`
          : storeFilter === "全部"
          ? "全部门店订单明细"
          : `「${storeFilter}」订单明细`;

  return (
    <RouteGuard canAccess={canAccessManagerPage(user)}>
    <AppShell title="设计经理看板" badge="经理">
      <div className="space-y-6">
        <ViewTabs value={viewMode} onChange={setViewMode} />

        {!isHydrated ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">
            加载数据…
          </div>
        ) : viewMode === "dispatcher" ? (
          <>
            <OrderSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={searchResults.length}
            />

            {!isSearching ? (
              <section className="space-y-4">
                <LookupSectionHeading
                  title="按派单人查找"
                  suffix={
                    managedStoresLabel ? (
                      <span className="ml-1 font-normal text-slate-500">
                        · {managedStoresLabel}
                      </span>
                    ) : null
                  }
                />
                <DispatcherSummaryBar
                  stats={dispatcherStats}
                  total={dispatcherLookupOrders.length}
                  selected={dispatcherFilter}
                  onSelect={setDispatcherFilter}
                  showAllOption={showLookupAllOption(user, "dispatcher")}
                />
              </section>
            ) : null}

            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                  {tableTitle}
                </h2>
                <DispatchTotalsSummary
                  totals={dispatchTotals}
                  accentClassName="text-violet-700"
                />
              </div>

              <DispatcherResultSummary
                orders={filteredOrders}
                supplements={supplements}
                dispatcherFilter={dispatcherFilter}
                isKeywordSearch={isSearching}
                drill={resultDrill}
                onDrillChange={setResultDrill}
              />

              <ManagerOrderTable
                orders={displayOrders}
                supplements={supplements}
                detailMode={orderTableDetailMode}
                showDesigner
                readOnly={managerReadOnly}
                isOrderReadOnly={isOrderReadOnly}
                designerRoster={reassignDesignerRoster}
                onReassign={managerReadOnly ? undefined : reassignOrder}
                onSetAfterSalesAmount={
                  managerReadOnly ? undefined : setAfterSalesAmount
                }
                emptyMessage={
                  isSearching
                    ? "未找到匹配的订单"
                    : drillFilterLabel(resultDrill)
                      ? `当前筛选（${drillFilterLabel(resultDrill)}）下暂无订单`
                      : "该派单人暂无相关订单"
                }
              />
            </section>

            {filteredSupplements.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  增补单明细
                </h2>
                <ManagerSupplementTable supplements={filteredSupplements} />
              </section>
            ) : null}
          </>
        ) : viewMode === "store" ? (
          <>
            <OrderSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={searchResults.length}
            />

            {!isSearching ? (
              <section className="space-y-4">
                <LookupSectionHeading title="按门店汇总" />
                <StoreSummaryBar
                  stats={storeStats}
                  total={scopedOrders.length}
                  selected={storeFilter}
                  onSelect={setStoreFilter}
                  accent="indigo"
                  showAllOption={storeSummaryShowAll}
                />
              </section>
            ) : null}

            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                  {tableTitle}
                </h2>
                <DispatchTotalsSummary
                  totals={dispatchTotals}
                  accentClassName="text-violet-700"
                />
              </div>

              <StoreResultSummary
                orders={filteredOrders}
                supplements={supplements}
                storeFilter={storeFilter}
                isKeywordSearch={isSearching}
                drill={resultDrill}
                onDrillChange={setResultDrill}
                managerViewMode={viewMode}
                statusFilter={statusFilter}
                designerFilter={designerFilter}
              />

              <ManagerOrderTable
                orders={displayOrders}
                supplements={supplements}
                detailMode={orderTableDetailMode}
                showDesigner
                readOnly={managerReadOnly}
                isOrderReadOnly={isOrderReadOnly}
                designerRoster={reassignDesignerRoster}
                onReassign={managerReadOnly ? undefined : reassignOrder}
                onSetAfterSalesAmount={
                  managerReadOnly ? undefined : setAfterSalesAmount
                }
                emptyMessage={
                  isSearching
                    ? "未找到匹配的订单"
                    : drillFilterLabel(resultDrill)
                      ? `当前筛选（${drillFilterLabel(resultDrill)}）下暂无订单`
                      : "该门店暂无相关订单"
                }
              />
            </section>

            {filteredSupplements.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  增补单明细
                </h2>
                <ManagerSupplementTable supplements={filteredSupplements} />
              </section>
            ) : null}
          </>
        ) : (
          <>
            <OrderSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={searchResults.length}
            />

            {!isSearching && viewMode === "status" ? (
              <section className="space-y-4">
                <LookupSectionHeading title="按状态查找" />
                <StatusSummaryBar
                  counts={statusCounts}
                  total={scopedOrders.length}
                  selected={statusFilter}
                  onSelect={setStatusFilter}
                />
              </section>
            ) : !isSearching ? (
              <section className="space-y-4">
                <LookupSectionHeading title="按设计师查找" />
                <DesignerSummaryBar
                  stats={designerStats}
                  total={designerLookupOrders.length}
                  selected={designerFilter}
                  onSelect={setDesignerFilter}
                />
              </section>
            ) : null}

            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                  {tableTitle}
                </h2>
                <DispatchTotalsSummary
                  totals={dispatchTotals}
                  accentClassName="text-violet-700"
                />
              </div>

              <ManagerResultSummary
                viewMode={viewMode}
                orders={filteredOrders}
                supplements={supplements}
                statusFilter={statusFilter}
                designerFilter={designerFilter}
                isKeywordSearch={isSearching}
                drill={resultDrill}
                onDrillChange={setResultDrill}
              />

              <ManagerOrderTable
                orders={displayOrders}
                supplements={supplements}
                detailMode={orderTableDetailMode}
                showDesigner
                readOnly={managerReadOnly}
                isOrderReadOnly={isOrderReadOnly}
                designerRoster={reassignDesignerRoster}
                onReassign={managerReadOnly ? undefined : reassignOrder}
                onSetAfterSalesAmount={
                  managerReadOnly ? undefined : setAfterSalesAmount
                }
                emptyMessage={
                  isSearching
                    ? "未找到匹配的订单"
                    : drillFilterLabel(resultDrill)
                      ? `当前筛选（${drillFilterLabel(resultDrill)}）下暂无订单`
                      : viewMode === "status"
                        ? "该状态下暂无订单"
                        : "该设计师暂无承接订单"
                }
              />
            </section>

            {filteredSupplements.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  增补单明细
                </h2>
                <ManagerSupplementTable supplements={filteredSupplements} />
              </section>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
    </RouteGuard>
  );
}
