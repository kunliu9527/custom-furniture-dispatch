"use client";

import { AdminViewTabs } from "@/components/admin/admin-view-tabs";
import { SiteBrandingSettings } from "@/components/admin/site-branding-settings";
import { StaffManagement } from "@/components/admin/staff-management";
import { AppShell } from "@/components/layout/app-shell";
import { OrderSearchBar } from "@/components/manager/order-search-bar";
import { LookupSectionHeading } from "@/components/shared/lookup-section-heading";
import { RouteGuard } from "@/components/auth/route-guard";
import { DispatchForm } from "@/components/orders/dispatch-form";
import { OrderList } from "@/components/orders/order-list";
import { resolveAssignedStoresForUser } from "@/lib/assigned-stores";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import {
  canCreateDispatch,
  canDeleteOrder,
  canAccessAdminPage,
  lockedDesignerName,
  lockedDispatcherName,
  resolveManagedStoreForLookup,
} from "@/lib/permissions";
import {
  getSessionBadgeLabel,
  getVisibleAdminViewModes,
} from "@/lib/nav-access";
import {
  filterOrdersByDispatcherAffiliatedStore,
  filterOrdersByDispatcherAffiliatedStores,
  resolveDispatchPreferredStore,
} from "@/lib/store-manager-scope";
import type { AdminViewMode } from "@/lib/admin-stats";
import { searchOrders } from "@/lib/order-search";
import {
  isActiveOrder,
  sortOrdersByLoginAccountPriority,
} from "@/lib/order-utils";
import { loadAdminViewMode, saveAdminViewMode } from "@/lib/admin-ui-persistence";
import { getSessionResetKey } from "@/lib/session-user";
import { useOnSessionScopeChange } from "@/lib/use-on-session-scope-change";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function AdminPage() {
  const { user } = useAuth();
  const { orders, addOrder, deleteOrder, isHydrated } = useOrders();
  const allowDeleteOrder = canDeleteOrder(user);
  const dispatcherLocked = lockedDispatcherName(user);
  const designerLocked = lockedDesignerName(user);
  const [viewMode, setViewMode] = useState<AdminViewMode>("dispatch");
  const [activeOrderSearchQuery, setActiveOrderSearchQuery] = useState("");
  const allowedAdminModes = useMemo(
    () => getVisibleAdminViewModes(user),
    [user],
  );
  const allowedAdminModesKey = allowedAdminModes.join(",");
  const assignedStores = user ? resolveAssignedStoresForUser(user) : [];
  const managedStore = user ? resolveManagedStoreForLookup(user) : null;
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
    setViewMode("dispatch");
  }, [sessionResetKey, allowedAdminModesKey, user, allowedAdminModes]);

  useEffect(() => {
    if (!user?.username) return;
    saveAdminViewMode(user.username, viewMode);
  }, [user?.username, viewMode]);

  const resetAdminBoardForSession = useCallback(() => {
    setActiveOrderSearchQuery("");
    setViewMode("dispatch");
  }, []);

  useOnSessionScopeChange(sessionResetKey, resetAdminBoardForSession);

  return (
    <RouteGuard canAccess={canAccessAdminPage(user)}>
      <AppShell title="门店派单" badge={getSessionBadgeLabel(user)}>
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

                <LookupSectionHeading
                  title="进行中订单列表"
                  suffix={
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      {isActiveOrderSearching
                        ? `匹配 ${filteredActiveOrders.length} / 共 ${activeOrders.length} 笔`
                        : `共 ${activeOrders.length} 笔`}
                    </span>
                  }
                />

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
          ) : null}
        </div>
      </AppShell>
    </RouteGuard>
  );
}
