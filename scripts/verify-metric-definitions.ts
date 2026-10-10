import { readFileSync } from "node:fs";
import path from "node:path";
import {
  countReportInProgress,
  countReportStock,
  isReportInProgressOrder,
  isReportStockOrder,
  REPORT_METRIC_DEFINITIONS,
} from "../src/lib/report-metric-definitions";
import {
  computeAllSummaryDispatchBuckets,
  isCumulativeOrderedOrder,
  isStockOrder,
} from "../src/lib/store-summary-metrics";
import { getMonthlyReportOverview } from "../src/lib/designer-performance";
import {
  filterReportOrderedReachedOrders,
  measureReportOrderedReached,
} from "../src/lib/report-metric-definitions";
import { getPeriodBounds } from "../src/lib/period-filter";
import { classifyOrderAmount } from "../src/lib/order-amount";
import type { AppSnapshot } from "../src/lib/server/snapshot-types";
import type { Order } from "../src/lib/types";

/**
 * 本地校验报表口径（不依赖浏览器）：
 * 在途 = 非退单且未验收（未派单→已安装）；存量 = 非退单且未下单；
 * 本期已下单量 = 本期到达过「已下单」（已下单节点落在期内）。
 * 用法：npx tsx scripts/verify-metric-definitions.ts
 */
const file = path.join(process.cwd(), "data", "snapshot.json");
const snap = JSON.parse(readFileSync(file, "utf8")) as AppSnapshot;
const orders = snap.orders as Order[];
const supplements = snap.supplements ?? [];

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"} ${label} → ${JSON.stringify(actual)}${
      ok ? "" : ` (期望 ${JSON.stringify(expected)})`
    }`,
  );
}

const buckets = computeAllSummaryDispatchBuckets(orders, supplements);
const unfinished = countReportInProgress(orders);
const stock = countReportStock(orders);
const accepted = orders.filter((o) => o.status === "已验收").length;
const refund = buckets.refund.count;

console.log(`快照 version=${snap.version} orders=${orders.length}`);
console.log(`口径定义：在途=${REPORT_METRIC_DEFINITIONS.inProgress.definition}`);
console.log(`口径定义：存量=${REPORT_METRIC_DEFINITIONS.stock.definition}`);
console.log("");

check("存量（report）", stock, buckets.stock.count);
// 在途 = 全部 − 已验收 − 退单（未派单→已安装，含存量与已下单/已安装）
check("在途（report）", unfinished, orders.length - accepted - refund);
check("未派单不计入存量之外", stock <= unfinished, true);

// 存量必须是未下单的子集且互斥于已下单/退单
check(
  "存量与已下单/退单互斥",
  orders.every((o) => !(isReportStockOrder(o) && isCumulativeOrderedOrder(o))),
  true,
);
check(
  "存量 ⊆ 在途",
  orders.every((o) => !isReportStockOrder(o) || isReportInProgressOrder(o)),
  true,
);

// 单笔口径：未派单/待量尺/已签约 属于存量与在途；已下单/已安装 属在途非存量；已验收/退单 都不属
const mk = (status: Order["status"]): Order =>
  ({ id: status, status, budget: 1000, transferRecords: [] }) as unknown as Order;
const cases: [Order["status"], boolean, boolean][] = [
  ["未派单", true, true],
  ["待量尺", true, true],
  ["已签约", true, true],
  ["已下单", false, true],
  ["已安装", false, true],
  ["已验收", false, false],
  ["待退单", false, false],
  ["已退单", false, false],
];
for (const [status, isStock, isInProgress] of cases) {
  check(`单笔 ${status} 存量`, isReportStockOrder(mk(status)), isStock);
  check(`单笔 ${status} 在途`, isReportInProgressOrder(mk(status)), isInProgress);
}

const overview = getMonthlyReportOverview(orders, supplements, { preset: "all" });
check("月报总览 在途 == 快照在途", overview.unfinishedCount, unfinished);
check("月报总览 存量计数 == 快照存量", overview.stockCount, stock);
check("月报总览 存量金额 == 累计存量金额", overview.stockAmount, buckets.stock.amount);
check("isStockOrder 与报表存量一致", orders.filter(isStockOrder).length, stock);

// ── 本期已下单量：节点口径 ──
console.log("");
console.log(`口径定义：本期已下单量=${REPORT_METRIC_DEFINITIONS.ordered.definition}`);
for (const ym of ["2026-07", "2026-08", "2026-09"]) {
  const period = { preset: "custom", yearMonth: ym } as const;
  const bounds = getPeriodBounds(period)!;
  const reached = filterReportOrderedReachedOrders(orders, period);
  const measure = measureReportOrderedReached(orders, supplements, period);

  // 每笔都必须在期内有「已下单」节点
  check(
    `${ym} 每笔都到达过已下单`,
    reached.every((o) => {
      const t = new Date(o.statusEnteredAt!["已下单"]!).getTime();
      return t >= bounds.start.getTime() && t < bounds.end.getTime();
    }),
    true,
  );
  // 计数与金额自洽
  check(`${ym} 计数 == 命中订单数`, measure.count, reached.length);
  check(
    `${ym} 金额 == 逐单主单额+增补`,
    measure.amount,
    reached.reduce(
      (s, o) => s + (o.orderAmount != null && o.orderAmount > 0 ? o.orderAmount : 0) +
        supplements
          .filter((sp) => sp.parentOrderId === o.id)
          .reduce((a, sp) => a + sp.supplementAmount, 0),
      0,
    ),
  );
  // 与「本期有活动 ∩ 当前状态」旧口径必须不同（除稀疏月份外），证明不是同一个东西
  const legacy = orders
    .filter((o) => {
      const t = new Date(o.createdAt).getTime();
      const created = t >= bounds.start.getTime() && t < bounds.end.getTime();
      const active = Object.values(o.statusEnteredAt ?? {}).some((at, i, arr) => {
        void i;
        void arr;
        if (!at) return false;
        const v = new Date(at).getTime();
        return v >= bounds.start.getTime() && v < bounds.end.getTime();
      });
      return created || active;
    })
    .reduce((n, o) => n + classifyOrderAmount(o, supplements).ordered.count, 0);
  console.log(
    `${ym} 本期已下单量：节点口径 ${measure.count} 单 / ¥${measure.amount.toLocaleString("zh-CN")}` +
      `（旧口径 ${legacy} 单，差 ${legacy - measure.count}）`,
  );
}
check(
  "不存在「到达过但无节点」被计入",
  filterReportOrderedReachedOrders(orders, { preset: "custom", yearMonth: "2026-09" }).every(
    (o) => Boolean(o.statusEnteredAt?.["已下单"]),
  ),
  true,
);

// 全部（累计）：老单无「已下单」节点，用当前状态反推，不能凭空白掉
const allReached = filterReportOrderedReachedOrders(orders, { preset: "all" });
check("累计已下单 == 累计下单桶", allReached.length, buckets.ordered.count);
check(
  "累计已下单含无节点老单",
  allReached.some((o) => !o.statusEnteredAt?.["已下单"]),
  true,
);
check(
  "累计已下单 ⊆ 非退单",
  allReached.every((o) => !o.status.includes("退单")),
  true,
);

console.log("");
console.log(failures === 0 ? "全部通过" : `${failures} 项失败`);
process.exit(failures === 0 ? 0 : 1);
