"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RouteGuard } from "@/components/auth/route-guard";
import { ManagerLookupPanel } from "@/components/manager/manager-lookup-panel";
import { AnomalyTodosPanel } from "@/components/manager/anomaly-todos-panel";
import { WeeklyDigestSummaryCard } from "@/components/manager/weekly-digest-summary-card";
import { ManagerSidebar } from "@/components/manager/manager-sidebar";
import { WorkbenchPeriodSearchBar } from "@/components/shared/workbench-period-search-bar";
import { PeriodFilterBar } from "@/components/shared/period-filter-bar";
import { ModuleWorkbenchLayout } from "@/components/workbench/module-workbench-layout";
import { EVAL_PAGE_MAIN_CLASS } from "@/components/evaluation/sticky-section";
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
  isPersonalDispatcherLookup,
  isPersonalManagerLookupOnly,
  resolveManagedStoreForLookup,
  resolveDesignerLookupStores,
  resolveDispatcherStatsStoreFilter,
  scopeOrdersForDispatcherLookup,
  scopeOrdersForDesignerLookup,
  scopeOrdersForUser,
  showLookupAllOption,
  showStoreSummaryAllOption,
} from "@/lib/permissions";
import { canAccessManagerPage, getSessionBadgeLabel } from "@/lib/nav-access";
import {
  getDefaultDispatcherFilter,
  getManagerRoleDefaults,
} from "@/lib/role-routes";
import {
  filterDesignerStatsByAllowList,
  filterDispatcherStatsByAllowList,
  getVisibleManagerViewModes,
  isManagerViewModeVisible,
  resolveManagerDesignerNameAllowList,
  resolveManagerDispatcherNameAllowList,
} from "@/lib/lookup-scope";
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
import {
  applyResultDrillFilters,
  EMPTY_RESULT_DRILL,
  type ResultDrillFilters,
} from "@/lib/result-drill";
import { filterSupplementsByOrders } from "@/lib/supplement-filter";
import { resolveEvaluationScopeLabel, resolveReportPersonScope } from "@/lib/evaluation-scope";
import { getManagerAlerts } from "@/lib/manager-alerts";
import {
  loadManagerUi,
  saveManagerUi,
  type ManagerMainSection,
  type ManagerReportTab,
  type ManagerWeeklyPeriodPreset,
} from "@/lib/manager-ui-persistence";
import { SNAPSHOT_REPORT_HINT } from "@/lib/report-period-sync";
import { parseManagerFocus, parseManagerOrderStatus } from "@/lib/manager-deep-link";
import { resolvePendingConfirmNavigate } from "@/lib/order-action-link";
import {
  DEFAULT_PERIOD,
  filterOrdersByPeriod,
  type PeriodSelection,
} from "@/lib/period-filter";
import {
  loadWorkbenchPeriod,
  saveWorkbenchPeriod,
} from "@/lib/workbench-period-persistence";
import { isSingleOrderDetailView, sortOrdersNewestFirst } from "@/lib/order-utils";
import { resolveOrderDisplayName } from "@/lib/order-remark";
import { getSessionResetKey } from "@/lib/session-user";
import { useOnSessionScopeChange } from "@/lib/use-on-session-scope-change";
import type { DesignerName, Order, OrderStatus, StoreName } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PendingConfirmKind } from "@/lib/pending-confirm";

export default function ManagerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
          加载…
        </div>
      }
    >
      <ManagerPageContent />
    </Suspense>
  );
}

function ManagerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, staffRecords, designerHomeStoreIndex } = useAuth();
  const {
    orders,
    supplements,
    isHydrated,
    reassignOrder,
    setAfterSalesAmount,
    setOrderIssueTags,
  } = useOrders();
  const managerReadOnly = !canEditManagerPage(user);
  const lookupOnly = isPersonalManagerLookupOnly(user);
  const personalWeeklyOnly = lookupOnly;
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
  const [mainSection, setMainSection] =
    useState<ManagerMainSection>("weekly");
  const [reportTab, setReportTab] = useState<ManagerReportTab>("pending");
  const [weeklyPeriod, setWeeklyPeriod] = useState<PeriodSelection>({
    preset: "thisWeek",
  });
  const [period, setPeriod] = useState<PeriodSelection>(DEFAULT_PERIOD);
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null);
  const [uiHydrated, setUiHydrated] = useState(false);

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

  const managerScopeLabel = resolveEvaluationScopeLabel(user);

  const reportPersonScope = useMemo(
    () => resolveReportPersonScope(user, scopedOrders, staffRecords),
    [user, scopedOrders, staffRecords],
  );

  const scopedReportSupplements = useMemo(
    () => filterSupplementsByOrders(supplements, scopedOrders),
    [supplements, scopedOrders],
  );

  const periodScopedOrders = useMemo(
    () => filterOrdersByPeriod(scopedOrders, period),
    [scopedOrders, period],
  );

  const managerAlerts = useMemo(
    () => getManagerAlerts(scopedOrders),
    [scopedOrders],
  );

  const pendingAcceptCount = useMemo(
    () =>
      scopedOrders.filter(
        (o) => o.status === "待量尺" && !o.designerAcceptedAt,
      ).length,
    [scopedOrders],
  );

  useEffect(() => {
    if (!user) return;
    const savedPeriod = loadWorkbenchPeriod(user.username);
    if (savedPeriod) setPeriod(savedPeriod);
    const savedUi = loadManagerUi(user.username);
    if (lookupOnly) {
      const defaults = getManagerRoleDefaults(user, staffRecords);
      setStoreFilter(defaults.storeFilter);
      setDispatcherFilter(defaults.dispatcherFilter);
      setDesignerFilter(defaults.designerFilter);
      if (user.role === "designer") {
        setViewMode("designer");
      } else if (isPersonalDispatcherLookup(user)) {
        setViewMode("dispatcher");
      }
      if (savedUi?.mainSection === "lookup") {
        setMainSection("lookup");
      } else if (savedUi?.mainSection === "reports") {
        setMainSection("weekly");
      } else {
        setMainSection(savedUi?.mainSection ?? "weekly");
      }
      if (savedUi?.weeklyPeriod === "lastWeek") {
        setWeeklyPeriod({ preset: "lastWeek" });
      }
    } else if (savedUi) {
      setMainSection(savedUi.mainSection);
      setReportTab(savedUi.reportTab);
      setViewMode(savedUi.viewMode);
      if (savedUi.weeklyPeriod === "lastWeek") {
        setWeeklyPeriod({ preset: "lastWeek" });
      }
    }
    setUiHydrated(true);
  }, [user, lookupOnly, staffRecords]);

  useEffect(() => {
    if (!user || !uiHydrated) return;
    saveWorkbenchPeriod(user.username, period);
  }, [user, period, uiHydrated]);

  useEffect(() => {
    if (!user || !uiHydrated) return;
    saveManagerUi(user.username, {
      mainSection,
      reportTab,
      viewMode,
      weeklyPeriod: weeklyPeriod.preset === "lastWeek" ? "lastWeek" : "thisWeek",
    });
  }, [user, mainSection, reportTab, viewMode, weeklyPeriod, uiHydrated]);

  useEffect(() => {
    if (mainSection !== "reports") {
      setFocusOrderId(null);
    }
  }, [mainSection]);

  const handleAlertDesignerSelect = useCallback(
    (designer: string) => {
      setMainSection("lookup");
      setViewMode("designer");
      setDesignerFilter(designer as DesignerName);
      setSearchQuery("");
      setStatusFilter("全部");
      setResultDrill(EMPTY_RESULT_DRILL);
    },
    [],
  );

  const applyManagerLookupForOrder = useCallback(
    (
      order: Order,
      options?: { status?: OrderStatus | "全部"; viewMode?: ViewMode },
    ) => {
      setMainSection("lookup");
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

  const handleOpenPendingOrder = useCallback(
    ({
      kind,
      order,
    }: {
      orderId: string;
      kind: PendingConfirmKind;
      order: Order;
    }) => {
      const target = resolvePendingConfirmNavigate(user, order, kind);
      if (!target) return;
      if (
        target.href.startsWith("/admin") ||
        target.href.startsWith("/designer")
      ) {
        router.push(target.href);
        return;
      }
      if (kind === "undispatched") {
        applyManagerLookupForOrder(order, { status: "未派单" });
        return;
      }
      if (kind === "pending-refund") {
        applyManagerLookupForOrder(order, { status: "待退单" });
        return;
      }
      if (kind === "designer-accept") {
        applyManagerLookupForOrder(order, { status: "待量尺" });
      }
    },
    [user, router, applyManagerLookupForOrder],
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
    "订单查询按此统计周期",
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

  const handlePeriodChange = useCallback((next: PeriodSelection) => {
    setSearchQuery("");
    setPeriod(next);
  }, []);

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

  const handleDispatcherFilterChange = useCallback((value: string | "全部") => {
    setSearchQuery("");
    setDispatcherFilter(value);
  }, []);

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
    } else if (isPersonalDispatcherLookup(user)) {
      setViewMode("dispatcher");
    }
  }, [user, staffRecords]);

  useOnSessionScopeChange(sessionResetKey, resetManagerBoardForSession);

  useEffect(() => {
    if (!user || !uiHydrated) return;
    if (!isManagerViewModeVisible(user, viewMode)) {
      const modes = getVisibleManagerViewModes(user);
      handleViewModeChange(modes[0] ?? "status");
    }
  }, [user, viewMode, uiHydrated, handleViewModeChange]);

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

  useEffect(() => {
    if (!isHydrated || !uiHydrated) return;

    const focus = parseManagerFocus(searchParams.get("focus"));
    const section = searchParams.get("section");
    const orderId = searchParams.get("orderId");
    const status = parseManagerOrderStatus(searchParams.get("status"));
    const designer = searchParams.get("designer");
    const view = searchParams.get("view");

    if (!focus && !section && !orderId && !designer) return;

    if (focus) {
      switch (focus) {
        case "flow-timeout":
          if (lookupOnly) {
            setMainSection("weekly");
          } else {
            setMainSection("reports");
          }
          break;
        case "sign-timeout":
          setMainSection("lookup");
          setViewMode("status");
          setStatusFilter("待签约");
          break;
        case "pending-acceptance":
          if (lookupOnly) {
            setMainSection("weekly");
          } else {
            setMainSection("reports");
          }
          break;
        case "pending-refund":
          setMainSection("lookup");
          setViewMode("status");
          setStatusFilter("待退单");
          break;
      }
    }

    if (section === "lookup") {
      setMainSection("lookup");
    } else if (section === "weekly") {
      setMainSection("weekly");
    } else if (section === "reports") {
      setMainSection("reports");
    }

    if (view === "designer" && designer) {
      setViewMode("designer");
      setDesignerFilter(designer as DesignerName);
    }
    if (status) {
      setViewMode("status");
      setStatusFilter(status);
    }
    if (orderId) {
      const order = scopedOrders.find((o) => o.id === orderId);
      if (order && section === "reports") {
        setMainSection("reports");
        setFocusOrderId(orderId);
      } else if (order) {
        setSearchQuery(resolveOrderDisplayName(order));
        setFocusOrderId(null);
      }
    } else {
      setFocusOrderId(null);
    }
  }, [isHydrated, uiHydrated, searchParams, scopedOrders, lookupOnly]);

  return (
    <RouteGuard canAccess={canAccessManagerPage(user)}>
      <AppShell
        title="项目进程管理"
        badge={getSessionBadgeLabel(user) ?? "经理"}
        mainClassName={EVAL_PAGE_MAIN_CLASS}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {!isHydrated ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">
              加载数据…
            </div>
          ) : (
            <ModuleWorkbenchLayout
              periodBar={
                mainSection === "lookup" ? (
                  <WorkbenchPeriodSearchBar
                    period={period}
                    onPeriodChange={handlePeriodChange}
                    query={searchQuery}
                    onQueryChange={setSearchQuery}
                    hint={lookupSearchHint}
                    placeholder="客户姓名、电话、地址、设计师、派单人、门店…"
                    resultCount={lookupSearchCount}
                  />
                ) : mainSection === "weekly" ? (
                  <PeriodFilterBar
                    value={weeklyPeriod}
                    onChange={setWeeklyPeriod}
                    embedded
                    variant="weeklyBriefOnly"
                    hint={
                      personalWeeklyOnly
                        ? `${user?.displayName ?? ""} · 本周简报`
                        : managerScopeLabel
                          ? `${managerScopeLabel} · 本周简报`
                          : "本周简报"
                    }
                  />
                ) : mainSection === "reports" ? (
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5">
                    <p className="text-xs text-slate-600">
                      异常待办
                      {managerScopeLabel ? ` · ${managerScopeLabel}` : ""}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      异常订单按触发时间排序，最新在最上 · {SNAPSHOT_REPORT_HINT}
                    </p>
                  </div>
                ) : null
              }
              sidebar={
                <ManagerSidebar
                  mainSection={mainSection}
                  onMainSectionChange={setMainSection}
                  personalWeeklyOnly={personalWeeklyOnly}
                />
              }
            >
              {mainSection === "weekly" ? (
                <WeeklyDigestSummaryCard
                  orders={scopedOrders}
                  supplements={scopedReportSupplements}
                  period={weeklyPeriod}
                  storeScopeLabel={personalWeeklyOnly ? null : managerScopeLabel}
                  personScope={reportPersonScope}
                  personalMode={personalWeeklyOnly}
                  personalTitle={
                    personalWeeklyOnly
                      ? `${user?.displayName ?? "本人"} · 本周简报`
                      : null
                  }
                />
              ) : mainSection === "reports" ? (
                <AnomalyTodosPanel
                  orders={scopedOrders}
                  focusOrderId={focusOrderId}
                  onSelectDesigner={handleAlertDesignerSelect}
                  onOpenPendingOrder={handleOpenPendingOrder}
                />
              ) : (
                <ManagerLookupPanel
                  user={user}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  isSearching={isSearching}
                  statusFilter={statusFilter}
                  onStatusFilterChange={handleStatusFilterChange}
                  designerFilter={designerFilter}
                  onDesignerFilterChange={handleDesignerFilterChange}
                  dispatcherFilter={dispatcherFilter}
                  onDispatcherFilterChange={handleDispatcherFilterChange}
                  storeFilter={storeFilter}
                  onStoreFilterChange={handleStoreFilterChange}
                  statusCounts={statusCounts}
                  designerStats={designerStats}
                  dispatcherStats={dispatcherStats}
                  storeStats={storeStats}
                  periodScopedOrderCount={periodScopedOrders.length}
                  designerLookupOrderCount={designerLookupOrders.length}
                  dispatcherLookupOrderCount={dispatcherLookupOrders.length}
                  managedStoresLabel={managedStoresLabel}
                  filteredOrders={filteredOrders}
                  displayOrders={displayOrders}
                  supplements={supplements}
                  filteredSupplements={filteredSupplements}
                  orderTableDetailMode={orderTableDetailMode}
                  managerReadOnly={managerReadOnly}
                  isOrderReadOnly={isOrderReadOnly}
                  designerRoster={reassignDesignerRoster}
                  onReassign={managerReadOnly ? undefined : reassignOrder}
                  onSetAfterSalesAmount={
                    managerReadOnly ? undefined : setAfterSalesAmount
                  }
                  onSetIssueTags={
                    managerReadOnly ? undefined : setOrderIssueTags
                  }
                  resultDrill={resultDrill}
                  onResultDrillChange={setResultDrill}
                  lookupEmptyMessage={lookupEmptyMessageOverride}
                />
              )}
            </ModuleWorkbenchLayout>
          )}
        </div>
      </AppShell>
    </RouteGuard>
  );
}
