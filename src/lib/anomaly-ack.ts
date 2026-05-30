import type { FollowUpKind } from "./follow-up";

/** 仅低评类与已转派可通过「已跟进」消除待办 */
export function followUpKindRequiresAck(kind: FollowUpKind): boolean {
  return kind === "bad-acceptance" || kind === "low-dimension";
}

export function transferredAckKey(orderId: string): string {
  return `transfer:${orderId}`;
}

export function isTransferredAcked(
  acks: Set<string>,
  orderId: string,
): boolean {
  return acks.has(transferredAckKey(orderId));
}

/** 异常待办标签：轻微爆红 */
export const MILD_ANOMALY_LABELS = new Set(["未派单滞留", "已转派"]);

export function anomalyLabelChipClass(label: string): string {
  if (MILD_ANOMALY_LABELS.has(label)) {
    return "rounded bg-rose-100 px-1.5 py-0.5 font-medium text-rose-700 ring-1 ring-rose-300";
  }
  return "rounded bg-rose-600 px-1.5 py-0.5 font-medium text-white";
}

export function rowHasAckableLabels(
  labels: { source: string; followUpKind?: FollowUpKind; label: string }[],
): boolean {
  return labels.some(
    (l) =>
      l.source === "transfer" ||
      (l.followUpKind != null && followUpKindRequiresAck(l.followUpKind)),
  );
}
