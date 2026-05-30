"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canEditOrderDeposit, normalizeDepositAmount } from "@/lib/deposit-rules";
import { formatDeposit } from "@/lib/designers";
import type { Order } from "@/lib/types";

interface DepositEditorProps {
  order: Order;
  onSave: (orderId: string, deposit: number) => void;
  readOnly?: boolean;
  compact?: boolean;
}

export function DepositEditor({
  order,
  onSave,
  readOnly = false,
  compact = false,
}: DepositEditorProps) {
  const editable = canEditOrderDeposit(order) && !readOnly;
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(
    order.deposit > 0 ? String(order.deposit) : "",
  );

  if (!editable && order.deposit <= 0 && !order.preMeasureDeposit) {
    return null;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editable) return;
    onSave(order.id, normalizeDepositAmount(Number(input)));
    setEditing(false);
  }

  if (!editable) {
    return (
      <div className={compact ? "text-xs" : "text-sm"}>
        <span className="text-slate-500">定金 </span>
        <span className={order.deposit <= 0 ? "text-amber-600" : "text-slate-800"}>
          {formatDeposit(order.deposit)}
        </span>
        {order.preMeasureDeposit ? (
          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
            前置交定
          </span>
        ) : null}
      </div>
    );
  }

  if (!editing) {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
        <span className="text-slate-500">定金</span>
        <span className={order.deposit <= 0 ? "font-medium text-amber-600" : "font-medium text-slate-800"}>
          {formatDeposit(order.deposit)}
        </span>
        {order.preMeasureDeposit ? (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
            前置交定
          </span>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={() => {
            setInput(order.deposit > 0 ? String(order.deposit) : "");
            setEditing(true);
          }}
        >
          修改定金
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <Input
        label="已交定金（元）"
        name="deposit"
        type="number"
        min={0}
        step={1}
        className="max-w-[160px]"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="0 表示未交"
      />
      <Button type="submit" className="h-9">
        保存
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-9"
        onClick={() => setEditing(false)}
      >
        取消
      </Button>
    </form>
  );
}

export function PreMeasureDepositBadge({ order }: { order: Order }) {
  if (!order.preMeasureDeposit) return null;
  return (
    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
      前置交定
    </span>
  );
}
