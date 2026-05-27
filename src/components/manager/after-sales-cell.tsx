"use client";

import { Button } from "@/components/ui/button";
import { formatAfterSalesAmount } from "@/lib/order-format";
import { hasAfterSales } from "@/lib/after-sales-utils";
import { useEffect, useState } from "react";

interface AfterSalesCellProps {
  orderId: string;
  amount: number | null | undefined;
  onSave: (orderId: string, amount: number | null) => void;
  readOnly?: boolean;
}

export function AfterSalesCell({
  orderId,
  amount,
  onSave,
  readOnly = false,
}: AfterSalesCellProps) {
  const [input, setInput] = useState(
    amount != null && amount > 0 ? String(amount) : "",
  );
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setInput(amount != null && amount > 0 ? String(amount) : "");
  }, [amount]);

  function handleSave() {
    const trimmed = input.trim();
    if (trimmed === "") {
      onSave(orderId, null);
      setEditing(false);
      return;
    }
    const value = Number(trimmed);
    if (!Number.isFinite(value) || value <= 0) return;
    onSave(orderId, value);
    setEditing(false);
  }

  if (readOnly) {
    return (
      <span className="text-slate-600">
        {hasAfterSales({ afterSalesAmount: amount })
          ? formatAfterSalesAmount(amount)
          : "—"}
      </span>
    );
  }

  if (!editing && hasAfterSales({ afterSalesAmount: amount })) {
    return (
      <div className="space-y-1">
        <p className="font-semibold text-rose-700">
          {formatAfterSalesAmount(amount)}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-indigo-600 hover:text-indigo-800"
        >
          修改
        </button>
      </div>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
      >
        填写售后金
      </button>
    );
  }

  return (
    <div className="flex min-w-[140px] flex-col gap-1">
      <input
        type="number"
        min={1}
        step={100}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="售后金额"
        className="w-full rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:border-indigo-500"
        autoFocus
      />
      <div className="flex gap-1">
        <Button type="button" className="px-2 py-1 text-xs" onClick={handleSave}>
          保存
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="px-2 py-1 text-xs"
          onClick={() => {
            setInput(amount != null && amount > 0 ? String(amount) : "");
            setEditing(false);
          }}
        >
          取消
        </Button>
      </div>
    </div>
  );
}
