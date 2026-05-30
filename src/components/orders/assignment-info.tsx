import {
  formatTransferTime,
  getTransferCount,
  hasBeenTransferred,
  summarizeTransfer,
} from "@/lib/transfer-utils";
import type { Order } from "@/lib/types";

interface AssignmentInfoProps {
  order: Order;
  compact?: boolean;
}

export function AssignmentInfo({ order, compact = false }: AssignmentInfoProps) {
  const transferred = hasBeenTransferred(order);
  const transferCount = getTransferCount(order);

  if (!transferred && !compact && order.originalDesigner) {
    return (
      <p className="text-xs text-slate-500">
        原指派：<span className="font-medium text-slate-700">{order.originalDesigner}</span>
      </p>
    );
  }

  if (!transferred) return null;

  return (
    <div className="space-y-1 text-xs">
      <p className="text-slate-500">
        原指派：
        <span className="font-medium text-slate-700">{order.originalDesigner}</span>
      </p>
      {order.designer !== order.originalDesigner ? (
        <p className="text-slate-500">
          当前负责：
          <span className="font-medium text-indigo-700">{order.designer}</span>
        </p>
      ) : null}
      {transferCount > 0 ? (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 font-medium text-amber-800 ring-1 ring-amber-200">
          转派 {transferCount} 次
        </span>
      ) : null}
      {!compact && transferCount > 0 ? (
        <ul className="mt-1 space-y-0.5 text-slate-400">
          {order.transferRecords.map((record) => (
            <li key={record.id}>
              {summarizeTransfer(record)} · {formatTransferTime(record.transferredAt)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
