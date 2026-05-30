import { CROSS_STORE_ASSIGN_MANAGER_HINT } from "@/lib/cross-store-dispatch";

interface CrossStoreAssignHintProps {
  className?: string;
}

export function CrossStoreAssignHint({ className = "" }: CrossStoreAssignHintProps) {
  return (
    <div
      className={`rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs leading-relaxed text-sky-950 ${className}`.trim()}
    >
      <p className="font-medium text-sky-900">跨店派单说明</p>
      <p className="mt-0.5 text-sky-900/90">{CROSS_STORE_ASSIGN_MANAGER_HINT}</p>
    </div>
  );
}
