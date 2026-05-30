import { buildConversionFunnel } from "@/lib/conversion-funnel";
import { buildOverviewMonthlySnapshot } from "@/lib/evaluation-auto-snapshot";
import { buildOperationsBrief } from "@/lib/operations-brief";
import { yearMonthToPeriod } from "@/lib/period-filter";
import type { Order, SupplementOrder } from "@/lib/types";
import { readAppSnapshot } from "./app-store";
import {
  readMonthlySnapshot,
  writeMonthlySnapshot,
} from "./monthly-snapshot-storage";

function lastMonthYearMonth(ref = new Date()): string {
  const d = new Date(ref);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** 从当前 snapshot 归档上月经营驾驶舱数据（已存在则跳过） */
export async function ensureLastMonthSnapshotFromAppStore(): Promise<{
  yearMonth: string;
  result: "saved" | "exists" | "failed";
}> {
  const yearMonth = lastMonthYearMonth();

  try {
    const existing = await readMonthlySnapshot(yearMonth);
    if (existing) return { yearMonth, result: "exists" };

    const snapshot = await readAppSnapshot();
    const orders = snapshot.orders as Order[];
    const supplements = (snapshot.supplements ?? []) as SupplementOrder[];
    const period = yearMonthToPeriod(yearMonth);
    const brief = buildOperationsBrief(orders, supplements, period);
    const funnel = buildConversionFunnel(orders, period);
    const monthly = buildOverviewMonthlySnapshot(
      orders,
      supplements,
      period,
      brief,
      funnel,
      { savedBy: "定时归档" },
    );

    await writeMonthlySnapshot(monthly);
    return { yearMonth, result: "saved" };
  } catch {
    return { yearMonth, result: "failed" };
  }
}
