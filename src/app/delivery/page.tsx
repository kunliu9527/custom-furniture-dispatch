"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { RouteGuard } from "@/components/auth/route-guard";
import { AcceptanceSummaryBar } from "@/components/delivery/acceptance-summary-bar";
import { DeliveryCustomerAcceptancePanel } from "@/components/delivery/delivery-customer-acceptance-panel";
import { DeliveryResultSummary } from "@/components/delivery/delivery-result-summary";
import { DeliverySidebar } from "@/components/delivery/delivery-sidebar";
import { ModuleWorkbenchLayout } from "@/components/workbench/module-workbench-layout";
import { WorkbenchPeriodSearchBar } from "@/components/shared/workbench-period-search-bar";
import { EVAL_PAGE_MAIN_CLASS } from "@/components/evaluation/sticky-section";
import { InstallerSummaryBar } from "@/components/delivery/installer-summary-bar";
import { AcceptancePanel } from "@/components/orders/acceptance-panel";
import { AppShell } from "@/components/layout/app-shell";
import { DispatcherSummaryBar } from "@/components/admin/dispatcher-summary-bar";
import { DesignerSummaryBar } from "@/components/manager/designer-summary-bar";
import { StatusSummaryBar } from "@/components/manager/status-summary-bar";
import { LookupSectionHeading } from "@/components/shared/lookup-section-heading";
import { StoreSummaryBar } from "@/components/shared/store-summary-bar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/orders/status-badge";
import { OrderAnomalyBadges, OrderAnomalyName } from "@/components/orders/order-anomaly-badges";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import {
  filterOrdersByAcceptanceLookup,
  type AcceptanceLookupFilter,
} from "@/lib/customer-ratings";
import {
  countAcceptanceLookup,
  countDeliveryByStatus,
  filterOrdersByDeliveryStatus,
  filterOrdersByInstaller,
  getInstallerDeliveryStats,
  type DeliveryViewMode,
} from "@/lib/delivery-stats";
import {
  filterOrdersByDispatcher,
  getDispatcherStats,
} from "@/lib/admin-stats";
import {
  createEmptyStatusCounts,
  filterOrdersByDesigner,
} from "@/lib/manager-stats";
import { countByDesigner } from "@/lib/result-drill";
import { searchOrders } from "@/lib/order-search";
import {
  formatStrongPinEmptyMessage,
  formatStrongPinHeading,
  formatStrongPinSearchHint,
  resolveStrongPinOrder,
  resolveStrongPinOrSearchMatches,
} from "@/lib/strong-pin-order";
import { formatBudget, formatOrderAmount } from "@/lib/order-format";
import {
  scopeOrdersForDelivery,
  isPersonalInstallerDelivery,
  resolveDeliveryLookupStores,
  DELIVERY_FLOW_STATUSES,
} from "@/lib/delivery-scope";
import {
  getVisibleDeliveryViewModes,
  isDeliveryViewModeVisible,
} from "@/lib/lookup-scope";
import {
  canEditDeliveryPage,
  canAccessDeliveryPage,
  resolveManagedStoreForLookup,
  showStoreSummaryAllOption,
} from "@/lib/permissions";
import {
  filterOrdersByDispatcherStore,
  filterStoreStatsByStores,
  getStoreStatsByDispatcher,
} from "@/lib/store-stats";
import {
  formatManagedStoresLabel,
  resolveAssignedStoresForUser,
} from "@/lib/assigned-stores";
import { formatOrderDate, sortOrdersNewestFirst } from "@/lib/order-utils";
import {
  displayCustomerNameColumn,
  displayOrderNameColumn,
} from "@/lib/order-remark";
import { getSessionResetKey } from "@/lib/session-user";
import { useOnSessionScopeChange } from "@/lib/use-on-session-scope-change";
import {
  DEFAULT_PERIOD,
  filterOrdersByPeriod,
  type PeriodSelection,
} from "@/lib/period-filter";
import {
  loadDeliveryUi,
  saveDeliveryUi,
} from "@/lib/delivery-ui-persistence";
import {
  loadWorkbenchPeriod,
  saveWorkbenchPeriod,
} from "@/lib/workbench-period-persistence";
import type { DesignerName, FlowOrderStatus, Order, StoreName } from "@/lib/types";

export default function DeliveryPage() {
  const { user, staffRecords } = useAuth();
  const {
    orders,
    advanceOrderStatus,
    initiateAcceptance,
    skipElectronicAcceptance,
    isHydrated,
  } = useOrders();

  const [viewMode, setViewMode] = useState<DeliveryViewMode>("status");
  const [statusFilter, setStatusFilter] =
    useState<FlowOrderStatus | "全部">("全部");
  const [installerFilter, setInstallerFilter] = useState<string | "全部">("全部");
  const [storeFilter, setStoreFilter] = useState<StoreName | "全部">("全部");
  const [storeDispatcherFilter, setStoreDispatcherFilter] = useState<
    string | "全部"
  >("全部");
  const [storeDesignerFilter, setStoreDesignerFilter] = useState<
    DesignerName | "全部"
  >("全部");
  const [storeInstallerFilter, setStoreInstallerFilter] = useState<
    string | "全部"
  >("全部");
  const [acceptanceFilter, setAcceptanceFilter] =
    useState<AcceptanceLookupFilter>("全部");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodSelection>(DEFAULT_PERIOD);
  const [uiHydrated, setUiHydrated] = useState(false);

  const canEdit = canEditDeliveryPage(user);
  const readOnly = !canEdit;
  const installerOnly = isPersonalInstallerDelivery(user);

  const assignedStores = user ? resolveAssignedStoresForUser(user) : [];
  const managedStore = user ? resolveManagedStoreForLookup(user) : null;
  const managedStoresLabel =
    assignedStores.length > 0
      ? formatManagedStoresLabel(assignedStores)
      : managedStore ?? "";
  const storeSummaryShowAll = showStoreSummaryAllOption(user);

  const deliveryLookupStores = useMemo(
    () => (user ? resolveDeliveryLookupStores(user, orders) : []),
    [user, orders],
  );

  const scopedOrders = useMemo(
    () => scopeOrdersForDelivery(orders, user),
    [orders, user],
  );

  const deliveryOrders = scopedOrders;

  const periodDeliveryOrders = useMemo(
    () => filterOrdersByPeriod(deliveryOrders, period),
    [deliveryOrders, period],
  );

  const sessionResetKey = getSessionResetKey(user);

  useEffect(() => {
    if (!user) return;
    const savedPeriod = loadWorkbenchPeriod(user.username);
    if (savedPeriod) setPeriod(savedPeriod);
    const savedUi = loadDeliveryUi(user.username);
    if (installerOnly) {
      setViewMode("installer");
      setInstallerFilter(user.displayName);
    } else if (savedUi) {
      setViewMode(savedUi.viewMode);
    }
    setUiHydrated(true);
  }, [user, installerOnly]);

  useEffect(() => {
    if (!user || !uiHydrated) return;
    saveWorkbenchPeriod(user.username, period);
  }, [user, period, uiHydrated]);

  useEffect(() => {
    if (!user || !uiHydrated) return;
    saveDeliveryUi(user.username, { viewMode });
  }, [user, viewMode, uiHydrated]);

  const statusCounts = useMemo(() => {
    const counts = countDeliveryByStatus(periodDeliveryOrders);
    return counts as Record<string, number>;
  }, [periodDeliveryOrders]);

  const installerStats = useMemo(
    () => getInstallerDeliveryStats(periodDeliveryOrders),
    [periodDeliveryOrders],
  );

  const storeStats = useMemo(() => {
    const all = getStoreStatsByDispatcher(periodDeliveryOrders);
    if (deliveryLookupStores === null) return all;
    return filterStoreStatsByStores(all, deliveryLookupStores);
  }, [periodDeliveryOrders, deliveryLookupStores]);

  const storeDispatcherStatsStoreFilter = useMemo((): StoreName[] | null => {
    if (storeFilter !== "全部") return [storeFilter];
    if (deliveryLookupStores && deliveryLookupStores.length > 0) {
      return deliveryLookupStores;
    }
    return null;
  }, [storeFilter, deliveryLookupStores]);

  const acceptanceCounts = useMemo(
    () => countAcceptanceLookup(periodDeliveryOrders),
    [periodDeliveryOrders],
  );

  const storeLookupOrders = useMemo(
    () =>
      filterOrdersByDispatcherStore(
        sortOrdersNewestFirst(periodDeliveryOrders),
        storeFilter,
      ),
    [periodDeliveryOrders, storeFilter],
  );

  const storeDispatcherStats = useMemo(
    () =>
      getDispatcherStats(
        storeLookupOrders,
        staffRecords,
        storeDispatcherStatsStoreFilter,
      ),
    [storeLookupOrders, staffRecords, storeDispatcherStatsStoreFilter],
  );

  const storeDesignerStats = useMemo(() => {
    const source = filterOrdersByDispatcher(
      storeLookupOrders,
      storeDispatcherFilter,
    );
    return [...countByDesigner(source).entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([designer, total]) => ({
        designer,
        homeStore: "",
        total,
        byStatus: createEmptyStatusCounts(),
      }));
  }, [storeLookupOrders, storeDispatcherFilter]);

  const storeDesignerScopeCount = useMemo(
    () =>
      filterOrdersByDispatcher(storeLookupOrders, storeDispatcherFilter).length,
    [storeLookupOrders, storeDispatcherFilter],
  );

  const storeInstallerScopeOrders = useMemo(() => {
    let list = filterOrdersByDispatcher(
      storeLookupOrders,
      storeDispatcherFilter,
    );
    return filterOrdersByDesigner(list, storeDesignerFilter);
  }, [storeLookupOrders, storeDispatcherFilter, storeDesignerFilter]);

  const storeInstallerStats = useMemo(
    () => getInstallerDeliveryStats(storeInstallerScopeOrders),
    [storeInstallerScopeOrders],
  );

  const storePersonScope = useMemo(
    () => ({
      store: storeFilter,
      dispatcher: storeDispatcherFilter,
      designer: storeDesignerFilter,
      installer: storeInstallerFilter,
    }),
    [
      storeFilter,
      storeDispatcherFilter,
      storeDesignerFilter,
      storeInstallerFilter,
    ],
  );

  const searchBase = useMemo(() => {
    if (viewMode === "acceptance") {
      return filterOrdersByAcceptanceLookup(periodDeliveryOrders, acceptanceFilter);
    }
    return periodDeliveryOrders;
  }, [viewMode, periodDeliveryOrders, acceptanceFilter]);

  const searchResults = useMemo(
    () => sortOrdersNewestFirst(searchOrders(searchBase, query)),
    [searchBase, query],
  );

  const strongPin = useMemo(
    () => resolveStrongPinOrder(periodDeliveryOrders, query),
    [periodDeliveryOrders, query],
  );

  const lookupSearchCount = useMemo(() => {
    if (!query.trim()) return searchResults.length;
    return resolveStrongPinOrSearchMatches(
      periodDeliveryOrders,
      query,
      strongPin,
    ).length;
  }, [periodDeliveryOrders, query, strongPin, searchResults.length]);

  const lookupSearchHint = formatStrongPinSearchHint(
    strongPin,
    query,
    "汇总与列表按此周期筛选",
  );

  const resetDeliveryFiltersForViewMode = useCallback(
    (mode: DeliveryViewMode) => {
      setStatusFilter("全部");
      if (!installerOnly) {
        setInstallerFilter("全部");
      } else if (user) {
        setInstallerFilter(user.displayName);
      }
      setStoreFilter("全部");
      setStoreDispatcherFilter("全部");
      setStoreDesignerFilter("全部");
      setStoreInstallerFilter("全部");
      setAcceptanceFilter("全部");
      setSelectedId(null);
    },
    [installerOnly, user],
  );

  const handleViewModeChange = useCallback(
    (mode: DeliveryViewMode) => {
      setQuery("");
      resetDeliveryFiltersForViewMode(mode);
      setViewMode(mode);
    },
    [resetDeliveryFiltersForViewMode],
  );

  const handlePeriodChange = useCallback((next: PeriodSelection) => {
    setQuery("");
    setPeriod(next);
  }, []);

  const handleStatusFilterChange = useCallback(
    (value: FlowOrderStatus | "全部") => {
      setQuery("");
      setStatusFilter(value);
    },
    [],
  );

  const handleInstallerFilterChange = useCallback((value: string | "全部") => {
    setQuery("");
    setInstallerFilter(value);
  }, []);

  const handleStoreFilterChange = useCallback((value: StoreName | "全部") => {
    setQuery("");
    setStoreFilter(value);
    setStoreDispatcherFilter("全部");
    setStoreDesignerFilter("全部");
    setStoreInstallerFilter("全部");
  }, []);

  const handleStoreDispatcherFilterChange = useCallback((value: string | "全部") => {
    setQuery("");
    setStoreDispatcherFilter(value);
    setStoreDesignerFilter("全部");
    setStoreInstallerFilter("全部");
  }, []);

  const handleStoreDesignerFilterChange = useCallback(
    (value: DesignerName | "全部") => {
      setQuery("");
      setStoreDesignerFilter(value);
      setStoreInstallerFilter("全部");
    },
    [],
  );

  const handleStoreInstallerFilterChange = useCallback((value: string | "全部") => {
    setQuery("");
    setStoreInstallerFilter(value);
  }, []);

  const handleAcceptanceFilterChange = useCallback(
    (value: AcceptanceLookupFilter) => {
      setQuery("");
      setAcceptanceFilter(value);
    },
    [],
  );

  const isSearching = query.trim().length > 0;

  const filteredOrders = useMemo(() => {
    const q = query.trim();
    if (q) {
      return sortOrdersNewestFirst(
        resolveStrongPinOrSearchMatches(
          periodDeliveryOrders,
          query,
          strongPin,
        ),
      );
    }
    const sorted = sortOrdersNewestFirst(periodDeliveryOrders);
    if (viewMode === "status") {
      return filterOrdersByDeliveryStatus(sorted, statusFilter);
    }
    if (viewMode === "installer") {
      return filterOrdersByInstaller(sorted, installerFilter);
    }
    if (viewMode === "store") {
      let list = filterOrdersByDispatcherStore(sorted, storeFilter);
      list = filterOrdersByDispatcher(list, storeDispatcherFilter);
      list = filterOrdersByDesigner(list, storeDesignerFilter);
      return filterOrdersByInstaller(list, storeInstallerFilter);
    }
    return filterOrdersByAcceptanceLookup(sorted, acceptanceFilter);
  }, [
    periodDeliveryOrders,
    viewMode,
    statusFilter,
    installerFilter,
    storeFilter,
    storeDispatcherFilter,
    storeDesignerFilter,
    storeInstallerFilter,
    acceptanceFilter,
    query,
    strongPin,
  ]);

  useEffect(() => {
    if (strongPin.kind !== "pin") return;
    if (viewMode !== "status") setViewMode("status");
    const nextStatus = strongPin.order.status as FlowOrderStatus;
    if (statusFilter !== nextStatus) setStatusFilter(nextStatus);
    if (selectedId !== strongPin.order.id) setSelectedId(strongPin.order.id);
  }, [strongPin, viewMode, statusFilter, selectedId]);

  const selected =
    filteredOrders.find((o) => o.id === selectedId) ?? filteredOrders[0] ?? null;

  const tableTitle = isSearching
    ? strongPin.kind === "pin"
      ? formatStrongPinHeading(strongPin, "关键词查找结果")
      : `关键词查找结果（${lookupSearchCount}）`
    : viewMode === "status"
      ? statusFilter === "全部"
        ? "全部交付阶段订单"
        : `「${statusFilter}」订单明细`
      : viewMode === "installer"
        ? installerFilter === "全部"
          ? "全部安装师交付单"
          : `「${installerFilter}」交付单`
        : viewMode === "store"
          ? storeFilter === "全部"
            ? "全部门店交付单"
            : `「${storeFilter}」交付单`
          : `客户验收 · ${acceptanceFilter}`;

  useOnSessionScopeChange(sessionResetKey, () => {
    if (installerOnly && user) {
      setViewMode("installer");
      setInstallerFilter(user.displayName);
    } else {
      setViewMode("status");
      setInstallerFilter("全部");
    }
    setStatusFilter("全部");
    setStoreFilter("全部");
    setStoreDispatcherFilter("全部");
    setStoreDesignerFilter("全部");
    setStoreInstallerFilter("全部");
    setAcceptanceFilter("全部");
    setQuery("");
    setSelectedId(null);
  });

  useEffect(() => {
    if (!user || !uiHydrated) return;
    if (!isDeliveryViewModeVisible(user, viewMode)) {
      const modes = getVisibleDeliveryViewModes(user);
      handleViewModeChange(modes[0] ?? "status");
    }
  }, [user, viewMode, uiHydrated, handleViewModeChange]);

  useEffect(() => {
    if (!user || !deliveryLookupStores) return;
    if (
      storeFilter !== "全部" &&
      !deliveryLookupStores.includes(storeFilter)
    ) {
      setStoreFilter(
        deliveryLookupStores.length === 1 ? deliveryLookupStores[0] : "全部",
      );
    }
  }, [user, storeFilter, deliveryLookupStores]);

  useEffect(() => {
    if (!user || storeSummaryShowAll) return;
    if (assignedStores.length === 1 && storeFilter === "全部") {
      setStoreFilter(assignedStores[0]);
      return;
    }
    if (managedStore && storeFilter === "全部") {
      setStoreFilter(managedStore);
    }
  }, [user, storeFilter, storeSummaryShowAll, assignedStores, managedStore]);

  function handleAdvanceInstalled(e: FormEvent) {
    e.preventDefault();
    if (!selected || selected.status !== "已下单" || readOnly) return;
    advanceOrderStatus(selected.id, { remark: "推进至已安装" });
  }

  const showOrderWorkspace =
    viewMode !== "acceptance" ||
    acceptanceFilter === "待扫码" ||
    acceptanceFilter === "无电子验收" ||
    (acceptanceFilter === "全部" &&
      filteredOrders.some((o) => o.status === "已安装"));

  return (
    <RouteGuard canAccess={canAccessDeliveryPage(user)}>
      <AppShell
        title="验收与交付"
        board="/delivery"
        mainClassName={EVAL_PAGE_MAIN_CLASS}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {!isHydrated ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">
              加载订单数据…
            </div>
          ) : (
            <ModuleWorkbenchLayout
              periodBar={
                <WorkbenchPeriodSearchBar
                  period={period}
                  onPeriodChange={handlePeriodChange}
                  query={query}
                  onQueryChange={setQuery}
                  hint={lookupSearchHint}
                  placeholder="搜索客户、地址、安装师、设计师、门店…"
                  resultCount={lookupSearchCount}
                />
              }
              sidebar={
                <DeliverySidebar
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  user={user}
                />
              }
            >
              {!isSearching && viewMode === "status" ? (
                <section className="space-y-4">
                  <LookupSectionHeading title="按状态查找" />
                  <StatusSummaryBar
                    counts={statusCounts}
                    total={periodDeliveryOrders.length}
                    selected={statusFilter}
                    onSelect={(s) =>
                      handleStatusFilterChange(s as FlowOrderStatus | "全部")
                    }
                    statuses={DELIVERY_FLOW_STATUSES}
                  />
                </section>
              ) : null}

              {!isSearching && viewMode === "installer" ? (
                <section className="space-y-4">
                  <LookupSectionHeading
                    title="按安装师查找"
                    suffix={
                      managedStoresLabel ? (
                        <span className="ml-1 font-normal text-slate-500">
                          · {managedStoresLabel}
                        </span>
                      ) : null
                    }
                  />
                  <InstallerSummaryBar
                    stats={installerStats}
                    total={periodDeliveryOrders.length}
                    selected={installerFilter}
                    onSelect={handleInstallerFilterChange}
                    showAllOption={!installerOnly}
                  />
                </section>
              ) : null}

              {!isSearching && viewMode === "store" ? (
                <section className="space-y-4">
                  <LookupSectionHeading
                    title="按门店查找"
                    suffix={
                      managedStoresLabel ? (
                        <span className="ml-1 font-normal text-slate-500">
                          · {managedStoresLabel}
                        </span>
                      ) : null
                    }
                  />
                  <StoreSummaryBar
                    stats={storeStats}
                    total={periodDeliveryOrders.length}
                    selected={storeFilter}
                    onSelect={handleStoreFilterChange}
                    showAllOption={storeSummaryShowAll}
                  />
                  <div className="space-y-3 border-t border-slate-100 pt-3">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-600">派单人</p>
                      <DispatcherSummaryBar
                        stats={storeDispatcherStats}
                        total={storeLookupOrders.length}
                        selected={storeDispatcherFilter}
                        onSelect={handleStoreDispatcherFilterChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-600">设计师</p>
                      <DesignerSummaryBar
                        stats={storeDesignerStats}
                        total={storeDesignerScopeCount}
                        selected={storeDesignerFilter}
                        onSelect={handleStoreDesignerFilterChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-600">安装师</p>
                      <InstallerSummaryBar
                        stats={storeInstallerStats}
                        total={storeInstallerScopeOrders.length}
                        selected={storeInstallerFilter}
                        onSelect={handleStoreInstallerFilterChange}
                      />
                    </div>
                  </div>
                </section>
              ) : null}

              {!isSearching && viewMode === "acceptance" ? (
                <section className="space-y-4">
                  <LookupSectionHeading title="客户验收" />
                  <AcceptanceSummaryBar
                    counts={acceptanceCounts}
                    selected={acceptanceFilter}
                    onSelect={handleAcceptanceFilterChange}
                  />
                </section>
              ) : null}

              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">{tableTitle}</h2>

                <DeliveryResultSummary
                  orders={filteredOrders}
                  viewMode={viewMode}
                  acceptanceFilter={acceptanceFilter}
                  storeScope={
                    viewMode === "store" && !isSearching
                      ? storePersonScope
                      : undefined
                  }
                />

                {viewMode === "acceptance" &&
                (acceptanceFilter === "已评价" ||
                  acceptanceFilter === "全部" ||
                  acceptanceFilter === "无电子验收") ? (
                  <DeliveryCustomerAcceptancePanel
                    orders={filteredOrders}
                    filter={acceptanceFilter}
                    showLeaderboards={acceptanceFilter !== "无电子验收"}
                  />
                ) : null}

                {showOrderWorkspace ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="min-h-0 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 lg:min-h-[16rem]">
                      {filteredOrders.map((order) => (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => setSelectedId(order.id)}
                          className={`vi-list-picker-item ${
                            selected?.id === order.id
                              ? "vi-list-picker-item-active"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <OrderAnomalyName
                              order={order}
                              defaultClassName="font-medium text-slate-900"
                              includeOperationalHints={false}
                            >
                              {displayOrderNameColumn(order)}
                            </OrderAnomalyName>
                            <StatusBadge status={order.status} />
                          </div>
                          <OrderAnomalyBadges
                            order={order}
                            compact
                            includeOperationalHints={false}
                            className="mt-1"
                          />
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {displayCustomerNameColumn(order) || "—"}
                          </p>
                          {order.installation?.installerName ? (
                            <p className="mt-0.5 text-xs text-slate-400">
                              安装师：{order.installation.installerName}
                            </p>
                          ) : null}
                        </button>
                      ))}
                      {filteredOrders.length === 0 ? (
                        <p className="py-12 text-center text-sm text-slate-500">
                          暂无符合条件的交付单
                        </p>
                      ) : null}
                    </div>
                    {selected ? (
                      <DeliveryOrderDetail
                        order={selected}
                        readOnly={readOnly}
                        onAdvanceInstalled={handleAdvanceInstalled}
                        onInitiateAcceptance={initiateAcceptance}
                        onSkipElectronicAccept={
                          readOnly ? undefined : skipElectronicAcceptance
                        }
                      />
                    ) : null}
                  </div>
                ) : null}
              </section>
            </ModuleWorkbenchLayout>
          )}
        </div>
      </AppShell>
    </RouteGuard>
  );
}

function DeliveryOrderDetail({
  order,
  readOnly,
  onAdvanceInstalled,
  onInitiateAcceptance,
  onSkipElectronicAccept,
}: {
  order: Order;
  readOnly: boolean;
  onAdvanceInstalled: (e: FormEvent) => void;
  onInitiateAcceptance: (orderId: string) => void;
  onSkipElectronicAccept?: (orderId: string) => void;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <OrderAnomalyName
        order={order}
        as="h3"
        className="text-lg"
        defaultClassName="text-lg font-semibold text-slate-900"
        includeOperationalHints={false}
      >
        {displayOrderNameColumn(order)}
      </OrderAnomalyName>
      <p className="mt-1 text-xs text-slate-500">
        {displayCustomerNameColumn(order)
          ? `${displayCustomerNameColumn(order)} · `
          : null}
        录单 {formatOrderDate(order.createdAt)} · {order.dispatchStore}
      </p>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-400">客户姓名</dt>
          <dd className="text-slate-900">
            {displayCustomerNameColumn(order) || "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-400">地址</dt>
          <OrderAnomalyName
            order={order}
            as="dd"
            defaultClassName="text-slate-900"
            includeOperationalHints={false}
          >
            {order.address}
          </OrderAnomalyName>
        </div>
        <div>
          <dt className="text-slate-400">派单人</dt>
          <dd>{order.dispatcherName}</dd>
        </div>
        <div>
          <dt className="text-slate-400">设计师</dt>
          <dd>{order.designer ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">预算</dt>
          <dd>{formatBudget(order.budget)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">下单金额</dt>
          <dd>{formatOrderAmount(order.orderAmount)}</dd>
        </div>
      </dl>

      {order.status === "已下单" && !readOnly ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-800">更新进度</p>
          <form onSubmit={onAdvanceInstalled} className="flex flex-wrap gap-2">
            <Button type="submit" variant="outline">
              标记为已安装
            </Button>
          </form>
        </div>
      ) : null}

      {order.status === "已安装" || order.status === "已验收" ? (
        <AcceptancePanel
          order={order}
          onInitiateAcceptance={onInitiateAcceptance}
          onSkipElectronicAccept={onSkipElectronicAccept}
          readOnly={readOnly}
        />
      ) : null}
    </article>
  );
}
