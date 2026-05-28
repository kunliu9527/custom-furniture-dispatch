"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RouteGuard } from "@/components/auth/route-guard";
import { DesignerSwitcher } from "@/components/orders/designer-switcher";
import { OrderList } from "@/components/orders/order-list";
import { SupplementForm } from "@/components/orders/supplement-form";
import { StatusSummaryBar } from "@/components/manager/status-summary-bar";
import { LookupSectionHeading } from "@/components/shared/lookup-section-heading";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import {
  getEffectiveDesignerHomeStore,
  getEffectiveDesignersInStores,
  isCrossStoreOrderForDesigner,
} from "@/lib/designer-staff-store";
import { countOrdersByStatus, filterOrdersByStatus } from "@/lib/manager-stats";
import { isSupplementEligibleOrder } from "@/lib/order-utils";
import {
  canEditOrderOnDesignerPage,
  canEditWorkflowRemarkOnOrder,
  canPersonalModifyOrderContent,
  canUseDesignerSwitcher,
  canUserRevertOrderStatus,
  isPageReadOnly,
  lockedDesignerName,
  resolveDesignerLookupStores,
  scopeOrdersForUser,
} from "@/lib/permissions";
import {
  canAccessDesignerPage,
  canViewOtherDesignersOrders,
} from "@/lib/nav-access";
import { getDesignerDefaultName } from "@/lib/role-routes";
import { getSessionScopeKey } from "@/lib/session-user";
import type { DesignerName, OrderStatus } from "@/lib/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function sortOrdersNewestFirst<T extends { createdAt: string }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export default function DesignerPage() {
  const { user, staffRecords, designerHomeStoreIndex } = useAuth();
  const {
    orders,
    supplements,
    advanceOrderStatus,
    addWorkflowRemark,
    revertOrderStatus,
    markPendingRefund,
    confirmRefund,
    addSupplementOrder,
    isHydrated,
  } = useOrders();

  const lockedName = lockedDesignerName(user);
  const [currentDesigner, setCurrentDesigner] = useState<DesignerName>("汤雷");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "全部">("全部");

  const effectiveDesigner = (lockedName ?? currentDesigner) as DesignerName;
  const pageReadOnly = isPageReadOnly(user, "designer");
  const showSwitcher = canUseDesignerSwitcher(user);
  const designerLookupStores = resolveDesignerLookupStores(user);
  const sessionScopeKey = getSessionScopeKey(user);

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
    setStatusFilter("全部");
  }, [sessionScopeKey, lockedName, designerLookupStores, designerHomeStoreIndex]);

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

  const myOrders = useMemo(
    () =>
      sortOrdersNewestFirst(
        scopedOrders.filter((o) => o.designer === effectiveDesigner),
      ),
    [scopedOrders, effectiveDesigner],
  );

  const otherOrders = useMemo(
    () =>
      sortOrdersNewestFirst(
        scopedOrders.filter((o) => o.designer !== effectiveDesigner),
      ),
    [scopedOrders, effectiveDesigner],
  );

  const mySupplements = useMemo(
    () =>
      sortOrdersNewestFirst(
        supplements.filter((s) => s.designer === effectiveDesigner),
      ),
    [supplements, effectiveDesigner],
  );

  const statusCounts = useMemo(() => countOrdersByStatus(myOrders), [myOrders]);

  const filteredOrders = useMemo(
    () => filterOrdersByStatus(myOrders, statusFilter),
    [myOrders, statusFilter],
  );

  useEffect(() => {
    setStatusFilter("全部");
  }, [effectiveDesigner]);

  const pendingCount = myOrders.filter((o) => o.status === "待量尺").length;
  const crossStoreCount = myOrders.filter((o) =>
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

  const canEditOwn = !pageReadOnly;

  const canViewOthers = canViewOtherDesignersOrders(user);

  return (
    <RouteGuard canAccess={canAccessDesignerPage(user)}>
    <AppShell title="设计师工作台" badge={effectiveDesigner}>
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-indigo-100 bg-indigo-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600/80">
            {showSwitcher ? "当前查看设计师" : "当前登录设计师"}
          </p>
          {showSwitcher ? (
            <DesignerSwitcher
              value={effectiveDesigner}
              onChange={setCurrentDesigner}
              stores={designerLookupStores}
            />
          ) : (
            <p className="mt-2 text-lg font-semibold text-indigo-900">
              {effectiveDesigner}
            </p>
          )}
          <p className="mt-2 text-sm text-indigo-800">
            所在门店：<span className="font-semibold">{homeStore}</span>
          </p>
        </div>
        <div className="text-sm text-indigo-900 sm:text-right">
          <p>
            我的订单 <span className="font-semibold">{myOrders.length}</span> 笔
            · 增补单 <span className="font-semibold">{mySupplements.length}</span>{" "}
            笔
          </p>
          {pendingCount > 0 ? (
            <p className="mt-1 text-indigo-700">{pendingCount} 笔待量尺</p>
          ) : (
            <p className="mt-1 text-indigo-600">暂无待量尺订单</p>
          )}
          {crossStoreCount > 0 ? (
            <p className="mt-1 text-red-600">
              {crossStoreCount} 笔跨店派单（地址标红）
            </p>
          ) : null}
          {user?.role === "designer" ? (
            <Link
              href="/admin"
              className="mt-3 inline-block text-sm font-medium text-indigo-700 underline-offset-2 hover:underline"
            >
              前往门店派单录入派单（固定指派给自己）
            </Link>
          ) : null}
        </div>
      </div>

      <section className="space-y-8">
        {!isHydrated ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">
            加载订单数据…
          </div>
        ) : (
          <>
            <SupplementForm
              orders={supplementEligibleOrders}
              supplements={mySupplements}
              readOnly={!canEditOwn}
              onSubmit={(parentOrderId, amount) =>
                addSupplementOrder(parentOrderId, amount, effectiveDesigner)
              }
            />

            <div className="space-y-3">
              <LookupSectionHeading title="我的订单状态" />
              <StatusSummaryBar
                counts={statusCounts}
                total={myOrders.length}
                selected={statusFilter}
                onSelect={setStatusFilter}
              />
            </div>

            <div className="space-y-4">
              <LookupSectionHeading
                title={
                  statusFilter === "全部"
                    ? "我的派单"
                    : `我的「${statusFilter}」派单`
                }
                suffix={
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    {filteredOrders.length} 笔
                  </span>
                }
              />
              <OrderList
                orders={filteredOrders}
                emptyMessage={
                  statusFilter === "全部"
                    ? `${effectiveDesigner} 暂无派单，请等待店长指派`
                    : `暂无「${statusFilter}」状态的订单`
                }
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
                showAfterSales
              />
            </div>

            {canViewOthers && otherOrders.length > 0 ? (
              <div className="space-y-4">
                <LookupSectionHeading
                  title="其他设计师订单（仅查看）"
                  suffix={
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      {otherOrders.length} 笔
                    </span>
                  }
                />
                <OrderList
                  orders={otherOrders}
                  emptyMessage="暂无其他设计师订单"
                  showDesigner
                  isOrderReadOnly={() => true}
                  showAfterSales
                />
              </div>
            ) : null}
          </>
        )}
      </section>
    </AppShell>
    </RouteGuard>
  );
}
