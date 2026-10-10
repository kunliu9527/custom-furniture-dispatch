import { readFileSync } from "node:fs";
import path from "node:path";
import {
  buildOrderWatchlist,
  formatOrderWatchlistText,
  watchlistKindPriority,
} from "../src/lib/report-order-watchlist";
import { isReportInProgressOrder } from "../src/lib/report-metric-definitions";
import type { AppSnapshot } from "../src/lib/server/snapshot-types";
import type { Order } from "../src/lib/types";

/**
 * 本地校验月报「关注订单」逐单清单（不依赖浏览器）。
 * 用法：npx tsx scripts/verify-order-watchlist.ts [thisMonth|all]
 */
const file = path.join(process.cwd(), "data", "snapshot.json");
const snap = JSON.parse(readFileSync(file, "utf8")) as AppSnapshot;
const orders = snap.orders as Order[];

const preset = process.argv[2] === "all" ? "all" : "thisMonth";
const period = { preset } as const;

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

const now = new Date();
const watchlist = buildOrderWatchlist(orders, period, now);

console.log(`快照 version=${snap.version} orders=${orders.length} 周期=${preset}`);
console.log(
  `关注 ${watchlist.totalCount} 单 · 无管控 ${watchlist.unmanagedCount} · 跨期遗留 ${watchlist.carriedOverCount}`,
);
console.log("");

const undispatched = orders.filter((o) => o.status === "未派单");
const undispatchedIds = new Set(undispatched.map((o) => o.id));
const rowIds = new Set(watchlist.rows.map((r) => r.orderId));

check(
  "未派单订单全部进入清单",
  [...undispatchedIds].every((id) => rowIds.has(id)),
  true,
);
check(
  "未派单行标记为无管控",
  watchlist.rows
    .filter((r) => undispatchedIds.has(r.orderId))
    .every((r) => r.unmanaged && r.kind === "unmanaged"),
  true,
);

const carriedIds = new Set(
  watchlist.rows.filter((r) => r.carriedOver).map((r) => r.orderId),
);
if (preset === "thisMonth") {
  check(
    "跨期遗留均为在途未完结单",
    [...carriedIds].every((id) =>
      isReportInProgressOrder(orders.find((o) => o.id === id)!),
    ),
    true,
  );
  check("跨期遗留计数与标记一致", watchlist.carriedOverCount, carriedIds.size);
  console.log(`跨期遗留样例：${[...carriedIds].slice(0, 3).join("、") || "（无）"}`);
} else {
  check("全部周期不产生跨期遗留", watchlist.carriedOverCount, 0);
}

check("无管控计数与标记一致", watchlist.unmanagedCount, watchlist.rows.filter((r) => r.unmanaged).length);
check(
  "关注原因非空",
  watchlist.rows.every((r) => r.reasons.length > 0),
  true,
);
check(
  "停留天数非负",
  watchlist.rows.every((r) => r.daysStuck >= 0),
  true,
);
check(
  "按关注类型优先级排序",
  watchlist.rows.every(
    (r, i) =>
      i === 0 ||
      watchlistKindPriority(watchlist.rows[i - 1]!.kind) <=
        watchlistKindPriority(r.kind),
  ),
  true,
);
check(
  "kind 计数合计等于总数",
  Object.values(watchlist.countByKind).reduce((a, b) => a + b, 0),
  watchlist.totalCount,
);
check(
  "输出行数不超过上限",
  formatOrderWatchlistText(watchlist, 5).length <= 7,
  true,
);

// 人员范围：空数组 → 无可见订单
const scoped = buildOrderWatchlist(orders, period, now, { designerNames: [] });
check("designerNames=[] 时无关注订单", scoped.totalCount, 0);

// 单设计师范围：只含其名下或无人认领订单
const someDesigner = orders.find((o) => o.designer)?.designer;
if (someDesigner) {
  const one = buildOrderWatchlist(orders, period, now, {
    designerNames: [someDesigner],
  });
  check(
    "限定设计师时仅保留本人/无人认领订单",
    one.rows.every((r) => {
      const order = orders.find((o) => o.id === r.orderId)!;
      return order.designer === someDesigner || !order.designer;
    }),
    true,
  );
  console.log(
    `范围「${someDesigner}」：${one.totalCount} 单（全量 ${watchlist.totalCount} 单）`,
  );
}

console.log("");
console.log("前 5 条：");
for (const line of formatOrderWatchlistText(watchlist, 5)) console.log(`  ${line}`);

console.log("");
console.log(failures === 0 ? "全部通过" : `${failures} 项失败`);
process.exit(failures === 0 ? 0 : 1);
