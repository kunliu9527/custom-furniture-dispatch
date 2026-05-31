"use client";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ModuleWorkbenchLayout } from "@/components/workbench/module-workbench-layout";
import { EVAL_PAGE_MAIN_CLASS, EVAL_WORKBENCH_FILL_PANE } from "@/components/evaluation/sticky-section";
import { OrderLookupPanel } from "@/components/admin/order-lookup-panel";
import { SiteBrandingSettings } from "@/components/admin/site-branding-settings";
import { StaffManagement } from "@/components/admin/staff-management";
import { AppShell } from "@/components/layout/app-shell";
import { LookupSectionHeading } from "@/components/shared/lookup-section-heading";
import { RouteGuard } from "@/components/auth/route-guard";
import { DispatchForm } from "@/components/orders/dispatch-form";
import { OrderList } from "@/components/orders/order-list";
import { resolveAssignedStoresForUser } from "@/lib/assigned-stores";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import {
  canAssignDesigner,
  canCreateDispatch,
  canAccessAdminPage,
  lockedDesignerName,
  lockedDispatcherName,
  resolveManagedStoreForLookup,
} from "@/lib/permissions";
import {
  getVisibleAdminViewModes,
} from "@/lib/nav-access";
import {
  filterOrdersByDispatcherAffiliatedStore,
  filterOrdersByDispatcherAffiliatedStores,
  resolveDispatchPreferredStore,
} from "@/lib/store-manager-scope";
import type { AdminViewMode } from "@/lib/admin-stats";
import type { DesignerName } from "@/lib/types";
import { sortOrdersByLoginAccountPriority } from "@/lib/order-utils";
import { loadAdminViewMode, saveAdminViewMode } from "@/lib/admin-ui-persistence";
import { getSessionResetKey } from "@/lib/session-user";
import { useOnSessionScopeChange } from "@/lib/use-on-session-scope-change";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function AdminPage() {
  const { user } = useAuth();
  const { orders, addOrder, assignDesignerToOrder, isHydrated } = useOrders();
  const dispatcherLocked = lockedDispatcherName(user);
  const designerLocked = lockedDesignerName(user);
  const [viewMode, setViewMode] = useState<AdminViewMode>("dispatch");
  const [lookupOrderId, setLookupOrderId] = useState<string | null>(null);
  const [dispatchFocusDesigner, setDispatchFocusDesigner] = useState<
    string | null
  >(null);
  const urlNavApplied = useRef(false);
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

  const undispatchedOrders = useMemo(() => {
    let list = orders.filter((o) => o.status === "未派单");
    if (user?.accessLevel === "store_manager" && managedStore) {
      list = filterOrdersByDispatcherAffiliatedStore(list, managedStore);
    } else if (assignedStores.length > 0) {
      list = filterOrdersByDispatcherAffiliatedStores(list, assignedStores);
    } else if (user?.role === "dispatcher" && user.accessLevel === "personal") {
      list = list.filter((o) => o.dispatcherName === user.displayName);
    }
    return sortOrdersByLoginAccountPriority(list, user);
  }, [orders, user, managedStore, assignedStores]);

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
    if (!isHydrated || urlNavApplied.current) return;
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    const orderId = params.get("orderId");
    const designer = params.get("designer");
    const focus = params.get("focus");
    if (!view && !orderId && !designer) return;
    urlNavApplied.current = true;
    if (view === "orderLookup" && allowedAdminModes.includes("orderLookup")) {
      setViewMode("orderLookup");
    }
    if (view === "dispatch" && allowedAdminModes.includes("dispatch")) {
      setViewMode("dispatch");
    }
    if (designer) {
      setDispatchFocusDesigner(designer);
    }
    if (orderId) {
      setLookupOrderId(orderId);
    }
    if (focus === "undispatched" && view === "dispatch") {
      window.requestAnimationFrame(() => {
        document
          .getElementById("admin-undispatched-section")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [isHydrated, allowedAdminModes]);

  useEffect(() => {
    if (!user?.username) return;
    saveAdminViewMode(user.username, viewMode);
  }, [user?.username, viewMode]);

  const resetAdminBoardForSession = useCallback(() => {
    setViewMode("dispatch");
  }, []);

  useOnSessionScopeChange(sessionResetKey, resetAdminBoardForSession);

  return (
    <RouteGuard canAccess={canAccessAdminPage(user)}>
      <AppShell
        title="新客户开发"
        board="/admin"
        mainClassName={EVAL_PAGE_MAIN_CLASS}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {!isHydrated ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">
              加载订单数据…
            </div>
          ) : (
            <ModuleWorkbenchLayout
              sidebar={
                <AdminSidebar
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  allowedModes={allowedAdminModes}
                />
              }
            >
          {viewMode === "dispatch" ? (
            <div className={`${EVAL_WORKBENCH_FILL_PANE} gap-3`}>
              {dispatchFocusDesigner ? (
                <div className="shrink-0 rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
                  <p className="font-semibold">
                    超额派单协调 · {dispatchFocusDesigner}
                  </p>
                  <p className="mt-1 text-xs text-amber-900/90">
                    该设计师在途已满。新建派单已预填设计师并勾选「经理确认超额派单」；对下方
                    「未派单客户」指派同一设计师时也需勾选确认。
                  </p>
                </div>
              ) : null}
              <DispatchForm
                onSubmit={addOrder}
                lockedDispatcherName={dispatcherLocked}
                lockedDesignerName={designerLocked}
                initialDesignerName={dispatchFocusDesigner}
                preferredStore={preferredStore}
                readOnly={!canCreateDispatch(user)}
                fillHeight
              />

              {undispatchedOrders.length > 0 ? (
                <section
                  id="admin-undispatched-section"
                  className="flex max-h-[min(38%,16rem)] min-h-0 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm scroll-mt-24"
                >
                  <div className="shrink-0 border-b border-slate-200/80 px-4 py-2.5">
                    <LookupSectionHeading
                      title="未派单客户"
                      suffix={
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          共 {undispatchedOrders.length} 笔
                        </span>
                      }
                    />
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                    <OrderList
                      orders={undispatchedOrders}
                      emptyMessage="暂无未派单客户"
                      showDesigner={false}
                      showAssignDesigner
                      assignDesignerDefault={
                        dispatchFocusDesigner as DesignerName | undefined
                      }
                      onAssignDesigner={(id, designer, force) =>
                        assignDesignerToOrder(id, designer, force)
                      }
                      isOrderReadOnly={(order) => !canAssignDesigner(user, order)}
                    />
                  </div>
                </section>
              ) : null}
            </div>
          ) : viewMode === "orderLookup" ? (
            user ? (
              <OrderLookupPanel user={user} initialOrderId={lookupOrderId} />
            ) : null
          ) : viewMode === "staff" ? (
            <StaffManagement />
          ) : viewMode === "branding" ? (
            <SiteBrandingSettings />
          ) : null}
            </ModuleWorkbenchLayout>
          )}
        </div>
      </AppShell>
    </RouteGuard>
  );
}
