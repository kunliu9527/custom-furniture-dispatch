"use client";

import { Button } from "@/components/ui/button";

interface DeleteOrderButtonProps {
  orderId: string;
  customerLabel: string;
  onDelete: (orderId: string) => void;
  compact?: boolean;
}

export function DeleteOrderButton({
  orderId,
  customerLabel,
  onDelete,
  compact = false,
}: DeleteOrderButtonProps) {
  function handleClick() {
    const label = customerLabel.trim() || orderId;
    const ok = window.confirm(
      `确定删除订单「${label}」？\n将同时删除关联增补单，且不可恢复。`,
    );
    if (ok) onDelete(orderId);
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={
        compact
          ? "border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
          : "border-red-200 text-red-600 hover:bg-red-50"
      }
      onClick={handleClick}
    >
      删除订单
    </Button>
  );
}
