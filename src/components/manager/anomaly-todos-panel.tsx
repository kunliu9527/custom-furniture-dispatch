"use client";

import { OrderAnomalyName } from "@/components/orders/order-anomaly-badges";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import {
  anomalyLabelChipClass,
  rowHasAckableLabels,
} from "@/lib/anomaly-ack";
import {
  buildAnomalyTodosSnapshot,
  formatAnomalySortHint,
  type AnomalyTodoOrderRow,
} from "@/lib/anomaly-todos";
import {
  followUpItemKey,
  followUpKindRequiresAck,
  loadFollowUpAcks,
  saveFollowUpAck,
  saveTransferredAck,
} from "@/lib/follow-up-ack";
import {
  resolveDesignerCapacityNavigate,
  resolvePendingConfirmNavigate,
} from "@/lib/order-action-link";
import { formatDispatchMoney } from "@/lib/dispatch-totals";
import {
  canModifyOrderInUserScope,
  canUserConfirmRefund,
} from "@/lib/permissions";
import type { Order, WorkflowRemarkStage } from "@/lib/types";
import type { OpenPendingOrderPayload } from "@/components/manager/pending-confirm-panel";
import type { PendingConfirmKind } from "@/lib/pending-confirm";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface AnomalyTodosPanelProps {
  orders: Order[];
  focusOrderId?: string | null;
  onSelectDesigner?: (designer: string) => void;
  onOpenPendingOrder?: (payload: OpenPendingOrderPayload) => void;
}

const actionBtnClass =
  "shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold transition";
const actionPrimaryClass = `${actionBtnClass} bg-indigo-600 text-white hover:bg-indigo-700`;
const actionSecondaryClass = `${actionBtnClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;

export function AnomalyTodosPanel({
  orders,
  focusOrderId = null,
  onSelectDesigner,
  onOpenPendingOrder,
}: AnomalyTodosPanelProps) {
  const { user } = useAuth();
  const { addWorkflowRemark, confirmRefund } = useOrders();
  const router = useRouter();
  const [ackVersion, setAckVersion] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const snapshot = useMemo(
    () => buildAnomalyTodosSnapshot(orders, user?.username),
    [orders, user?.username, ackVersion],
  );

  const orderById = useMemo(
    () => new Map(orders.map((o) => [o.id, o])),
    [orders],
  );

  useEffect(() => {
    if (!focusOrderId) return;
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(`anomaly-todo-${focusOrderId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusOrderId, snapshot.orderRows.length]);

  function handleAck(row: AnomalyTodoOrderRow) {
    if (!user?.username) return;
    const order = orderById.get(row.orderId);
    const reply = (drafts[row.orderId] ?? "").trim();
    const labels = row.labels.map((l) => l.label);

    if (reply && order && canModifyOrderInUserScope(user, order)) {
      addWorkflowRemark(
        order.id,
        `[异常待办·${labels.join("、")}] ${reply}`,
        order.status as WorkflowRemarkStage,
      );
    }

    if (row.labels.some((l) => l.source === "transfer")) {
      saveTransferredAck(user.username, row.orderId);
    }

    for (const label of row.labels) {
      if (
        label.source !== "followup" ||
        !label.followUpKind ||
        !followUpKindRequiresAck(label.followUpKind)
      ) {
        continue;
      }
      saveFollowUpAck(
        user.username,
        followUpItemKey({
          orderId: row.orderId,
          kind: label.followUpKind,
          label: label.label,
        }),
      );
    }

    setDrafts((prev) => {
      const next = { ...prev };
      delete next[row.orderId];
      return next;
    });
    setAckVersion((v) => v + 1);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-slate-900">
          异常待办
          {snapshot.totalCount > 0 ? (
            <span className="ml-1 text-xs font-medium text-rose-600">
              ({snapshot.totalCount})
            </span>
          ) : null}
        </h2>
        {snapshot.summaryParts.length > 0 ? (
          <p className="mt-0.5 text-xs text-slate-500">
            {snapshot.summaryParts.join(" · ")} · 最新异常在最上
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-slate-500">
            按异常触发时间排序，最新在最上
          </p>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {snapshot.totalCount === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            暂无异常待办
          </p>
        ) : (
          <ul className="space-y-3">
            {snapshot.orderRows.map((row) => (
              <AnomalyTodoOrderCard
                key={row.orderId}
                row={row}
                order={orderById.get(row.orderId)}
                user={user}
                focused={focusOrderId === row.orderId}
                draft={drafts[row.orderId] ?? ""}
                onDraftChange={(value) =>
                  setDrafts((prev) => ({ ...prev, [row.orderId]: value }))
                }
                onOpenPendingOrder={onOpenPendingOrder}
                onConfirmRefund={confirmRefund}
                onAck={() => handleAck(row)}
              />
            ))}

            {snapshot.capacityRows.map((row) => {
              const target = resolveDesignerCapacityNavigate(user, row.designer);
              return (
                <li
                  key={`capacity-${row.designer}`}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-slate-700 px-1.5 py-0.5 font-medium text-white">
                        {row.label}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {row.designer}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600">{row.hint}</p>
                  </div>
                  {target?.canAct ? (
                    <button
                      type="button"
                      onClick={() => router.push(target.href)}
                      className={actionPrimaryClass}
                    >
                      {target.actionLabel}
                    </button>
                  ) : onSelectDesigner ? (
                    <button
                      type="button"
                      onClick={() => onSelectDesigner(row.designer)}
                      className={actionSecondaryClass}
                    >
                      查看负荷
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function AnomalyTodoOrderCard({
  row,
  order,
  user,
  focused,
  draft,
  onDraftChange,
  onOpenPendingOrder,
  onConfirmRefund,
  onAck,
}: {
  row: AnomalyTodoOrderRow;
  order: Order | undefined;
  user: ReturnType<typeof useAuth>["user"];
  focused: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onOpenPendingOrder?: (payload: OpenPendingOrderPayload) => void;
  onConfirmRefund?: (id: string) => void;
  onAck: () => void;
}) {
  const uniqueDisplayLabels = [...new Set(row.labels.map((l) => l.label))];
  const pendingActions = useMemo(() => {
    if (!order || !user) return [];
    const seen = new Set<PendingConfirmKind>();
    const actions: {
      kind: PendingConfirmKind;
      label: string;
      canAct: boolean;
      inlineRefund?: boolean;
    }[] = [];
    for (const label of row.labels) {
      if (label.source !== "pending" || !label.pendingKind) continue;
      if (seen.has(label.pendingKind)) continue;
      seen.add(label.pendingKind);
      if (
        label.pendingKind === "pending-refund" &&
        onConfirmRefund &&
        canUserConfirmRefund(user, order)
      ) {
        actions.push({
          kind: label.pendingKind,
          label: "确认已退单",
          canAct: true,
          inlineRefund: true,
        });
        continue;
      }
      const target = resolvePendingConfirmNavigate(
        user,
        order,
        label.pendingKind,
      );
      if (!target) continue;
      actions.push({
        kind: label.pendingKind,
        label: target.actionLabel,
        canAct: target.canAct,
      });
    }
    return actions;
  }, [order, user, row.labels, onConfirmRefund]);

  const showAck = rowHasAckableLabels(row.labels);

  return (
    <li
      id={`anomaly-todo-${row.orderId}`}
      className={`rounded-lg border px-3 py-2.5 text-xs transition ${
        focused
          ? "border-indigo-400 bg-indigo-50/60 ring-2 ring-indigo-300/50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {uniqueDisplayLabels.map((label) => (
              <span key={label} className={anomalyLabelChipClass(label)}>
                {label}
              </span>
            ))}
            <span className="text-slate-400">
              {formatAnomalySortHint(row.sortTime)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {order ? (
              <OrderAnomalyName
                order={order}
                defaultClassName="text-sm font-semibold text-slate-900"
                includeOperationalHints={false}
              >
                {row.customerName}
              </OrderAnomalyName>
            ) : (
              <span className="text-sm font-semibold text-slate-900">
                {row.customerName}
              </span>
            )}
            <span className="text-slate-500">{row.status}</span>
            <span className="text-slate-400">
              {row.designer} · {formatDispatchMoney(row.budget)}
            </span>
          </div>
        </div>

        {pendingActions.length > 0 && order ? (
          <div className="flex flex-wrap justify-end gap-1.5">
            {pendingActions.map((action) => (
              <button
                key={action.kind}
                type="button"
                onClick={() => {
                  if (action.inlineRefund) {
                    onConfirmRefund?.(row.orderId);
                    return;
                  }
                  onOpenPendingOrder?.({
                    orderId: row.orderId,
                    kind: action.kind,
                    order,
                  });
                }}
                className={
                  action.canAct ? actionPrimaryClass : actionSecondaryClass
                }
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {showAck ? (
        <div className="mt-2 flex flex-wrap items-end gap-1.5 border-t border-slate-100 pt-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">跟进备注</span>
            <textarea
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder="填写备注（选填）"
              rows={2}
              className="w-full resize-y rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
            />
          </label>
          <button
            type="button"
            className="shrink-0 rounded-md bg-slate-700 px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-slate-600"
            onClick={onAck}
          >
            已知晓
          </button>
        </div>
      ) : null}
    </li>
  );
}
