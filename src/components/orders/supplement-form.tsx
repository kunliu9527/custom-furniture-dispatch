"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatOrderDate, isSupplementEligibleOrder } from "@/lib/order-utils";
import type { Order, SupplementOrder } from "@/lib/types";

interface SupplementFormProps {
  orders: Order[];
  supplements: SupplementOrder[];
  onSubmit: (parentOrderId: string, amount: number) => void;
  readOnly?: boolean;
  /** 嵌入设计师工作台顶栏中间区域 */
  embedded?: boolean;
}

export function SupplementForm({
  orders,
  supplements,
  onSubmit,
  readOnly = false,
  embedded = false,
}: SupplementFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const eligibleOrders = orders.filter(isSupplementEligibleOrder);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    const amount = Number(amountInput);
    if (!orderId) {
      setError("请选择关联订单");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("请填写有效的补单下单金额（大于 0）");
      return;
    }
    onSubmit(orderId, amount);
    setOrderId("");
    setAmountInput("");
    setError("");
    setSubmitted(true);
    setExpanded(false);
    window.setTimeout(() => setSubmitted(false), 3000);
  }

  function handleCancel() {
    setExpanded(false);
    setOrderId("");
    setAmountInput("");
    setError("");
  }

  const shellClass = embedded
    ? "min-w-0 w-full"
    : "rounded-xl border border-teal-200/80 bg-teal-50/30 shadow-sm";
  const headerPad = embedded ? "" : "px-5 py-4";
  const bodyPad = embedded ? "mt-1.5" : "px-5 py-3";
  const titleClass = embedded
    ? "shrink-0 text-xs font-semibold uppercase tracking-wide text-blue-800 leading-none"
    : "text-base font-semibold text-slate-900";
  const embeddedTitleHintClass =
    "min-w-0 whitespace-nowrap text-xs font-normal normal-case leading-none text-slate-500";
  const hintClass = embedded
    ? embeddedTitleHintClass
    : "mt-0.5 text-sm text-slate-500";
  const embeddedControlClass =
    "mt-1 w-[8.5rem] max-w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  const hintText =
    supplements.length > 0
      ? `已有 ${supplements.length} 笔增补单记录`
      : "仅「已下单」「已安装」订单可关联增补单";

  const embeddedTitleHint =
    "仅「已下单」「已安装」订单可关联增补单";

  return (
    <section className={shellClass}>
      <div className={headerPad}>
        {embedded ? (
          <div className="flex flex-nowrap items-baseline">
            <h2 className={titleClass}>增补单</h2>
            <p className={embeddedTitleHintClass}>（{embeddedTitleHint}）</p>
          </div>
        ) : (
          <h2 className={titleClass}>增补单</h2>
        )}
        {embedded ? (
          !readOnly ? (
            <button
              type="button"
              className={`${embeddedControlClass} text-left transition-colors hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={() => setExpanded((v) => !v)}
              disabled={eligibleOrders.length === 0}
            >
              {expanded ? "收起" : "新增增补单"}
            </button>
          ) : (
            <p className={`${embeddedControlClass} text-slate-500`}>仅查看</p>
          )
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={hintClass}>{hintText}</p>
            {!readOnly ? (
              <Button
                type="button"
                variant={expanded ? "secondary" : "outline"}
                onClick={() => setExpanded((v) => !v)}
                disabled={eligibleOrders.length === 0}
              >
                {expanded ? "收起" : "新增增补单"}
              </Button>
            ) : (
              <span className="text-xs text-slate-500">仅查看</span>
            )}
          </div>
        )}
      </div>

      {supplements.length > 0 ? (
        <div
          className={
            embedded
              ? `${bodyPad} text-xs leading-snug text-blue-800`
              : `border-t border-teal-100 ${bodyPad}`
          }
        >
          {!embedded ? (
            <p className="text-xs font-medium text-slate-600">增补单记录</p>
          ) : (
            <p className="text-xs font-medium text-blue-700">{hintText}</p>
          )}
          <ul
            className={`space-y-1 ${embedded ? "mt-1" : "mt-1.5 text-slate-600"} ${embedded ? "" : "text-sm"}`}
          >
            {supplements.slice(0, embedded ? 3 : 5).map((s) => (
              <li key={s.id}>
                {s.customerName} · ¥{s.supplementAmount.toLocaleString("zh-CN")}{" "}
                · {formatOrderDate(s.createdAt)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {expanded ? (
        <form
          onSubmit={handleSubmit}
          className={`grid gap-3 sm:grid-cols-2 ${
            embedded
              ? "mt-1.5 rounded-lg border border-blue-100 bg-white/80 p-2"
              : `border-t border-teal-100 ${bodyPad}`
          }`}
        >
          <p className="text-sm text-teal-900 sm:col-span-2">
            仅可选择流程为「已下单」或「已安装」的订单；填写补单金额后提交
          </p>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">关联订单</span>
            <select
              value={orderId}
              onChange={(e) => {
                setOrderId(e.target.value);
                setError("");
              }}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">请选择订单</option>
              {eligibleOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.customerName} · {order.address}（{order.status}）
                </option>
              ))}
            </select>
          </label>
          <Input
            label="补单下单金额（元）"
            name="supplementAmount"
            type="number"
            min={1}
            step={1}
            required
            placeholder="必填，与主单下单金额区分"
            value={amountInput}
            onChange={(e) => {
              setAmountInput(e.target.value);
              setError("");
            }}
          />
          <div className="flex flex-wrap items-end gap-2">
            <Button type="submit">提交增补单</Button>
            <Button type="button" variant="ghost" onClick={handleCancel}>
              取消
            </Button>
          </div>
          {error ? (
            <p className="text-sm text-red-600 sm:col-span-2">{error}</p>
          ) : null}
        </form>
      ) : null}

      {submitted ? (
        <p
          className={`text-sm text-teal-700 ${
            embedded
              ? "mt-2 rounded-lg border border-teal-100 bg-teal-50/50 px-2.5 py-1.5"
              : `border-t border-teal-100 ${bodyPad}`
          }`}
        >
          增补单已记录（已下单）
        </p>
      ) : null}
    </section>
  );
}
