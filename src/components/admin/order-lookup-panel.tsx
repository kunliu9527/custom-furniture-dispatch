"use client";

import { OrderList } from "@/components/orders/order-list";
import { OrderAnomalyBadges, OrderAnomalyName } from "@/components/orders/order-anomaly-badges";
import { OrderSearchBar, type OrderDispatchLookupFilter } from "@/components/manager/order-search-bar";
import { LookupSectionHeading } from "@/components/shared/lookup-section-heading";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import { searchOrders } from "@/lib/order-search";
import {
  displayCustomerNameColumn,
  displayOrderNameColumn,
} from "@/lib/order-remark";
import {
  formatStrongPinEmptyMessage,
  formatStrongPinSearchHint,
  resolveStrongPinOrder,
  resolveStrongPinOrSearchMatches,
} from "@/lib/strong-pin-order";
import {
  canAssignDesigner,
  canDeleteOrder,
  canDispatcherModifyOrder,
  canEditOrderOnDesignerPage,
  canEditWorkflowRemarkOnOrder,
  canModifyOrderInUserScope,
  canPersonalModifyOrderContent,
  canUserRevertOrderStatus,
  isDesignManagerAccess,
  scopeOrdersForAdminBoard,
} from "@/lib/permissions";
import { sortOrdersByLoginAccountPriority } from "@/lib/order-utils";
import {
  DEFAULT_PERIOD,
  filterOrdersByPeriod,
  type PeriodSelection,
} from "@/lib/period-filter";
import {
  loadWorkbenchPeriod,
  saveWorkbenchPeriod,
} from "@/lib/workbench-period-persistence";
import type { Order } from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface OrderLookupPanelProps {
  user: ReturnType<typeof useAuth>["user"];
  initialOrderId?: string | null;
}

export function OrderLookupPanel({
  user,
  initialOrderId = null,
}: OrderLookupPanelProps) {
  const {
    orders,
    advanceOrderStatus,
    addWorkflowRemark,
    revertOrderStatus,
    markPendingRefund,
    confirmRefund,
    assignDesignerToOrder,
    confirmDesignerAccept,
    initiateContract,
    offlineSignContract,
    skipElectronicSign,
    confirmContractOffline,
    updateOrderDeposit,
    initiateAcceptance,
    skipElectronicAcceptance,
    deleteOrder,
  } = useOrders();
  const { designerHomeStoreIndex } = useAuth();
  const anomalyOptions = {
    highlightCrossStore: true,
    designerHomeStoreIndex,
  };
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dispatchFilter, setDispatchFilter] =
    useState<OrderDispatchLookupFilter>("all");
  const [period, setPeriod] = useState<PeriodSelection>(DEFAULT_PERIOD);
  const [periodHydrated, setPeriodHydrated] = useState(false);
  const deepLinkApplied = useRef(false);
  const skipClearSelection = useRef(false);

  useEffect(() => {
    if (!user?.username) return;
    const saved = loadWorkbenchPeriod(user.username);
    if (saved) setPeriod(saved);
    setPeriodHydrated(true);
  }, [user?.username]);

  useEffect(() => {
    if (!user?.username || !periodHydrated) return;
    saveWorkbenchPeriod(user.username, period);
  }, [user?.username, period, periodHydrated]);

  const scoped = useMemo(() => {
    const base = sortOrdersByLoginAccountPriority(
      scopeOrdersForAdminBoard(orders, user),
      user,
    );
    return filterOrdersByPeriod(base, period);
  }, [orders, user, period]);

  const dispatchCounts = useMemo(
    () => ({
      all: scoped.length,
      undispatched: scoped.filter((o) => o.status === "未派单").length,
      dispatched: scoped.filter((o) => o.status !== "未派单").length,
    }),
    [scoped],
  );

  const dispatchScoped = useMemo(() => {
    if (dispatchFilter === "undispatched") {
      return scoped.filter((o) => o.status === "未派单");
    }
    if (dispatchFilter === "dispatched") {
      return scoped.filter((o) => o.status !== "未派单");
    }
    return scoped;
  }, [scoped, dispatchFilter]);

  const strongPin = useMemo(
    () => resolveStrongPinOrder(scoped, query),
    [scoped, query],
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    if (q) {
      return resolveStrongPinOrSearchMatches(scoped, query, strongPin);
    }
    return searchOrders(dispatchScoped, query);
  }, [scoped, dispatchScoped, query, strongPin]);

  const lookupSearchHint = formatStrongPinSearchHint(
    strongPin,
    query,
    "点击订单查看详情与操作",
  );

  const lookupEmptyMessage = useMemo(
    () =>
      formatStrongPinEmptyMessage(strongPin, query, "未找到匹配订单"),
    [strongPin, query],
  );

  const handlePeriodChange = useCallback((next: PeriodSelection) => {
    setQuery("");
    setPeriod(next);
  }, []);

  const handleDispatchFilterChange = useCallback(
    (filter: OrderDispatchLookupFilter) => {
      setQuery("");
      setDispatchFilter(filter);
    },
    [],
  );

  useEffect(() => {
    if (strongPin.kind !== "pin") return;
    const order = strongPin.order;
    const nextFilter: OrderDispatchLookupFilter =
      order.status === "未派单" ? "undispatched" : "all";
    if (dispatchFilter !== nextFilter) setDispatchFilter(nextFilter);
    if (selectedId !== order.id) setSelectedId(order.id);
  }, [strongPin, dispatchFilter, selectedId]);

  useEffect(() => {
    if (skipClearSelection.current) {
      skipClearSelection.current = false;
      return;
    }
    if (strongPin.kind === "pin") return;
    setSelectedId(null);
  }, [dispatchFilter, query, period, strongPin.kind]);

  useEffect(() => {
    if (!initialOrderId || deepLinkApplied.current) return;
    const order = scoped.find((o) => o.id === initialOrderId);
    if (!order) return;
    deepLinkApplied.current = true;
    skipClearSelection.current = true;
    setPeriod({ preset: "all" });
    if (order.status === "未派单") {
      setDispatchFilter("undispatched");
    } else {
      setDispatchFilter("all");
    }
    setQuery("");
    setSelectedId(initialOrderId);
  }, [initialOrderId, scoped]);

  const selectedOrder =
    filtered.find((o) => o.id === selectedId) ??
    (strongPin.kind === "pin" ? strongPin.order : null);

  function isReadOnly(order: Order): boolean {
    if (!user) return true;
    if (!canModifyOrderInUserScope(user, order)) return true;
    if (user.role === "dispatcher") {
      return !canDispatcherModifyOrder(user, order);
    }
    if (user.role === "designer") {
      return !canEditOrderOnDesignerPage(user, order);
    }
    if (user.accessLevel === "store_manager") return true;
    return false;
  }

  function canEdit(order: Order): boolean {
    if (!user || isReadOnly(order)) return false;
    if (user.role === "designer") {
      return canPersonalModifyOrderContent(user, order);
    }
    return true;
  }

  return (
    <section
      className="flex min-h-0 flex-col overflow-hidden vi-workbench-card shadow-[var(--vi-shadow-sm)] h-[calc(100dvh-var(--eval-site-nav-h)-var(--eval-workbench-nav-gap)-var(--eval-scroll-bottom-pad)-2rem)] max-h-[calc(100dvh-var(--eval-site-nav-h)-var(--eval-workbench-nav-gap)-var(--eval-scroll-bottom-pad)-2rem)]"
    >
      <div className="shrink-0 border-b border-slate-100 bg-white p-4">
        <OrderSearchBar
          embedded
          value={query}
          onChange={setQuery}
          resultCount={filtered.length}
          placeholder="查询全部状态：客户、电话、地址、派单人、设计师、门店、状态…"
          period={period}
          onPeriodChange={handlePeriodChange}
          dispatchFilter={dispatchFilter}
          onDispatchFilterChange={handleDispatchFilterChange}
          dispatchCounts={dispatchCounts}
        />
      </div>

      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <LookupSectionHeading
          title="订单状态查询"
          suffix={
            <span className="ml-2 text-xs font-normal text-slate-500">
              {query.trim()
                ? lookupSearchHint
                : `共 ${filtered.length} 笔 · 点击订单查看详情与操作`}
            </span>
          }
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
        <div className="min-h-0 space-y-2 overflow-y-auto overscroll-contain border-b border-slate-100 p-2 lg:border-b-0 lg:border-r">
            {filtered.length === 0 ? (
              <div className="vi-empty-state py-12 text-sm">
                {lookupEmptyMessage}
              </div>
            ) : (
              filtered.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedId(order.id)}
                  className={`vi-list-picker-item ${
                    selectedId === order.id ? "vi-list-picker-item-active" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <OrderAnomalyName
                      order={order}
                      className="min-w-0 flex-1 leading-snug"
                      defaultClassName="font-medium text-slate-900"
                      {...anomalyOptions}
                    >
                      {displayOrderNameColumn(order)}
                    </OrderAnomalyName>
                    <span className="shrink-0 text-xs text-slate-500">
                      {order.status}
                    </span>
                  </div>
                  <OrderAnomalyBadges order={order} compact {...anomalyOptions} />
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {displayCustomerNameColumn(order) || "—"}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="flex min-h-0 min-w-0 flex-col overflow-y-auto overscroll-contain p-2 sm:p-3">
            {selectedOrder ? (
              <OrderList
                layout="stack"
                headingMode="address"
                orders={[selectedOrder]}
                emptyMessage=""
                showDesigner
                showCustomerFlow
                showAssignDesigner={selectedOrder.status === "未派单"}
                isOrderReadOnly={isReadOnly}
                canRevertOrder={(order) =>
                  canUserRevertOrderStatus(user, order) && canEdit(order)
                }
                canEditRemark={(order) =>
                  canEditWorkflowRemarkOnOrder(user, order) && canEdit(order)
                }
                onAdvanceStatus={
                  canEdit(selectedOrder) ? advanceOrderStatus : undefined
                }
                onAddWorkflowRemark={
                  canEdit(selectedOrder) ? addWorkflowRemark : undefined
                }
                onRevertStatus={
                  canEdit(selectedOrder) ? revertOrderStatus : undefined
                }
                onMarkPendingRefund={
                  canEdit(selectedOrder) ? markPendingRefund : undefined
                }
                onConfirmRefund={
                  canEdit(selectedOrder) ? confirmRefund : undefined
                }
                onConfirmDesignerAccept={
                  canEdit(selectedOrder) ? confirmDesignerAccept : undefined
                }
                showAcceptAction={canEdit(selectedOrder)}
                onAssignDesigner={
                  canAssignDesigner(user, selectedOrder)
                    ? (id, designer, force) =>
                        assignDesignerToOrder(id, designer, force)
                    : undefined
                }
                onInitiateContract={
                  canEdit(selectedOrder) ? initiateContract : undefined
                }
                onUpdateDeposit={
                  canEdit(selectedOrder) ? updateOrderDeposit : undefined
                }
                onOfflineSign={
                  isDesignManagerAccess(user) ? offlineSignContract : undefined
                }
                onSkipElectronicSign={
                  isDesignManagerAccess(user) ? skipElectronicSign : undefined
                }
                onConfirmContractOffline={
                  isDesignManagerAccess(user)
                    ? confirmContractOffline
                    : undefined
                }
                canConfirmContractOffline={isDesignManagerAccess(user)}
                onInitiateAcceptance={
                  canEdit(selectedOrder) ? initiateAcceptance : undefined
                }
                onSkipElectronicAccept={
                  canEdit(selectedOrder) ? skipElectronicAcceptance : undefined
                }
                onDeleteOrder={
                  canDeleteOrder(user) ? deleteOrder : undefined
                }
              />
            ) : (
              <div className="flex h-full min-h-[280px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-sm text-slate-500">
                请从左侧选择订单查看详情
              </div>
            )}
          </div>
        </div>
    </section>
  );
}
