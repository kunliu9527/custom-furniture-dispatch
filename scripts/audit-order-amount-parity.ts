/**
 * 口径对账：进程管理门店汇总 vs 看板门店归总
 * 运行: npx tsx scripts/audit-order-amount-parity.ts
 */
import { INITIAL_ORDERS } from "../src/lib/mock-data";
import { STORES } from "../src/lib/designers";
import { sumDispatchTotals } from "../src/lib/dispatch-totals";
import { orderBelongsToDispatcherStore } from "../src/lib/order-store-attribution";
import {
  getDispatcherEvaluationRows,
  getStoreDispatcherAmountRows,
} from "../src/lib/evaluation-stats";
import type { Order, StoreName, SupplementOrder } from "../src/lib/types";

const supplements: SupplementOrder[] = [];
const orders: Order[] = INITIAL_ORDERS;

function managerStoreTotals(allOrders: Order[]) {
  const map = new Map<StoreName, ReturnType<typeof sumDispatchTotals>>();
  for (const store of STORES) {
    const storeOrders = allOrders.filter((o) =>
      orderBelongsToDispatcherStore(o, store),
    );
    map.set(store, sumDispatchTotals(storeOrders, supplements));
  }
  return map;
}

function boardStoreTotals(allOrders: Order[]) {
  const rows = getStoreDispatcherAmountRows(allOrders, supplements);
  const map = new Map<
    StoreName,
    { ordered: number; notOrdered: number; pending: number; confirmed: number }
  >();
  for (const row of rows) {
    if (row.isWorkflowSummary) continue;
    map.set(row.label as StoreName, {
      ordered: row.ordered.amount,
      notOrdered: row.notOrdered.amount,
      pending: row.pendingRefund.amount,
      confirmed: row.confirmedRefund.amount,
    });
  }
  return map;
}

console.log("=== 门店口径对账（全量 mock）===\n");

const mgr = managerStoreTotals(orders);
const board = boardStoreTotals(orders);
let ok = true;

for (const store of STORES) {
  const m = mgr.get(store)!;
  const b = board.get(store)!;
  const diffs: string[] = [];
  if (Math.abs(m.orderedAmount - b.ordered) > 0.01) {
    diffs.push(`已下单 Δ${m.orderedAmount - b.ordered}`);
  }
  if (Math.abs(m.notOrderedAmount - b.notOrdered) > 0.01) {
    diffs.push(`未下单 Δ${m.notOrderedAmount - b.notOrdered}`);
  }
  if (Math.abs(m.pendingRefundAmount - b.pending) > 0.01) {
    diffs.push(`待退单 Δ${m.pendingRefundAmount - b.pending}`);
  }
  if (Math.abs(m.confirmedRefundAmount - b.confirmed) > 0.01) {
    diffs.push(`已退单 Δ${m.confirmedRefundAmount - b.confirmed}`);
  }
  if (diffs.length) {
    ok = false;
    console.log(`✗ ${store}: ${diffs.join(" · ")}`);
  } else {
    console.log(`✓ ${store}: 进程管理 = 看板门店归总`);
  }
}

const storeRows = getStoreDispatcherAmountRows(orders, supplements).filter(
  (r) => !r.isWorkflowSummary,
);
const dispatcherRows = getDispatcherEvaluationRows(orders, supplements).filter(
  (r) => !r.isWorkflowSummary,
);

console.log("\n=== 门店 = 派单人之和 ===\n");
for (const storeRow of storeRows) {
  const store = storeRow.label as StoreName;
  const dispatchersInStore = dispatcherRows.filter(
    (d) => d.subtitle === store,
  );
  const sumOrdered = dispatchersInStore.reduce(
    (s, d) => s + d.ordered.amount,
    0,
  );
  const sumNotOrdered = dispatchersInStore.reduce(
    (s, d) => s + d.notOrdered.amount,
    0,
  );
  if (
    Math.abs(sumOrdered - storeRow.ordered.amount) > 0.01 ||
    Math.abs(sumNotOrdered - storeRow.notOrdered.amount) > 0.01
  ) {
    ok = false;
    console.log(`✗ ${store}: 派单人之和 ≠ 门店行`);
  } else {
    console.log(`✓ ${store}: 门店行 = ${dispatchersInStore.length} 位派单人之和`);
  }
}

console.log(ok ? "\n全部通过" : "\n存在差异，请检查");
process.exit(ok ? 0 : 1);
