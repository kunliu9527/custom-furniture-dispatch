"use client";

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { SupplementInlineForm } from "@/components/orders/supplement-inline-form";
import { OrderAnomalyName } from "@/components/orders/order-anomaly-badges";
import { LookupSectionHeading } from "@/components/shared/lookup-section-heading";
import { searchOrders } from "@/lib/order-search";
import {
  displayCustomerNameColumn,
  displayOrderNameColumn,
} from "@/lib/order-remark";
import { filterSupplementsByPeriod, type PeriodSelection } from "@/lib/period-filter";
import type { Order, SupplementOrder } from "@/lib/types";

const PANEL_HEIGHT =
  "h-[calc(100dvh-var(--eval-site-nav-h)-var(--eval-workbench-nav-gap)-var(--eval-scroll-bottom-pad)-2rem)] max-h-[calc(100dvh-var(--eval-site-nav-h)-var(--eval-workbench-nav-gap)-var(--eval-scroll-bottom-pad)-2rem)]";

interface DesignerSupplementPanelProps {
  eligibleOrders: Order[];
  supplements: SupplementOrder[];
  period: PeriodSelection;
  query: string;
  readOnly?: boolean;
  onSubmit: (parentOrderId: string, amount: number) => void;
  detailPane?: (order: Order, supplementPane: ReactNode) => ReactNode;
}

export function DesignerSupplementPanel({
  eligibleOrders,
  supplements,
  period,
  query,
  readOnly = false,
  onSubmit,
  detailPane,
}: DesignerSupplementPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const periodSupplements = useMemo(
    () => filterSupplementsByPeriod(supplements, period),
    [supplements, period],
  );

  const filtered = useMemo(
    () => searchOrders(eligibleOrders, query),
    [eligibleOrders, query],
  );

  useEffect(() => {
    setSelectedId(null);
    setAmountInput("");
    setError("");
  }, [query, period]);

  useEffect(() => {
    setAmountInput("");
    setError("");
    setSubmitted(false);
  }, [selectedId]);

  const selectedOrder = filtered.find((o) => o.id === selectedId) ?? null;
  const selectedSupplements = selectedOrder
    ? periodSupplements.filter((s) => s.parentOrderId === selectedOrder.id)
    : [];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (readOnly || !selectedOrder) return;
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("请填写有效的补单下单金额（大于 0）");
      return;
    }
    onSubmit(selectedOrder.id, amount);
    setAmountInput("");
    setError("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  const supplementPane = selectedOrder ? (
    <SupplementInlineForm
      readOnly={readOnly}
      amountInput={amountInput}
      onAmountChange={(value) => {
        setAmountInput(value);
        setError("");
      }}
      error={error}
      submitted={submitted}
      onSubmit={handleSubmit}
      existingSupplements={selectedSupplements}
    />
  ) : null;

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${PANEL_HEIGHT}`}
    >
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <LookupSectionHeading
          title="增补单管理"
          suffix={
            <span className="ml-2 text-xs font-normal text-slate-500">
              {periodSupplements.length} 笔记录 · 共 {filtered.length} 笔可关联
              · 仅「已下单」「已安装」· 点击订单填写补单金额
            </span>
          }
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
        <div className="min-h-0 space-y-2 overflow-y-auto overscroll-contain border-b border-slate-100 p-2 lg:border-b-0 lg:border-r">
          {filtered.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-slate-500">
              {eligibleOrders.length === 0
                ? "当前周期内无可关联的「已下单」「已安装」订单"
                : "未找到匹配订单"}
            </p>
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
                    highlightCrossStore
                  >
                    {displayOrderNameColumn(order)}
                  </OrderAnomalyName>
                  <span className="shrink-0 text-xs text-slate-500">
                    {order.status}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {displayCustomerNameColumn(order) || "—"}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="flex min-h-0 min-w-0 flex-col overflow-y-auto overscroll-contain p-2 sm:p-3">
          {selectedOrder ? (
            detailPane ? (
              detailPane(selectedOrder, supplementPane)
            ) : (
              supplementPane
            )
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-sm text-slate-500">
              请从左侧选择订单填写增补单
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
