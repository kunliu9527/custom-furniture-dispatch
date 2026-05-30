import type { MonthlyMetricsSnapshot } from "./monthly-snapshot-types";

/** 生成近 N 个月演示归档，用于本地验收同比/趋势补全 */
export function buildDemoMonthlySnapshots(
  monthCount = 12,
  ref = new Date(),
): MonthlyMetricsSnapshot[] {
  const results: MonthlyMetricsSnapshot[] = [];
  const d = new Date(ref);
  for (let i = monthCount - 1; i >= 0; i--) {
    const cur = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const ym = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
    const factor = 0.6 + (i / monthCount) * 0.5;
    const orderedAmount = Math.round(180_000 * factor + i * 8000);
    results.push({
      yearMonth: ym,
      savedAt: new Date(cur.getFullYear(), cur.getMonth() + 1, 0).toISOString(),
      savedBy: "演示数据",
      scopeLabel: "全公司",
      overview: {
        periodLabel: `${ym}`,
        orderCount: Math.round(8 * factor),
        orderedCount: Math.round(5 * factor),
        orderedAmount,
        refundCount: i % 4 === 0 ? 1 : 0,
        supplementAmount: Math.round(12_000 * factor),
        activeTimeoutCount: Math.max(1, 4 - Math.floor(i / 3)),
        inProgressCount: Math.round(6 * factor),
      },
      designers: [
        {
          key: "demo-1",
          label: "演示设计师A",
          orderedCount: Math.round(3 * factor),
          orderedAmount: Math.round(orderedAmount * 0.55),
          contributionScore: Math.round(80 * factor),
          timeoutCount: 1,
          refundCount: 0,
        },
        {
          key: "demo-2",
          label: "演示设计师B",
          orderedCount: Math.round(2 * factor),
          orderedAmount: Math.round(orderedAmount * 0.45),
          contributionScore: Math.round(65 * factor),
          timeoutCount: 0,
          refundCount: 0,
        },
      ],
      issueTagStats: [
        { tag: "工艺错误", count: 2 + (i % 2) },
        { tag: "沟通问题", count: 1 + (i % 3) },
      ],
      cockpit: {
        newDispatchCount: Math.round(6 * factor + i * 0.3),
        newDispatchAmount: Math.round(200_000 * factor + i * 6000),
        signedContractAmount: Math.round(220_000 * factor),
        signedCount: Math.round(5 * factor),
        orderedAmount,
        orderedCount: Math.round(5 * factor),
        refundCount: i % 4 === 0 ? 1 : 0,
        refundAmount: i % 4 === 0 ? Math.round(25_000 * factor) : 0,
        acceptedAmount: Math.round(160_000 * factor),
        acceptedCount: Math.round(4 * factor),
        acceptanceAvg: 4.1 + (i % 5) * 0.15,
        electronicAcceptanceRate: 0.55 + (i % 4) * 0.08,
        pendingAcceptanceCount: Math.max(2, 10 - i),
        funnel: [
          { key: "dispatch", label: "派单", count: 10, rate: null },
          { key: "signed", label: "签约", count: 7, rate: 70 },
          { key: "ordered", label: "下单", count: 5, rate: 71 },
        ],
        dispatchers: [
          {
            key: "d1",
            label: "演示派单A",
            contributionScore: Math.round(120 * factor),
            newDispatchCount: 4,
            depositTotal: 50_000,
          },
        ],
        stores: [
          {
            key: "s1",
            label: "演示门店",
            orderedCount: 3,
            orderedAmount: Math.round(orderedAmount * 0.6),
          },
        ],
      },
    });
  }
  return results;
}

export async function seedDemoMonthlySnapshots(
  post: (snap: MonthlyMetricsSnapshot) => Promise<boolean>,
): Promise<number> {
  let saved = 0;
  for (const snap of buildDemoMonthlySnapshots()) {
    const ok = await post(snap);
    if (ok) saved += 1;
  }
  return saved;
}
