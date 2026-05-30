"use client";

import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import { formatDispatchMoney } from "@/lib/dispatch-totals";
import {
  buildFollowUpSnapshot,
  FOLLOW_UP_GROUP_ORDER,
  followUpKindLabel,
  groupFollowUpItemsByOrder,
  type FollowUpItem,
  type FollowUpOrderGroup,
} from "@/lib/follow-up";
import {
  followUpItemKey,
  followUpKindRequiresAck,
  isFollowUpAcked,
  loadFollowUpAcks,
  saveFollowUpAck,
} from "@/lib/follow-up-ack";
import { canModifyOrderInUserScope } from "@/lib/permissions";
import type { Order, WorkflowRemarkStage } from "@/lib/types";
import { useMemo, useState } from "react";

interface FollowUpPanelProps {
  orders: Order[];
  embedded?: boolean;
}

function followUpAlertLabels(items: FollowUpItem[]): string[] {
  return [...new Set(items.map((item) => item.stageAlert ?? item.label))];
}

export function FollowUpPanel({
  orders,
  embedded = false,
}: FollowUpPanelProps) {
  const { user } = useAuth();
  const { addWorkflowRemark } = useOrders();
  const [ackVersion, setAckVersion] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const acks = useMemo(
    () => loadFollowUpAcks(user?.username),
    [user?.username, ackVersion],
  );

  const snapshot = useMemo(
    () => buildFollowUpSnapshot(orders),
    [orders],
  );

  const visibleItems = useMemo(
    () =>
      snapshot.items.filter((item) => {
        if (!followUpKindRequiresAck(item.kind)) return true;
        return !isFollowUpAcked(acks, item);
      }),
    [snapshot.items, acks],
  );

  const orderGroups = useMemo(
    () => groupFollowUpItemsByOrder(visibleItems),
    [visibleItems],
  );

  const orderById = useMemo(
    () => new Map(orders.map((o) => [o.id, o])),
    [orders],
  );

  const wrapperClass = embedded
    ? ""
    : "rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-4";

  const summaryParts = FOLLOW_UP_GROUP_ORDER.filter((kind) =>
    visibleItems.some((item) => item.kind === kind),
  ).map((kind) => {
    const count = visibleItems.filter((item) => item.kind === kind).length;
    return `${followUpKindLabel(kind)} ${count}`;
  });

  const visibleOrderCount = orderGroups.length;

  if (visibleOrderCount === 0 && !embedded) return null;

  const subtitle =
    summaryParts.length > 0 ? summaryParts.join(" · ") : "当前无跟进项";

  function handleFollowUp(group: FollowUpOrderGroup) {
    if (!user?.username) return;
    const order = orderById.get(group.orderId);
    const reply = (drafts[group.orderId] ?? "").trim();
    const labels = followUpAlertLabels(group.items);

    if (reply && order && canModifyOrderInUserScope(user, order)) {
      addWorkflowRemark(
        order.id,
        `[需跟进·${labels.join("、")}] ${reply}`,
        order.status as WorkflowRemarkStage,
      );
    }

    for (const item of group.items) {
      if (!followUpKindRequiresAck(item.kind)) continue;
      saveFollowUpAck(user.username, followUpItemKey(item));
    }

    setDrafts((prev) => {
      const next = { ...prev };
      delete next[group.orderId];
      return next;
    });
    setAckVersion((v) => v + 1);
  }

  return (
    <div className={wrapperClass}>
      {!embedded ? (
        <div>
          <h2 className="text-sm font-semibold text-rose-900">
            需跟进（{visibleOrderCount}）
          </h2>
          <p className="mt-0.5 text-xs text-rose-700/90">{subtitle}</p>
        </div>
      ) : (
        <p className="mb-2 text-xs text-slate-500">全流程跟进 · {subtitle}</p>
      )}

      {visibleOrderCount === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          当前无流程跟进项
        </p>
      ) : (
        <ul className="mt-2 space-y-3">
          {orderGroups.slice(0, 12).map((group) => {
            const primary = group.items[0];
            const maxDaysStuck = Math.max(
              ...group.items.map((item) => item.daysStuck),
            );
            const labels = followUpAlertLabels(group.items);

            const canAck = group.items.some((item) =>
              followUpKindRequiresAck(item.kind),
            );

            return (
              <li
                key={group.orderId}
                className="rounded-lg border border-rose-100/80 bg-white/90 px-3 py-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {labels.map((label) => (
                    <span
                      key={label}
                      className="rounded bg-rose-600 px-1.5 py-0.5 font-medium text-white"
                    >
                      {label}
                    </span>
                  ))}
                  <span className="font-semibold text-red-600">
                    {primary.customerName}
                  </span>
                  <span className="text-slate-500">{primary.status}</span>
                  {maxDaysStuck > 0 ? (
                    <span className="text-slate-400">
                      已停 {maxDaysStuck} 天 ·{" "}
                      {formatDispatchMoney(primary.budget)}
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      {formatDispatchMoney(primary.budget)}
                    </span>
                  )}
                </div>
                {canAck ? (
                  <div className="mt-2 flex flex-wrap items-end gap-1.5">
                    <label className="min-w-0 flex-1">
                      <span className="sr-only">跟进备注</span>
                      <textarea
                        value={drafts[group.orderId] ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [group.orderId]: e.target.value,
                          }))
                        }
                        placeholder="填写跟进备注（选填）"
                        rows={2}
                        className="w-full resize-y rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                      />
                    </label>
                    <button
                      type="button"
                      className="shrink-0 rounded-md bg-rose-600 px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => handleFollowUp(group)}
                    >
                      已知晓
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {orderGroups.length > 12 ? (
        <p className="mt-2 text-[11px] text-rose-600">
          另有 {orderGroups.length - 12} 单，请用订单查询查看
        </p>
      ) : null}
    </div>
  );
}
