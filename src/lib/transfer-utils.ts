import type { Order, TransferRecord } from "./types";

export function getTransferCount(order: Pick<Order, "transferRecords">): number {
  return order.transferRecords.length;
}

export function hasBeenTransferred(
  order: Pick<Order, "originalDesigner" | "designer" | "transferRecords">,
): boolean {
  return (
    order.transferRecords.length > 0 ||
    order.designer !== order.originalDesigner
  );
}

export function formatTransferTime(iso: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function summarizeTransfer(record: TransferRecord): string {
  return `${record.fromDesigner} → ${record.toDesigner}`;
}

export function normalizeTransferRecords(value: unknown): TransferRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const raw = item as Record<string, unknown>;
      return {
        id: String(raw.id ?? `tr-${crypto.randomUUID().slice(0, 8)}`),
        fromDesigner: raw.fromDesigner as TransferRecord["fromDesigner"],
        toDesigner: raw.toDesigner as TransferRecord["toDesigner"],
        transferredAt: String(
          raw.transferredAt ?? new Date().toISOString(),
        ),
      };
    })
    .filter((r) => r.fromDesigner && r.toDesigner);
}
