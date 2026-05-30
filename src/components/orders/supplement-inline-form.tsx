"use client";

import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatOrderDate } from "@/lib/order-utils";
import type { SupplementOrder } from "@/lib/types";

interface SupplementInlineFormProps {
  readOnly?: boolean;
  amountInput: string;
  onAmountChange: (value: string) => void;
  error?: string;
  submitted?: boolean;
  onSubmit: (e: FormEvent) => void;
  existingSupplements?: SupplementOrder[];
}

export function SupplementInlineForm({
  readOnly = false,
  amountInput,
  onAmountChange,
  error,
  submitted,
  onSubmit,
  existingSupplements = [],
}: SupplementInlineFormProps) {
  if (readOnly) {
    return (
      <p className="text-xs text-slate-500">当前为只读，无法新增增补单</p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <p className="text-xs font-semibold text-indigo-900">新增增补单</p>
      {existingSupplements.length > 0 ? (
        <div className="text-[11px] leading-snug text-teal-800">
          <p className="font-medium">本周期 {existingSupplements.length} 笔</p>
          <ul className="mt-0.5 max-h-12 space-y-0.5 overflow-y-auto">
            {existingSupplements.map((s) => (
              <li key={s.id}>
                ¥{s.supplementAmount.toLocaleString("zh-CN")} ·{" "}
                {formatOrderDate(s.createdAt)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Input
        label="补单金额（元）"
        name="supplementAmount"
        type="number"
        min={1}
        step={1}
        required
        placeholder="必填"
        value={amountInput}
        onChange={(e) => onAmountChange(e.target.value)}
      />
      <Button type="submit" className="w-full px-2 py-1.5 text-xs">
        提交增补单
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {submitted ? (
        <p className="text-xs text-teal-700">增补单已记录（已下单）</p>
      ) : null}
    </form>
  );
}
