"use client";

import type { ManagerLookupPanelProps } from "@/components/manager/manager-lookup-panel";
import {
  formatManagedStoresLabel,
  resolveAssignedStoresForUser,
} from "@/lib/assigned-stores";
import {
  filterOrdersByDispatcher,
  getDispatcherStats,
} from "@/lib/admin-stats";
import { getEffectiveDesignersInStores } from "@/lib/designer-staff-store";
import {
  filterDesignerStatsByAllowList,
  filterDispatcherStatsByAllowList,
  getVisibleManagerViewModes,
  isManagerViewModeVisible,
  resolveManagerDesignerNameAllowList,
  resolveManagerDispatcherNameAllowList,
} from "@/lib/lookup-scope";
import {
  countOrdersByStatus,
  filterOrdersByDesigner,
  filterOrdersByStatus,
  getDesignerStats,
  type ViewMode,
} from "@/lib/manager-stats";
import { searchOrders } from "@/lib/order-search";
import { resolveOrderDisplayName } from "@/lib/order-remark";
import {
  canEditManagerPage,
  canModifyOrderInUserScope,
  hasFullOrderScope,
  isPersonalDispatcherLookup,
  resolveDesignerLookupStores,
  resolveDispatcherStatsStoreFilter,
  resolveManagedStoreForLookup,
  scopeOrdersForDesignerLookup,
  scopeOrdersForDispatcherLookup,
  showStoreSummaryAllOption,
  type SessionUser,
} from "@/lib/permissions";
import {
  getDefaultDispatcherFilter,
  getManagerRoleDefaults,
} from "@/lib/role-routes";
import {
  applyResultDrillFilters,
  EMPTY_RESULT_DRILL,
  type ResultDrillFilters,
} from "@/lib/result-drill";
import {
  formatStrongPinEmptyMessage,
  formatStrongPinSearchHint,
  resolveStrongPinOrder,
  resolveStrongPinOrSearchMatches,
} from "@/lib/strong-pin-order";
import {
  filterOrdersByDispatcherStore,
  filterStoreStatsByStores,
  getStoreStatsByDispatcher,
} from "@/lib/store-stats";
import { filterSupplementsByOrders } from "@/lib/supplement-filter";
import { isSingleOrderDetailView, sortOrdersNewestFirst } from "@/lib/order-utils";
import type { DesignerHomeStoreIndex } from "@/lib/designer-staff-store";
import type { StaffRecord } from "@/lib/staff-roster";
import {
  filterOrdersByPeriod,
  type PeriodSelection,
} from "@/lib/period-filter";
import type {
  DesignerName,
  Order,
  OrderStatus,
  StoreName,
  SupplementOrder,
} from "@/lib/types";
import { useOnSessionScopeChange } from "@/lib/use-on-session-scope-change";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface UseOrderLookupWorkbenchOptions {
  user: SessionUser | null;
  /** 权限范围内订单（周期筛选前） */
  scopedOrders: Order[];
  orders: Order[];
  supplements: SupplementOrder[];
  staffRecords: StaffRecord[];
  designerHomeStoreIndex: DesignerHomeStoreIndex;
  period: PeriodSelection;
  onPeriodChange: (period: PeriodSelection) => void;
  reassignOrder?: (orderId: string, designer: DesignerName) => void;
  setAfterSalesAmount?: (orderId: string, amount: number | null) => void;
  setOrderIssueTags?: (
    orderId: string,
    tags: import("@/lib/types").OrderIssueTag[],
  ) => void;
  searchHintBase?: string;
  initialViewMode?: ViewMode;
  /** 登录切换时重置筛选 */
  sessionResetKey?: string;
}

export function useOrderLookupWorkbench({
  user,
  scopedOrders,
  orders,
  supplements,
  staffRecords,
  designerHomeStoreIndex,
  period,
  onPeriodChange,
  reassignOrder,
  setAfterSalesAmount,
  setOrderIssueTags,
  searchHintBase = "订单查询按此统计周期",
  initialViewMode = "status",
  sessionResetKey,
}: UseOrderLookupWorkbenchOptions) {
  const managerReadOnly = !canEditManagerPage(user);

  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
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

  const isOrderReadOnly = useCallback(
    (order: Order) =>
      managerReadOnly || !canModifyOrderInUserScope(user, order),
    [managerReadOnly, user],
  );

  const periodScopedOrders = useMemo(
    () => filterOrdersByPeriod(scopedOrders, period),
    [scopedOrders, period],
  );

  const dispatcherLookupOrders = useMemo(
    () =>
      filterOrdersByPeriod(
        scopeOrdersForDispatcherLookup(orders, user),
        period,
      ),
    [orders, user, period],
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
    () =>
      filterOrdersByPeriod(
        scopeOrdersForDesignerLookup(orders, user, staffRecords),
        period,
      ),
    [orders, user, staffRecords, period],
  );

  const statusCounts = useMemo(
    () => countOrdersByStatus(periodScopedOrders),
    [periodScopedOrders],
  );

  const designerNameAllowList = useMemo(
    () =>
      resolveManagerDesignerNameAllowList(
        user,
        scopedOrders,
        staffRecords,
        designerHomeStoreIndex,
      ),
    [user, scopedOrders, staffRecords, designerHomeStoreIndex],
  );

  const dispatcherNameAllowList = useMemo(
    () => resolveManagerDispatcherNameAllowList(user, scopedOrders),
    [user, scopedOrders],
  );

  const designerStats = useMemo(() => {
    const raw = getDesignerStats(
      designerLookupOrders,
      designerLookupStores,
      designerHomeStoreIndex,
      staffRecords,
    );
    return filterDesignerStatsByAllowList(raw, designerNameAllowList);
  }, [
    designerLookupOrders,
    designerLookupStores,
    designerHomeStoreIndex,
    staffRecords,
    designerNameAllowList,
  ]);

  const storeStats = useMemo(() => {
    const all = getStoreStatsByDispatcher(periodScopedOrders);
    if (hasFullOrderScope(user)) return all;
    if (assignedStores.length > 0) {
      return filterStoreStatsByStores(all, assignedStores);
    }
    if (managedStore) {
      return all.filter((s) => s.store === managedStore);
    }
    return all;
  }, [periodScopedOrders, assignedStores, managedStore, user]);

  const dispatcherStatsStoreFilter = useMemo(
    () => resolveDispatcherStatsStoreFilter(user),
    [user],
  );

  const dispatcherStats = useMemo(() => {
    const raw = getDispatcherStats(
      dispatcherLookupOrders,
      staffRecords,
      dispatcherStatsStoreFilter,
    );
    return filterDispatcherStatsByAllowList(raw, dispatcherNameAllowList);
  }, [
    dispatcherLookupOrders,
    staffRecords,
    dispatcherStatsStoreFilter,
    dispatcherNameAllowList,
  ]);

  const searchResults = useMemo(() => {
    const base =
      viewMode === "dispatcher"
        ? dispatcherLookupOrders
        : viewMode === "designer"
          ? designerLookupOrders
          : periodScopedOrders;
    return sortOrdersNewestFirst(searchOrders(base, searchQuery));
  }, [
    viewMode,
    dispatcherLookupOrders,
    designerLookupOrders,
    periodScopedOrders,
    searchQuery,
  ]);

  const strongPin = useMemo(
    () => resolveStrongPinOrder(periodScopedOrders, searchQuery),
    [periodScopedOrders, searchQuery],
  );

  const lookupSearchCount = useMemo(() => {
    if (!searchQuery.trim()) return searchResults.length;
    return resolveStrongPinOrSearchMatches(
      periodScopedOrders,
      searchQuery,
      strongPin,
    ).length;
  }, [periodScopedOrders, searchQuery, strongPin, searchResults.length]);

  const lookupSearchHint = formatStrongPinSearchHint(
    strongPin,
    searchQuery,
    searchHintBase,
  );

  const lookupEmptyMessageOverride = useMemo(() => {
    if (!searchQuery.trim()) return undefined;
    return formatStrongPinEmptyMessage(
      strongPin,
      searchQuery,
      "未找到匹配的订单",
    );
  }, [strongPin, searchQuery]);

  const resetLookupFiltersForViewMode = useCallback(
    (mode: ViewMode) => {
      if (!user) return;
      setStatusFilter("全部");
      if (user.role === "dispatcher") {
        const defaults = getManagerRoleDefaults(user, staffRecords);
        if (mode === "designer") {
          setDesignerFilter(defaults.designerFilter);
        }
        if (mode === "store") {
          setStoreFilter(defaults.storeFilter);
        }
      } else if (!hasFullOrderScope(user) && user.role !== "designer") {
        setDesignerFilter("全部");
        setStoreFilter(getManagerRoleDefaults(user, staffRecords).storeFilter);
      }
      setResultDrill(EMPTY_RESULT_DRILL);
      if (mode === "dispatcher") {
        setDispatcherFilter(getDefaultDispatcherFilter(user, staffRecords));
      }
    },
    [user, staffRecords],
  );

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setSearchQuery("");
      resetLookupFiltersForViewMode(mode);
      setViewMode(mode);
    },
    [resetLookupFiltersForViewMode],
  );

  const handlePeriodChange = useCallback(
    (next: PeriodSelection) => {
      setSearchQuery("");
      onPeriodChange(next);
    },
    [onPeriodChange],
  );

  const handleStatusFilterChange = useCallback(
    (value: OrderStatus | "全部") => {
      setSearchQuery("");
      setStatusFilter(value);
    },
    [],
  );

  const handleDesignerFilterChange = useCallback(
    (value: DesignerName | "全部") => {
      setSearchQuery("");
      setDesignerFilter(value);
    },
    [],
  );

  const handleDispatcherFilterChange = useCallback(
    (value: string | "全部") => {
      setSearchQuery("");
      setDispatcherFilter(value);
    },
    [],
  );

  const handleStoreFilterChange = useCallback((value: StoreName | "全部") => {
    setSearchQuery("");
    setStoreFilter(value);
  }, []);

  const isSearching = searchQuery.trim().length > 0;

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim();
    if (q) {
      return sortOrdersNewestFirst(
        resolveStrongPinOrSearchMatches(
          periodScopedOrders,
          searchQuery,
          strongPin,
        ),
      );
    }
    const sorted = sortOrdersNewestFirst(
      viewMode === "designer" ? designerLookupOrders : periodScopedOrders,
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
    periodScopedOrders,
    designerLookupOrders,
    dispatcherLookupOrders,
    viewMode,
    statusFilter,
    designerFilter,
    dispatcherFilter,
    storeFilter,
    searchQuery,
    strongPin,
  ]);

  useEffect(() => {
    if (strongPin.kind !== "pin") return;
    if (viewMode !== "status") setViewMode("status");
    const nextStatus = strongPin.order.status;
    if (statusFilter !== nextStatus) setStatusFilter(nextStatus);
  }, [strongPin, viewMode, statusFilter]);

  const displayOrders = useMemo(
    () => applyResultDrillFilters(filteredOrders, resultDrill),
    [filteredOrders, resultDrill],
  );

  const filteredSupplements = useMemo(
    () => filterSupplementsByOrders(supplements, displayOrders),
    [supplements, displayOrders],
  );

  const orderTableDetailMode = isSingleOrderDetailView(displayOrders);

  const resetForSession = useCallback(() => {
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
    } else if (isPersonalDispatcherLookup(user)) {
      setViewMode("dispatcher");
    } else {
      setViewMode(initialViewMode);
    }
  }, [user, staffRecords, initialViewMode]);

  useOnSessionScopeChange(sessionResetKey ?? "", resetForSession);

  useEffect(() => {
    if (!user) return;
    if (!isManagerViewModeVisible(user, viewMode)) {
      const modes = getVisibleManagerViewModes(user);
      handleViewModeChange(modes[0] ?? "status");
    }
  }, [user, viewMode, handleViewModeChange]);

  const storeSummaryShowAll = showStoreSummaryAllOption(user);

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

  const applyLookupForOrder = useCallback(
    (
      order: Order,
      options?: { status?: OrderStatus | "全部"; viewMode?: ViewMode },
    ) => {
      setViewMode(options?.viewMode ?? "status");
      setStatusFilter(options?.status ?? "全部");
      setDesignerFilter("全部");
      setDispatcherFilter("全部");
      setStoreFilter("全部");
      setSearchQuery(resolveOrderDisplayName(order));
      setResultDrill(EMPTY_RESULT_DRILL);
    },
    [],
  );

  const lookupPanelProps: ManagerLookupPanelProps = {
    user,
    viewMode,
    onViewModeChange: handleViewModeChange,
    isSearching,
    statusFilter,
    onStatusFilterChange: handleStatusFilterChange,
    designerFilter,
    onDesignerFilterChange: handleDesignerFilterChange,
    dispatcherFilter,
    onDispatcherFilterChange: handleDispatcherFilterChange,
    storeFilter,
    onStoreFilterChange: handleStoreFilterChange,
    statusCounts,
    designerStats,
    dispatcherStats,
    storeStats,
    periodScopedOrderCount: periodScopedOrders.length,
    designerLookupOrderCount: designerLookupOrders.length,
    dispatcherLookupOrderCount: dispatcherLookupOrders.length,
    managedStoresLabel,
    filteredOrders,
    displayOrders,
    supplements,
    filteredSupplements,
    orderTableDetailMode,
    managerReadOnly,
    isOrderReadOnly,
    designerRoster: reassignDesignerRoster,
    onReassign: managerReadOnly ? undefined : reassignOrder,
    onSetAfterSalesAmount: managerReadOnly ? undefined : setAfterSalesAmount,
    onSetIssueTags: managerReadOnly ? undefined : setOrderIssueTags,
    resultDrill,
    onResultDrillChange: setResultDrill,
    lookupEmptyMessage: lookupEmptyMessageOverride,
  };

  return {
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    statusFilter,
    setStatusFilter,
    designerFilter,
    setDesignerFilter,
    setDispatcherFilter,
    setStoreFilter,
    setResultDrill,
    handleViewModeChange,
    handlePeriodChange,
    lookupSearchHint,
    lookupSearchCount,
    lookupPanelProps,
    applyLookupForOrder,
    resetForSession,
  };
}
