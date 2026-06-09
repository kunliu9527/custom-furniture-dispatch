"use client";



import { AppShell } from "@/components/layout/app-shell";

import { RouteGuard } from "@/components/auth/route-guard";

import { DesignerOrderHintLine } from "@/components/designer/designer-order-hint-line";
import { DesignerWorkbenchSidebar, DesignerMobileNav } from "@/components/designer/designer-workbench-sidebar";
import { DesignerPeriodSearchBar } from "@/components/designer/designer-period-search-bar";
import { DesignerSupplementPanel } from "@/components/designer/designer-supplement-panel";
import { OrderList } from "@/components/orders/order-list";

import { ModuleWorkbenchLayout } from "@/components/workbench/module-workbench-layout";

import { EVAL_PAGE_MAIN_CLASS } from "@/components/evaluation/sticky-section";

import { LookupSectionHeading } from "@/components/shared/lookup-section-heading";

import { useAuth } from "@/context/auth-context";

import { useOrders } from "@/context/orders-context";

import {

  getEffectiveDesignerHomeStore,

  getEffectiveDesignersInStores,

  isCrossStoreOrderForDesigner,

} from "@/lib/designer-staff-store";

import { isDesignerSupplementView } from "@/lib/designer-sidebar-filter";

import { countOrdersByStatus, filterOrdersByStatus } from "@/lib/manager-stats";

import { needsDesignerAcceptance } from "@/lib/designer-load";

import {

  isSupplementEligibleOrder,

  sortOrdersByFlowStatus,

  sortOrdersNewestFirst,

  applyOrderPositionPin,

  ORDER_POSITION_PIN_MS,

} from "@/lib/order-utils";
import type { OrderStatusTransitionPayload } from "@/lib/order-status-feedback";
import { searchOrders } from "@/lib/order-search";
import { resolveOrderDisplayName } from "@/lib/order-remark";
import { resolveStrongPinOrder } from "@/lib/strong-pin-order";

import {
  canEditOrderOnDesignerPage,

  canEditWorkflowRemarkOnOrder,

  canPersonalModifyOrderContent,

  canUseDesignerSwitcher,

  canUserRevertOrderStatus,

  canOfflineSignContract,

  isPageReadOnly,

  lockedDesignerName,

  resolveDesignerLookupStores,

  scopeOrdersForUser,

} from "@/lib/permissions";

import { canAccessDesignerPage } from "@/lib/nav-access";

import { getDesignerDefaultName } from "@/lib/role-routes";

import { getSessionResetKey } from "@/lib/session-user";

import {

  DEFAULT_PERIOD,

  filterOrdersByPeriod,

  filterSupplementsByPeriod,

  type PeriodSelection,

} from "@/lib/period-filter";

import {

  loadDesignerUi,

  saveDesignerUi,

} from "@/lib/designer-ui-persistence";

import {

  loadWorkbenchPeriod,

  saveWorkbenchPeriod,

} from "@/lib/workbench-period-persistence";

import type { DesignerSidebarFilter } from "@/lib/designer-sidebar-filter";

import type { DesignerName, Order } from "@/lib/types";

import Link from "next/link";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";



export default function DesignerPage() {

  const deepLinkApplied = useRef(false);
  const { user, staffRecords, designerHomeStoreIndex } = useAuth();

  const {

    orders,

    supplements,

    advanceOrderStatus,

    addWorkflowRemark,

    revertOrderStatus,

    markPendingRefund,

    confirmRefund,

    confirmDesignerAccept,

    addSupplementOrder,

    initiateContract,

    offlineSignContract,

    skipElectronicSign,

    confirmContractOffline,

    updateOrderDeposit,

    initiateAcceptance,

    skipElectronicAcceptance,

    isHydrated,

  } = useOrders();



  const lockedName = lockedDesignerName(user);

  const [currentDesigner, setCurrentDesigner] = useState<DesignerName>("汤雷");

  const [statusFilter, setStatusFilter] =

    useState<DesignerSidebarFilter>("全部");

  const [period, setPeriod] = useState<PeriodSelection>(DEFAULT_PERIOD);
  const [orderQuery, setOrderQuery] = useState("");
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null);
  const [uiHydrated, setUiHydrated] = useState(false);

  const [orderPositionPin, setOrderPositionPin] = useState<{
    orderId: string;
    index: number;
  } | null>(null);

  const orderPositionPinTimerRef = useRef<number | null>(null);

  const effectiveDesigner = (lockedName ?? currentDesigner) as DesignerName;

  const pageReadOnly = isPageReadOnly(user, "designer");

  const showSwitcher = canUseDesignerSwitcher(user);

  const designerLookupStores = resolveDesignerLookupStores(user);

  const sessionResetKey = getSessionResetKey(user);

  const supplementView = isDesignerSupplementView(statusFilter);



  useEffect(() => {

    const name = getDesignerDefaultName(user);

    if (name) {

      setCurrentDesigner(name);

    } else if (lockedName) {

      setCurrentDesigner(lockedName as DesignerName);

    } else if (designerLookupStores?.length) {

      const roster = getEffectiveDesignersInStores(

        designerLookupStores,

        designerHomeStoreIndex,

        staffRecords,

      );

      if (roster.length > 0) {

        setCurrentDesigner(roster[0].name as DesignerName);

      }

    }

    if (user?.username) {

      const saved = loadDesignerUi(user.username);

      const savedPeriod = loadWorkbenchPeriod(user.username);

      if (saved) {

        setStatusFilter(saved.statusFilter);

      } else {

        setStatusFilter("全部");

      }

      if (savedPeriod) {

        setPeriod(savedPeriod);

      }

    } else {

      setStatusFilter("全部");

    }

    setUiHydrated(true);

  }, [sessionResetKey, lockedName, designerLookupStores, designerHomeStoreIndex, user, staffRecords]);



  useEffect(() => {

    if (!user?.username || !uiHydrated) return;

    saveDesignerUi(user.username, { statusFilter });

    saveWorkbenchPeriod(user.username, period);

  }, [user?.username, statusFilter, period, uiHydrated]);



  const homeStore =

    user?.role === "designer" && user.homeStore

      ? user.homeStore

      : getEffectiveDesignerHomeStore(

          effectiveDesigner,

          designerHomeStoreIndex,

        );



  const scopedOrders = useMemo(

    () => scopeOrdersForUser(orders, user),

    [orders, user],

  );



  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("orderId");
    if (orderId) setFocusOrderId(orderId);
  }, []);

  useEffect(() => {
    if (!isHydrated || !uiHydrated || !focusOrderId) return;
    const order = scopedOrders.find((o) => o.id === focusOrderId);
    if (!order) return;
    if (
      order.designer &&
      order.designer !== effectiveDesigner &&
      !lockedName
    ) {
      setCurrentDesigner(order.designer as DesignerName);
      return;
    }
    if (deepLinkApplied.current) return;
    deepLinkApplied.current = true;
    setPeriod({ preset: "all" });
    if (needsDesignerAcceptance(order)) {
      setStatusFilter("待量尺");
    } else {
      setStatusFilter("全部");
    }
    setOrderQuery(resolveOrderDisplayName(order));
  }, [
    isHydrated,
    uiHydrated,
    focusOrderId,
    scopedOrders,
    effectiveDesigner,
    lockedName,
  ]);



  const myOrders = useMemo(

    () =>

      sortOrdersByFlowStatus(

        filterOrdersByPeriod(

          scopedOrders.filter((o) => o.designer === effectiveDesigner),

          period,

        ),

      ),

    [scopedOrders, effectiveDesigner, period],

  );



  const mySupplements = useMemo(

    () =>

      sortOrdersNewestFirst(

        supplements.filter((s) => s.designer === effectiveDesigner),

      ),

    [supplements, effectiveDesigner],

  );



  const periodSupplements = useMemo(

    () => filterSupplementsByPeriod(mySupplements, period),

    [mySupplements, period],

  );



  const statusCounts = useMemo(() => countOrdersByStatus(myOrders), [myOrders]);

  const strongPin = useMemo(
    () => resolveStrongPinOrder(myOrders, orderQuery),
    [myOrders, orderQuery],
  );

  const isStrongPinActive = strongPin.kind === "pin";

  const handleStatusFilterChange = useCallback(
    (next: DesignerSidebarFilter) => {
      setOrderQuery("");
      setStatusFilter(next);
    },
    [],
  );

  const handlePeriodChange = useCallback((next: PeriodSelection) => {
    setOrderQuery("");
    setPeriod(next);
  }, []);

  const filteredOrders = useMemo(() => {
    if (isDesignerSupplementView(statusFilter)) return [];

    if (strongPin.kind === "pin") {
      return [strongPin.order];
    }

    const q = orderQuery.trim();
    if (q) {
      const globalMatches = searchOrders(myOrders, orderQuery);
      if (globalMatches.length === 0) return [];
      if (globalMatches.length > 1) return globalMatches;
    }

    const byStatus = filterOrdersByStatus(myOrders, statusFilter);
    let list = searchOrders(byStatus, orderQuery);
    if (focusOrderId && !q) {
      const focused = myOrders.find((o) => o.id === focusOrderId);
      if (focused && !list.some((o) => o.id === focusOrderId)) {
        list = [focused, ...list];
      }
    }
    return list;
  }, [myOrders, statusFilter, orderQuery, focusOrderId, strongPin]);

  const handleOrderStatusUpdated = useCallback(
    ({ orderId }: OrderStatusTransitionPayload) => {
      if (statusFilter !== "全部" || strongPin.kind === "pin") return;
      const index = filteredOrders.findIndex((order) => order.id === orderId);
      if (index < 0) return;
      setOrderPositionPin({ orderId, index });
    },
    [statusFilter, strongPin.kind, filteredOrders],
  );

  const displayOrders = useMemo(() => {
    if (statusFilter !== "全部" || !orderPositionPin) return filteredOrders;
    return applyOrderPositionPin(filteredOrders, orderPositionPin);
  }, [filteredOrders, orderPositionPin, statusFilter]);

  useEffect(() => {
    if (statusFilter !== "全部") {
      setOrderPositionPin(null);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!orderPositionPin) return;
    if (orderPositionPinTimerRef.current != null) {
      window.clearTimeout(orderPositionPinTimerRef.current);
    }
    orderPositionPinTimerRef.current = window.setTimeout(() => {
      setOrderPositionPin(null);
      orderPositionPinTimerRef.current = null;
    }, ORDER_POSITION_PIN_MS);
    return () => {
      if (orderPositionPinTimerRef.current != null) {
        window.clearTimeout(orderPositionPinTimerRef.current);
      }
    };
  }, [orderPositionPin]);

  useEffect(() => {
    if (strongPin.kind !== "pin") return;
    const nextStatus = strongPin.order.status as DesignerSidebarFilter;
    if (statusFilter === nextStatus) return;
    setStatusFilter(nextStatus);
  }, [strongPin, statusFilter]);

  const orderSearchHint = useMemo(() => {
    if (supplementView) return "仅筛选可关联增补单订单";
    if (strongPin.kind === "pin") {
      return `强定位 · 侧栏已同步「${strongPin.order.status}」· 更新后将跟随状态`;
    }
    if (orderQuery.trim() && strongPin.kind === "none") {
      return "未找到唯一订单，请核对查询或切换统计周期为「全部」";
    }
    if (orderQuery.trim() && strongPin.kind === "ambiguous") {
      return `匹配 ${strongPin.count} 笔，请缩小查询范围以强定位`;
    }
    return "仅筛选本人订单列表";
  }, [supplementView, strongPin, orderQuery]);

  const orderListHeading = useMemo(() => {
    if (strongPin.kind === "pin") {
      return `强定位 · ${resolveOrderDisplayName(strongPin.order)}`;
    }
    if (statusFilter === "全部") return "我的派单";
    return `我的「${statusFilter}」派单`;
  }, [strongPin, statusFilter]);

  const orderListEmptyMessage = useMemo(() => {
    if (orderQuery.trim() && strongPin.kind === "none") {
      return "当前周期内未找到唯一订单，请核对查询或切换统计周期为「全部」";
    }
    if (orderQuery.trim() && strongPin.kind === "ambiguous") {
      return "匹配多笔订单，请缩小查询范围";
    }
    if (orderQuery.trim()) {
      return "未找到匹配订单";
    }
    if (statusFilter === "全部") {
      return `${effectiveDesigner} 暂无派单，请等待店长指派`;
    }
    return `暂无「${statusFilter}」状态的订单`;
  }, [orderQuery, strongPin, statusFilter, effectiveDesigner]);

  useEffect(() => {
    if (focusOrderId) return;
    setStatusFilter("全部");
    setOrderQuery("");
  }, [effectiveDesigner, focusOrderId]);



  const pendingCount = myOrders.filter((o) => o.status === "待量尺").length;

  const acceptPendingCount = myOrders.filter(needsDesignerAcceptance).length;

  const crossStoreCount = myOrders.filter(

    (o) =>

      o.designer != null &&

      isCrossStoreOrderForDesigner(

        o.dispatchStore,

        o.designer,

        designerHomeStoreIndex,

      ),

  ).length;



  const supplementEligibleOrders = useMemo(
    () => myOrders.filter(isSupplementEligibleOrder),
    [myOrders],
  );

  const supplementSearchCount = useMemo(
    () => searchOrders(supplementEligibleOrders, orderQuery).length,
    [supplementEligibleOrders, orderQuery],
  );



  const canEditOwn = !pageReadOnly;



  const renderOrderDetail = useCallback(
    (order: Order, supplementPane: ReactNode) => (
      <OrderList
        layout="stack"
        headingMode="address"
        orders={[order]}
        emptyMessage=""
        showDesigner={false}
        highlightCrossStore
        supplementPane={supplementPane}

        isOrderReadOnly={(o) =>

          !canEditOrderOnDesignerPage(user, o) ||

          !canPersonalModifyOrderContent(user, o)

        }

        canRevertOrder={(o) =>

          canUserRevertOrderStatus(user, o) &&

          canPersonalModifyOrderContent(user, o)

        }

        canEditRemark={(o) =>

          canEditOrderOnDesignerPage(user, o) &&

          canEditWorkflowRemarkOnOrder(user, o)

        }

        onAdvanceStatus={canEditOwn ? advanceOrderStatus : undefined}

        onAddWorkflowRemark={canEditOwn ? addWorkflowRemark : undefined}

        onRevertStatus={canEditOwn ? revertOrderStatus : undefined}

        onMarkPendingRefund={canEditOwn ? markPendingRefund : undefined}

        onConfirmRefund={canEditOwn ? confirmRefund : undefined}

        onConfirmDesignerAccept={

          canEditOwn ? confirmDesignerAccept : undefined

        }

        showAcceptAction={canEditOwn}

        showAfterSales

        showCustomerFlow={canEditOwn}

        onInitiateContract={canEditOwn ? initiateContract : undefined}

        onUpdateDeposit={canEditOwn ? updateOrderDeposit : undefined}

        onOfflineSign={
          canEditOwn && canOfflineSignContract(user)
            ? offlineSignContract
            : undefined
        }

        onSkipElectronicSign={
          canEditOwn && canOfflineSignContract(user)
            ? skipElectronicSign
            : undefined
        }

        onConfirmContractOffline={
          canEditOwn && canOfflineSignContract(user)
            ? confirmContractOffline
            : undefined
        }

        canConfirmContractOffline={
          canEditOwn && canOfflineSignContract(user)
        }

        onInitiateAcceptance={canEditOwn ? initiateAcceptance : undefined}

        onSkipElectronicAccept={

          canEditOwn ? skipElectronicAcceptance : undefined

        }

      />

    ),

    [

      user,

      canEditOwn,

      advanceOrderStatus,

      addWorkflowRemark,

      revertOrderStatus,

      markPendingRefund,

      confirmRefund,

      confirmDesignerAccept,

      initiateContract,

      updateOrderDeposit,

      offlineSignContract,

      confirmContractOffline,

      initiateAcceptance,

      skipElectronicAcceptance,

    ],

  );



  return (

    <RouteGuard canAccess={canAccessDesignerPage(user)}>

      <AppShell

        title="设计师工作台"
        board="/designer"
        mainClassName={EVAL_PAGE_MAIN_CLASS}

      >

        {!isHydrated ? (

          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">

            加载订单数据…

          </div>

        ) : (

          <ModuleWorkbenchLayout
            mobileTabs={
              <DesignerMobileNav
                showSwitcher={showSwitcher}
                effectiveDesigner={effectiveDesigner}
                onDesignerChange={setCurrentDesigner}
                designerLookupStores={designerLookupStores}
                homeStore={homeStore}
                myOrderCount={myOrders.length}
                statusFilter={statusFilter}
                onStatusFilterChange={handleStatusFilterChange}
                counts={statusCounts}
              />
            }
            periodBar={
              <DesignerPeriodSearchBar
                headingLabel="查询订单"
                period={period}
                onPeriodChange={handlePeriodChange}
                query={orderQuery}
                onQueryChange={setOrderQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={handleStatusFilterChange}
                supplementCount={periodSupplements.length}
                hint={orderSearchHint}
                placeholder={
                  supplementView
                    ? "查询可关联订单：客户、电话、地址、状态…"
                    : "查询订单：客户、电话、地址、状态…"
                }
                resultCount={
                  supplementView ? supplementSearchCount : filteredOrders.length
                }
              />
            }
            sidebar={
              <DesignerWorkbenchSidebar
                showSwitcher={showSwitcher}
                effectiveDesigner={effectiveDesigner}
                onDesignerChange={setCurrentDesigner}
                designerLookupStores={designerLookupStores}
                homeStore={homeStore}
                myOrderCount={myOrders.length}
                statusFilter={statusFilter}
                onStatusFilterChange={handleStatusFilterChange}
                counts={statusCounts}
              />
            }
          >

              {supplementView ? (

                <DesignerSupplementPanel
                  eligibleOrders={supplementEligibleOrders}
                  supplements={mySupplements}
                  period={period}
                  query={orderQuery}
                  readOnly={!canEditOwn}

                  onSubmit={(parentOrderId, amount) =>

                    addSupplementOrder(parentOrderId, amount, effectiveDesigner)

                  }

                  detailPane={renderOrderDetail}

                />

              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <LookupSectionHeading
                        title={orderListHeading}
                        suffix={
                          <span className="ml-2 text-xs font-normal text-zinc-500">
                            {filteredOrders.length} 笔
                            {isStrongPinActive ? (
                              <span className="ml-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-200/60">
                                强定位
                              </span>
                            ) : null}
                          </span>
                        }
                      />
                      {statusFilter === "全部" && user?.role === "designer" ? (
                        <Link
                          href="/admin"
                          className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200/60 transition hover:bg-indigo-100"
                        >
                          前往新客户开发录入（固定指派给自己）
                        </Link>
                      ) : null}
                    </div>
                    {statusFilter === "全部" ? (
                      <DesignerOrderHintLine
                        pendingCount={pendingCount}
                        acceptPendingCount={acceptPendingCount}
                        crossStoreCount={crossStoreCount}
                        supplementCount={periodSupplements.length}
                      />
                    ) : null}
                  </div>
                  <OrderList

                    orders={displayOrders}

                    headingMode="address"

                    inlineStatusFeedback={statusFilter !== "全部"}

                    onStatusUpdated={
                      statusFilter === "全部" ? handleOrderStatusUpdated : undefined
                    }

                    focusOrderId={focusOrderId}

                    emptyMessage={orderListEmptyMessage}

                    showDesigner={false}

                    highlightCrossStore

                    isOrderReadOnly={(order) =>

                      !canEditOrderOnDesignerPage(user, order) ||

                      !canPersonalModifyOrderContent(user, order)

                    }

                    canRevertOrder={(order) =>

                      canUserRevertOrderStatus(user, order) &&

                      canPersonalModifyOrderContent(user, order)

                    }

                    canEditRemark={(order) =>

                      canEditOrderOnDesignerPage(user, order) &&

                      canEditWorkflowRemarkOnOrder(user, order)

                    }

                    onAdvanceStatus={

                      canEditOwn ? advanceOrderStatus : undefined

                    }

                    onAddWorkflowRemark={

                      canEditOwn ? addWorkflowRemark : undefined

                    }

                    onRevertStatus={canEditOwn ? revertOrderStatus : undefined}

                    onMarkPendingRefund={

                      canEditOwn ? markPendingRefund : undefined

                    }

                    onConfirmRefund={canEditOwn ? confirmRefund : undefined}

                    onConfirmDesignerAccept={

                      canEditOwn ? confirmDesignerAccept : undefined

                    }

                    showAcceptAction={canEditOwn}

                    showAfterSales

                    showCustomerFlow={canEditOwn}

                    onInitiateContract={

                      canEditOwn ? initiateContract : undefined

                    }

                    onUpdateDeposit={canEditOwn ? updateOrderDeposit : undefined}

                    onOfflineSign={
                      canEditOwn && canOfflineSignContract(user)
                        ? offlineSignContract
                        : undefined
                    }

                    onSkipElectronicSign={
                      canEditOwn && canOfflineSignContract(user)
                        ? skipElectronicSign
                        : undefined
                    }

                    onConfirmContractOffline={
                      canEditOwn && canOfflineSignContract(user)
                        ? confirmContractOffline
                        : undefined
                    }

                    canConfirmContractOffline={
                      canEditOwn && canOfflineSignContract(user)
                    }

                    onInitiateAcceptance={

                      canEditOwn ? initiateAcceptance : undefined

                    }

                    onSkipElectronicAccept={

                      canEditOwn ? skipElectronicAcceptance : undefined

                    }

                  />

                </div>

              )}

            </ModuleWorkbenchLayout>

        )}

      </AppShell>

    </RouteGuard>

  );

}

