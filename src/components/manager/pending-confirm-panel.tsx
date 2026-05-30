"use client";

import { OrderAnomalyName } from "@/components/orders/order-anomaly-badges";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import {
  resolveDesignerCapacityNavigate,
  resolvePendingConfirmNavigate,
} from "@/lib/order-action-link";
import { canUserConfirmRefund } from "@/lib/permissions";
import {
  buildPendingConfirmSnapshot,
  PENDING_CONFIRM_GROUP_ORDER,
  pendingConfirmKindLabel,
  type PendingConfirmKind,
  type PendingConfirmOrderItem,
} from "@/lib/pending-confirm";
import type { Order } from "@/lib/types";
import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

export interface OpenPendingOrderPayload {
  orderId: string;
  kind: PendingConfirmKind;
  order: Order;
}

interface PendingConfirmPanelProps {
  orders: Order[];
  onSelectDesigner?: (designer: string) => void;
  onOpenPendingOrder?: (payload: OpenPendingOrderPayload) => void;
  embedded?: boolean;
}

const actionBtnClass =
  "shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold transition";
const actionPrimaryClass = `${actionBtnClass} bg-amber-600 text-white hover:bg-amber-700`;
const actionSecondaryClass = `${actionBtnClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;

export function PendingConfirmPanel({
  orders,
  onSelectDesigner,
  onOpenPendingOrder,
  embedded = false,
}: PendingConfirmPanelProps) {
  const { user } = useAuth();
  const { confirmRefund } = useOrders();
  const router = useRouter();
  const snapshot = useMemo(() => buildPendingConfirmSnapshot(orders), [orders]);

  const wrapperClass = embedded
    ? ""
    : "rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-4";

  const groups = PENDING_CONFIRM_GROUP_ORDER.filter(
    (kind) => snapshot.countByKind[kind] > 0,
  ).map((kind) => ({
    kind,
    items: snapshot.orderItems.filter((i) => i.kind === kind),
  }));

  const hasDesignerCapacity = snapshot.designerItems.length > 0;

  if (snapshot.totalCount === 0 && !embedded) return null;

  return (
    <div className={wrapperClass}>
      {!embedded ? (
        <h2 className="text-sm font-semibold text-amber-900">
          待确认（{snapshot.totalCount}）
        </h2>
      ) : (
        <p className="mb-2 text-xs text-slate-500">
          实时待办 · 待确认接单 {snapshot.countByKind["designer-accept"]} ·
          未派单 {snapshot.countByKind.undispatched} · 待退单{" "}
          {snapshot.countByKind["pending-refund"]}
          {hasDesignerCapacity
            ? ` · 超额协调 ${snapshot.countByKind["designer-capacity"]}`
            : ""}
        </p>
      )}

      {snapshot.totalCount === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">暂无待确认项</p>
      ) : (
        <div className="mt-2 space-y-4">
          {groups.map((group) => (
            <ConfirmGroup
              key={group.kind}
              kind={group.kind}
              items={group.items}
              orders={orders}
              user={user}
              onOpenPendingOrder={onOpenPendingOrder}
              onConfirmRefund={confirmRefund}
            />
          ))}

          {hasDesignerCapacity ? (
            <section>
              <h3 className="text-xs font-semibold text-amber-900">
                {pendingConfirmKindLabel("designer-capacity")}（
                {snapshot.designerItems.length}）
              </h3>
              <ul className="mt-1.5 space-y-2">
                {snapshot.designerItems.map((item) => {
                  const capacityTarget = resolveDesignerCapacityNavigate(
                    user,
                    item.designer,
                  );
                  return (
                    <li
                      key={item.designer}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-amber-100 bg-white/90 px-3 py-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-amber-600 px-1.5 py-0.5 font-medium text-white">
                            {item.label}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-600">{item.hint}</p>
                      </div>
                      {capacityTarget?.canAct ? (
                        <button
                          type="button"
                          onClick={() => router.push(capacityTarget.href)}
                          className={actionPrimaryClass}
                        >
                          {capacityTarget.actionLabel}
                        </button>
                      ) : onSelectDesigner ? (
                        <button
                          type="button"
                          onClick={() => onSelectDesigner(item.designer)}
                          className={actionSecondaryClass}
                        >
                          查看负荷
                        </button>
                      ) : capacityTarget ? (
                        <Link
                          href={capacityTarget.href}
                          className={actionSecondaryClass}
                        >
                          {capacityTarget.actionLabel}
                        </Link>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ConfirmGroup({
  kind,
  items,
  orders,
  user,
  onOpenPendingOrder,
  onConfirmRefund,
}: {
  kind: PendingConfirmKind;
  items: PendingConfirmOrderItem[];
  orders: Order[];
  user: ReturnType<typeof useAuth>["user"];
  onOpenPendingOrder?: (payload: OpenPendingOrderPayload) => void;
  onConfirmRefund?: (id: string) => void;
}) {
  const orderById = useMemo(
    () => new Map(orders.map((o) => [o.id, o])),
    [orders],
  );

  return (
    <section>
      <h3 className="text-xs font-semibold text-amber-900">
        {pendingConfirmKindLabel(kind)}（{items.length}）
      </h3>
      <ul className="mt-1.5 max-h-48 space-y-2 overflow-y-auto">
        {items.slice(0, 12).map((item) => {
          const order = orderById.get(item.orderId);
          const target =
            order && user
              ? resolvePendingConfirmNavigate(user, order, kind)
              : null;
          const inlineRefund =
            kind === "pending-refund" &&
            order &&
            user &&
            onConfirmRefund &&
            canUserConfirmRefund(user, order);

          return (
            <li
              key={item.orderId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-100 bg-white/90 px-3 py-2 text-xs"
            >
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                {target && order && onOpenPendingOrder ? (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenPendingOrder({
                        orderId: item.orderId,
                        kind,
                        order,
                      })
                    }
                    className={`rounded px-1.5 py-0.5 font-medium ${
                      item.isOverdue
                        ? "bg-amber-600 text-white hover:bg-amber-700"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                    }`}
                    title="定位订单处理"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span
                    className={`rounded px-1.5 py-0.5 font-medium ${
                      item.isOverdue
                        ? "bg-amber-600 text-white"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.label}
                  </span>
                )}
                {order ? (
                  <OrderAnomalyName
                    order={order}
                    defaultClassName="font-medium text-slate-900"
                    includeOperationalHints={false}
                  >
                    {item.customerName}
                  </OrderAnomalyName>
                ) : (
                  <span className="font-medium text-slate-900">
                    {item.customerName}
                  </span>
                )}
                {item.hint ? (
                  <span className="text-slate-400">{item.hint}</span>
                ) : null}
              </div>
              {inlineRefund || (target && order) ? (
                onOpenPendingOrder || inlineRefund ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (inlineRefund) {
                        onConfirmRefund?.(item.orderId);
                        return;
                      }
                      onOpenPendingOrder?.({
                        orderId: item.orderId,
                        kind,
                        order: order!,
                      });
                    }}
                    className={
                      inlineRefund || target?.canAct
                        ? actionPrimaryClass
                        : actionSecondaryClass
                    }
                  >
                    {inlineRefund ? "确认已退单" : target!.actionLabel}
                  </button>
                ) : (
                  <Link
                    href={target!.href}
                    className={
                      target!.canAct ? actionPrimaryClass : actionSecondaryClass
                    }
                  >
                    {target!.actionLabel}
                  </Link>
                )
              ) : null}
            </li>
          );
        })}
      </ul>
      {items.length > 12 ? (
        <p className="mt-1 text-[11px] text-amber-700">
          另有 {items.length - 12} 条，请用订单查询查看
        </p>
      ) : null}
    </section>
  );
}
