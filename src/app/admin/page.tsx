"use client";

import { AdminDesignerResultSummary } from "@/components/admin/admin-designer-result-summary";
import { AdminViewTabs } from "@/components/admin/admin-view-tabs";
import { DispatcherResultSummary } from "@/components/admin/dispatcher-result-summary";
import { DispatcherSummaryBar } from "@/components/admin/dispatcher-summary-bar";
import { SiteBrandingSettings } from "@/components/admin/site-branding-settings";
import { StaffManagement } from "@/components/admin/staff-management";
import { DesignerSummaryBar } from "@/components/manager/designer-summary-bar";
import { AppShell } from "@/components/layout/app-shell";
import { ManagerOrderTable } from "@/components/manager/manager-order-table";
import { OrderSearchBar } from "@/components/manager/order-search-bar";
import { StoreResultSummary } from "@/components/shared/store-result-summary";
import { StoreSummaryBar } from "@/components/shared/store-summary-bar";
import { LookupSectionHeading } from "@/components/shared/lookup-section-heading";
import { RouteGuard } from "@/components/auth/route-guard";
import { DispatchForm } from "@/components/orders/dispatch-form";
import { OrderList } from "@/components/orders/order-list";
import {
  formatManagedStoresLabel,
  resolveAssignedStoresForUser,
} from "@/lib/assigned-stores";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import {
  canCreateDispatch,
  canDeleteOrder,
  canAccessAdminPage,
  isAdminLookupReadOnly,
  hasFullOrderScope,
  isStoreManagerAccess,
  lockedDesignerName,
  lockedDispatcherName,
  resolveManagedStoreForLookup,
  resolveDesignerLookupStores,
  scopeOrdersForAdminBoard,
  scopeOrdersForDesignerLookup,
  scopeOrdersForDispatcherLookup,
  showLookupAllOption,
  showStoreSummaryAllOption,
} from "@/lib/permissions";
import {
  getSessionBadgeLabel,
  getVisibleAdminViewModes,
} from "@/lib/nav-access";
import { getDesignerHomeStore } from "@/lib/designers";
import {
  getAdminRoleDefaults,
  getDefaultDesignerFilter,
  getDefaultDispatcherFilter,
} from "@/lib/role-routes";
import { filterOrdersByDesigner, getDesignerStats } from "@/lib/manager-stats";
import {
  filterOrdersByDispatcherAffiliatedStore,
  filterOrdersByDispatcherAffiliatedStores,
  getDesignerStatsFromStoreOrders,
  resolveDispatchPreferredStore,
  resolveUserHomeStore,
} from "@/lib/store-manager-scope";
import {
  applyResultDrillFilters,
  drillFilterLabel,
  EMPTY_RESULT_DRILL,
  type ResultDrillFilters,
} from "@/lib/result-drill";
import {
  filterOrdersByDispatcher,
  getDispatcherStats,
  type AdminViewMode,
} from "@/lib/admin-stats";
import { searchOrders } from "@/lib/order-search";
import { isActiveOrder, isSingleOrderDetailView, sortOrdersByLoginAccountPriority } from "@/lib/order-utils";
import {
  filterOrdersByDispatcherStore,
  filterStoreStatsByStores,
  getStoreStatsByDispatcher,
} from "@/lib/store-stats";
import { DispatchTotalsSummary } from "@/components/shared/dispatch-totals-summary";
import { sumDispatchTotals } from "@/lib/dispatch-totals";
import { loadAdminViewMode, saveAdminViewMode } from "@/lib/admin-ui-persistence";
import { getSessionResetKey } from "@/lib/session-user";
import { useOnSessionScopeChange } from "@/lib/use-on-session-scope-change";
import type { DesignerName, OrderStatus, StoreName } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState } from "react";

function sortOrdersNewestFirst<T extends { createdAt: string }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export default function AdminPage() {
  const { user, staffRecords, designerHomeStoreIndex } = useAuth();
  const { orders, supplements, addOrder, deleteOrder, isHydrated } = useOrders();
  const lookupReadOnly = isAdminLookupReadOnly(user);
  const tableReadOnly = lookupReadOnly;
  const allowDeleteOrder = canDeleteOrder(user);
  const dispatcherLocked = lockedDispatcherName(user);
  const designerLocked = lockedDesignerName(user);
  const [viewMode, setViewMode] = useState<AdminViewMode>("dispatch");
  const [dispatcherFilter, setDispatcherFilter] = useState<string | "全部">(
    "全部",
  );
  const [storeFilter, setStoreFilter] = useState<StoreName | "全部">("全部");
  const [designerFilter, setDesignerFilter] = useState<DesignerName | "全部">(
    "全部",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOrderSearchQuery, setActiveOrderSearchQuery] = useState("");
  const [resultDrill, setResultDrill] =
    useState<ResultDrillFilters>(EMPTY_RESULT_DRILL);
  const allowedAdminModes = useMemo(
    () => getVisibleAdminViewModes(user),
    [user],
  );
  const allowedAdminModesKey = allowedAdminModes.join(",");
  const assignedStores = user ? resolveAssignedStoresForUser(user) : [];
  const managedStore = user ? resolveManagedStoreForLookup(user) : null;
  const managedStoresLabel =
    assignedStores.length > 0
      ? formatManagedStoresLabel(assignedStores)
      : managedStore ?? "";
  const storeSummaryShowAll = showStoreSummaryAllOption(user);
  const designerLookupStores = resolveDesignerLookupStores(user);
  const preferredStore = useMemo(
    () => resolveDispatchPreferredStore(user),
    [user],
  );
  const sessionResetKey = getSessionResetKey(user);

  const activeOrders = useMemo(() => {
    let list = orders.filter(isActiveOrder);
    if (user?.accessLevel === "store_manager" && managedStore) {
      list = filterOrdersByDispatcherAffiliatedStore(list, managedStore);
    } else if (assignedStores.length > 0) {
      list = filterOrdersByDispatcherAffiliatedStores(list, assignedStores);
    } else if (user?.role === "designer") {
      list = list.filter((o) => o.designer === user.displayName);
    } else if (
      user?.role === "dispatcher" &&
      user.accessLevel === "personal"
    ) {
      list = list.filter((o) => o.dispatcherName === user.displayName);
    }
    return sortOrdersByLoginAccountPriority(list, user);
  }, [orders, user, managedStore, assignedStores]);

  const filteredActiveOrders = useMemo(
    () => searchOrders(activeOrders, activeOrderSearchQuery),
    [activeOrders, activeOrderSearchQuery],
  );

  const isActiveOrderSearching = activeOrderSearchQuery.trim().length > 0;

  const scopedOrders = useMemo(
    () => scopeOrdersForAdminBoard(orders, user),
    [orders, user],
  );

  const dispatcherLookupOrders = useMemo(
    () => scopeOrdersForDispatcherLookup(orders, user),
    [orders, user],
  );

  const designerLookupOrders = useMemo(
    () => scopeOrdersForDesignerLookup(orders, user, staffRecords),
    [orders, user, staffRecords],
  );

  const installedCount = scopedOrders.filter((o) => o.status === "已安装").length;

  const dispatcherStats = useMemo(
    () => getDispatcherStats(dispatcherLookupOrders, staffRecords),
    [dispatcherLookupOrders, staffRecords],
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

  const designerStats = useMemo(() => {
    if (hasFullOrderScope(user)) {
      return getDesignerStats(
        designerLookupOrders,
        undefined,
        designerHomeStoreIndex,
        staffRecords,
      );
    }
    if (designerLookupStores?.length) {
      return getDesignerStats(
        designerLookupOrders,
        designerLookupStores,
        designerHomeStoreIndex,
        staffRecords,
      );
    }
    return getDesignerStatsFromStoreOrders(
      designerLookupOrders,
      designerHomeStoreIndex,
    );
  }, [
    designerLookupOrders,
    designerLookupStores,
    designerHomeStoreIndex,
    staffRecords,
    user,
  ]);

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
    if (viewMode === "store") {
      return filterOrdersByDispatcherStore(
        sortOrdersNewestFirst(scopedOrders),
        storeFilter,
      );
    }
    if (viewMode === "dispatcher") {
      return filterOrdersByDispatcher(
        sortOrdersNewestFirst(dispatcherLookupOrders),
        dispatcherFilter,
      );
    }
    if (viewMode === "designer") {
      return filterOrdersByDesigner(
        sortOrdersNewestFirst(designerLookupOrders),
        designerFilter,
      );
    }
    return sortOrdersNewestFirst(scopedOrders);
  }, [
    scopedOrders,
    dispatcherLookupOrders,
    designerLookupOrders,
    viewMode,
    dispatcherFilter,
    designerFilter,
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

  const orderTableDetailMode = isSingleOrderDetailView(displayOrders);

  useEffect(() => {
    if (!allowedAdminModes.includes(viewMode)) {
      setViewMode(allowedAdminModes[0] ?? "dispatch");
    }
  }, [viewMode, allowedAdminModes]);

  useEffect(() => {
    if (!user?.username) return;
    const saved = loadAdminViewMode(user.username);
    if (saved && allowedAdminModes.includes(saved)) {
      setViewMode(saved);
      return;
    }
    setViewMode(getAdminRoleDefaults(user, staffRecords).viewMode);
  }, [sessionResetKey, allowedAdminModesKey, user]);

  useEffect(() => {
    if (!user?.username) return;
    saveAdminViewMode(user.username, viewMode);
  }, [user?.username, viewMode]);

  const resetAdminBoardForSession = useCallback(() => {
    if (!user) return;
    const defaults = getAdminRoleDefaults(user, staffRecords);
    setDispatcherFilter(defaults.dispatcherFilter);
    setDesignerFilter(defaults.designerFilter);
    setStoreFilter(defaults.storeFilter);
    setSearchQuery("");
    setActiveOrderSearchQuery("");
    setResultDrill(EMPTY_RESULT_DRILL);
  }, [user, staffRecords]);

  useOnSessionScopeChange(sessionResetKey, resetAdminBoardForSession);

  useEffect(() => {
    if (viewMode !== "dispatch") {
      setActiveOrderSearchQuery("");
    }
  }, [viewMode]);

  useEffect(() => {
    if (!user) return;
    setSearchQuery("");
    setResultDrill(EMPTY_RESULT_DRILL);
    if (viewMode === "dispatcher") {
      setDispatcherFilter(getDefaultDispatcherFilter(user, staffRecords));
    } else if (viewMode === "designer") {
      setDesignerFilter(getDefaultDesignerFilter(user));
    } else if (isStoreManagerAccess(user) && viewMode === "store") {
      setStoreFilter(resolveUserHomeStore(user));
    } else if (user.role === "dispatcher" && viewMode === "store") {
      setStoreFilter(getAdminRoleDefaults(user, staffRecords).storeFilter);
    } else if (user.role === "designer" && viewMode === "store") {
      setStoreFilter(
        user.homeStore ??
          getDesignerHomeStore(user.displayName as DesignerName),
      );
    } else if (hasFullOrderScope(user) && viewMode === "store") {
      setStoreFilter("全部");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅切换 Tab 时重置，不因云端同步刷新名册而清空输入
  }, [viewMode, user]);

  useEffect(() => {
    if (!user || storeSummaryShowAll) return;
    if (assignedStores.length === 1 && storeFilter === "全部") {
      setStoreFilter(assignedStores[0]);
    }
  }, [user, storeFilter, storeSummaryShowAll, assignedStores]);

  useEffect(() => {
    setResultDrill(EMPTY_RESULT_DRILL);
  }, [dispatcherFilter, designerFilter, storeFilter, searchQuery]);

  const storeScopeHint = managedStoresLabel ? `（${managedStoresLabel}）` : "";

  const tableTitle = isSearching
    ? `关键词查找结果（${searchResults.length}）`
    : viewMode === "store"
      ? storeFilter === "全部"
        ? "全部门店订单明细"
        : `「${storeFilter}」订单明细`
      : viewMode === "designer"
        ? designerFilter === "全部"
          ? `全部设计师订单明细${storeScopeHint}`
          : `「${designerFilter}」订单明细${storeScopeHint}`
        : dispatcherFilter === "全部"
          ? `全部派单人订单明细${storeScopeHint}`
          : `「${dispatcherFilter}」订单明细${storeScopeHint}`;

  return (
    <RouteGuard canAccess={canAccessAdminPage(user)}>
    <AppShell
      title="门店派单"
      badge={getSessionBadgeLabel(user)}
    >
      <div className="space-y-6">
        <AdminViewTabs
          value={viewMode}
          onChange={setViewMode}
          allowedModes={allowedAdminModes}
        />

        {!isHydrated ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">
            加载订单数据…
          </div>
        ) : viewMode === "dispatch" ? (
          <div className="space-y-8">
            <DispatchForm
              onSubmit={addOrder}
              lockedDispatcherName={dispatcherLocked}
              lockedDesignerName={designerLocked}
              preferredStore={preferredStore}
              readOnly={!canCreateDispatch(user)}
            />

            <section className="space-y-4">
              <OrderSearchBar
                value={activeOrderSearchQuery}
                onChange={setActiveOrderSearchQuery}
                resultCount={filteredActiveOrders.length}
                placeholder="在进行中订单内查找：客户、设计师、派单人、门店、状态…"
              />

              <div className="flex flex-wrap items-end justify-between gap-2">
                <LookupSectionHeading
                  title="进行中订单列表"
                  suffix={
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      {isActiveOrderSearching
                        ? `匹配 ${filteredActiveOrders.length} / 共 ${activeOrders.length} 笔`
                        : `共 ${activeOrders.length} 笔`}
                      {installedCount > 0
                        ? ` · 已安装 ${installedCount} 笔`
                        : ""}
                    </span>
                  }
                />
              </div>

              <OrderList
                orders={filteredActiveOrders}
                emptyMessage={
                  isActiveOrderSearching
                    ? "未找到匹配的进行中订单"
                    : "暂无进行中订单，请在上方表单创建派单"
                }
                showDesigner
                onDeleteOrder={allowDeleteOrder ? deleteOrder : undefined}
              />
            </section>
          </div>
        ) : viewMode === "staff" ? (
          <StaffManagement />
        ) : viewMode === "branding" ? (
          <SiteBrandingSettings />
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
                  accent="emerald"
                  showAllOption={storeSummaryShowAll}
                />
              </section>
            ) : null}

            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                  {tableTitle}
                </h2>
                <DispatchTotalsSummary totals={dispatchTotals} />
              </div>

              <StoreResultSummary
                orders={filteredOrders}
                supplements={supplements}
                storeFilter={storeFilter}
                isKeywordSearch={isSearching}
                drill={resultDrill}
                onDrillChange={setResultDrill}
                board="admin"
              />

              <ManagerOrderTable
                orders={displayOrders}
                supplements={supplements}
                detailMode={orderTableDetailMode}
                showDesigner
                readOnly={tableReadOnly}
                onDeleteOrder={allowDeleteOrder ? deleteOrder : undefined}
                emptyMessage={
                  isSearching
                    ? "未找到匹配的订单"
                    : drillFilterLabel(resultDrill)
                      ? `当前筛选（${drillFilterLabel(resultDrill)}）下暂无订单`
                      : "该门店暂无相关订单"
                }
              />
            </section>
          </>
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
                    managedStore ? (
                      <span className="ml-1 font-normal text-slate-500">
                        · {managedStore}
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
                <DispatchTotalsSummary totals={dispatchTotals} />
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
                readOnly={tableReadOnly}
                onDeleteOrder={allowDeleteOrder ? deleteOrder : undefined}
                emptyMessage={
                  isSearching
                    ? "未找到匹配的订单"
                    : drillFilterLabel(resultDrill)
                      ? `当前筛选（${drillFilterLabel(resultDrill)}）下暂无订单`
                      : "该派单人暂无相关订单"
                }
              />
            </section>
          </>
        ) : viewMode === "designer" ? (
          <>
            <OrderSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={searchResults.length}
            />

            {!isSearching ? (
              <section className="space-y-4">
                <LookupSectionHeading
                  title="按设计师查找"
                  suffix={
                    managedStore ? (
                      <span className="ml-1 font-normal text-slate-500">
                        · {managedStore}
                      </span>
                    ) : null
                  }
                />
                <DesignerSummaryBar
                  stats={designerStats}
                  total={designerLookupOrders.length}
                  selected={designerFilter}
                  onSelect={setDesignerFilter}
                  showAllOption={showLookupAllOption(user, "designer")}
                  accent="emerald"
                />
              </section>
            ) : null}

            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                  {tableTitle}
                </h2>
                <DispatchTotalsSummary totals={dispatchTotals} />
              </div>

              <AdminDesignerResultSummary
                orders={filteredOrders}
                supplements={supplements}
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
                readOnly={tableReadOnly}
                onDeleteOrder={allowDeleteOrder ? deleteOrder : undefined}
                emptyMessage={
                  isSearching
                    ? "未找到匹配的订单"
                    : drillFilterLabel(resultDrill)
                      ? `当前筛选（${drillFilterLabel(resultDrill)}）下暂无订单`
                      : "该设计师暂无相关订单"
                }
              />
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
    </RouteGuard>
  );
}
