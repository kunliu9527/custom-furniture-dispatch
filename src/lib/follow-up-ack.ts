import { buildFollowUpSnapshot, type FollowUpItem } from "./follow-up";
import type { Order } from "./types";
import {
  followUpKindRequiresAck,
  transferredAckKey,
} from "./anomaly-ack";

export function followUpItemKey(item: Pick<FollowUpItem, "orderId" | "kind" | "label">): string {
  return `${item.orderId}:${item.kind}:${item.label}`;
}

function storageKey(username: string): string {
  return `custom-furniture-dispatch-follow-up-ack:${username}`;
}

export function loadFollowUpAcks(username: string | undefined): Set<string> {
  if (!username || typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(storageKey(username));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((k): k is string => typeof k === "string"));
  } catch {
    return new Set();
  }
}

export function saveFollowUpAck(username: string, itemKey: string): void {
  if (typeof window === "undefined") return;
  const next = loadFollowUpAcks(username);
  next.add(itemKey);
  sessionStorage.setItem(storageKey(username), JSON.stringify([...next]));
}

export function saveTransferredAck(username: string, orderId: string): void {
  saveFollowUpAck(username, transferredAckKey(orderId));
}

export { followUpKindRequiresAck };

export function isFollowUpAcked(
  acks: Set<string>,
  item: Pick<FollowUpItem, "orderId" | "kind" | "label">,
): boolean {
  return acks.has(followUpItemKey(item));
}

export function countUnackedFollowUpOrders(
  orders: Order[],
  username?: string,
): number {
  const acks = loadFollowUpAcks(username);
  const orderIds = new Set<string>();
  for (const item of buildFollowUpSnapshot(orders).items) {
    if (followUpKindRequiresAck(item.kind)) {
      if (!isFollowUpAcked(acks, item)) {
        orderIds.add(item.orderId);
      }
      continue;
    }
    orderIds.add(item.orderId);
  }
  return orderIds.size;
}

/** @deprecated 按订单合并展示后请用 countUnackedFollowUpOrders */
export function countUnackedFollowUpItems(
  orders: Order[],
  username?: string,
): number {
  const acks = loadFollowUpAcks(username);
  return buildFollowUpSnapshot(orders).items.filter((item) => {
    if (!followUpKindRequiresAck(item.kind)) return true;
    return !isFollowUpAcked(acks, item);
  }).length;
}
