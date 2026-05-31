/**
 * 简报指标时间维度审计 — 运行: npx tsx scripts/audit-brief-period-dimensions.ts
 */
import {
  buildGlobalWorkflowMetrics,
  computeGlobalDigestAmounts,
  globalMonthlyPrimaryStatItems,
  globalMonthlyWorkflowStatItems,
  globalWeeklyPrimaryStatItems,
  globalWeeklyWorkflowStatItems,
  type GlobalMonthlyDigest,
  type GlobalWeeklyDigest,
} from "../src/lib/global-report";
import { computeStorePortfolioMetrics } from "../src/lib/store-summary-metrics";
import { countLowDimensionReviewsInPeriod } from "../src/lib/acceptance-rating";
import type { Order, SupplementOrder } from "../src/lib/types";

function mkOrder(partial: Partial<Order> & Pick<Order, "id" | "status">): Order {
  return {
    budget: 10000,
    createdAt: "2026-05-01T08:00:00.000Z",
    designer: "张设计",
    dispatcher: "李派单",
    store: "东岸天冠",
    customerName: "客户",
    transferRecords: [],
    ...partial,
  } as Order;
}

const supplements: SupplementOrder[] = [];
const ref = new Date("2026-05-29T12:00:00.000Z");

const orders: Order[] = [
  mkOrder({ id: "o1", status: "待签约", createdAt: "2026-05-10T08:00:00.000Z" }),
  mkOrder({
    id: "o2",
    status: "已下单",
    createdAt: "2026-04-20T08:00:00.000Z",
    statusEnteredAt: { 已下单: "2026-05-15T10:00:00.000Z" },
    orderAmount: 8000,
  }),
  mkOrder({
    id: "o3",
    status: "已验收",
    createdAt: "2026-05-05T08:00:00.000Z",
    statusEnteredAt: {
      已安装: "2026-05-20T10:00:00.000Z",
      已验收: "2026-05-25T10:00:00.000Z",
    },
    orderAmount: 12000,
  }),
];

const mayPeriod = { preset: "custom" as const, yearMonth: "2026-05" };
const thisWeek = { preset: "thisWeek" as const };

console.log("=== 时间维度对齐审计 ===\n");

const portfolioNow = computeStorePortfolioMetrics(orders, supplements);
const mayWorkflow = buildGlobalWorkflowMetrics(orders, supplements, mayPeriod, ref);
const mayAmounts = computeGlobalDigestAmounts(orders, supplements, mayPeriod, ref);
const lowMay = countLowDimensionReviewsInPeriod(orders, mayPeriod, ref);

const mayDigest = {
  newDispatchCount: 2,
  orderedCount: 2,
  orderedAmount: 20000,
  refundCount: 0,
  activeTimeoutCount: 0,
  amounts: mayAmounts,
  workflow: mayWorkflow,
  lowDimensionCountPeriod: lowMay,
} as GlobalMonthlyDigest;

console.log("【本月 · ② 本期分析】");
for (const s of globalMonthlyPrimaryStatItems(mayDigest, portfolioNow)) {
  console.log(`   ${s.label} → ${s.value}`);
}

console.log("\n【本月 · ③ 当前快照】");
for (const s of globalMonthlyWorkflowStatItems(
  mayWorkflow,
  portfolioNow,
  lowMay,
)) {
  console.log(`   ${s.label} → ${s.value}${s.hint ? ` (${s.hint})` : ""}`);
}

const weekWorkflow = buildGlobalWorkflowMetrics(orders, supplements, thisWeek, ref);
const lowWeek = countLowDimensionReviewsInPeriod(orders, thisWeek, ref);
const weekDigest = {
  newDispatchCount: 1,
  orderedCount: 1,
  orderedAmount: 12000,
  refundCount: 0,
  activeTimeoutCount: 0,
  amounts: computeGlobalDigestAmounts(orders, supplements, thisWeek, ref),
  workflow: weekWorkflow,
  lowDimensionCountWeek: lowWeek,
} as GlobalWeeklyDigest;

console.log("\n【本周 · ② 本期分析】");
for (const s of globalWeeklyPrimaryStatItems(weekDigest, portfolioNow)) {
  console.log(`   ${s.label} → ${s.value}`);
}

console.log("\n【本周 · ③ 当前快照】");
for (const s of globalWeeklyWorkflowStatItems(
  weekWorkflow,
  portfolioNow,
  lowWeek,
)) {
  console.log(`   ${s.label} → ${s.value}${s.hint ? ` (${s.hint})` : ""}`);
}

const labels = [
  ...globalMonthlyPrimaryStatItems(mayDigest, portfolioNow).map((s) => s.label),
  ...globalMonthlyWorkflowStatItems(mayWorkflow, portfolioNow, lowMay).map(
    (s) => s.label,
  ),
];

const checks = [
  { ok: labels.includes("当前存量"), msg: "期末存量 → 当前存量" },
  { ok: labels.includes("当前未完结"), msg: "期末未完结 → 当前未完结" },
  { ok: labels.includes("本期安装"), msg: "本期安装 在 ②" },
  { ok: !labels.includes("有效总派单"), msg: "有效总派单 移出 ②" },
  { ok: labels.includes("累计有效派单"), msg: "累计有效派单 在 ③" },
  {
    ok: globalMonthlyWorkflowStatItems(mayWorkflow, portfolioNow, lowMay).some(
      (s) => s.label === "维度低评" && s.hint === "本期新增",
    ),
    msg: "维度低评 hint=本期新增",
  },
];

console.log("\n=== 校验 ===");
for (const c of checks) {
  console.log(`${c.ok ? "✓" : "✗"} ${c.msg}`);
}

console.log("\n完成。\n");
