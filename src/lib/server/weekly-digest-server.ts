import {
  buildWeeklyDigest,
  formatWeeklyDigestText,
} from "@/lib/weekly-report";
import type { Order, SupplementOrder } from "@/lib/types";
import { readAppSnapshot } from "./app-store";

/** 从当前云端/本地 snapshot 生成周报正文（全公司口径） */
export async function generateWeeklyDigestTextFromSnapshot(): Promise<{
  text: string;
  weekId: string;
  weekLabel: string;
}> {
  const snapshot = await readAppSnapshot();
  const orders = snapshot.orders as Order[];
  const supplements = (snapshot.supplements ?? []) as SupplementOrder[];
  const digest = buildWeeklyDigest(orders, supplements, []);
  return {
    text: formatWeeklyDigestText(digest),
    weekId: digest.weekId,
    weekLabel: digest.weekLabel,
  };
}
