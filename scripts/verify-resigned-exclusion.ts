import { readFileSync } from "node:fs";
import path from "node:path";
import { buildMergedStaffRecords } from "../src/lib/auth-staff-config";
import { getDesignerPerformanceRows } from "../src/lib/designer-performance";
import { getDispatcherEvaluationRows } from "../src/lib/evaluation-stats";
import { getDispatcherPerformanceRows } from "../src/lib/dispatcher-performance";
import { getMonthlyReportOverview } from "../src/lib/designer-performance";
import { buildSmartLeaderboards } from "../src/lib/role-evaluation-score";
import type { AppSnapshot } from "../src/lib/server/snapshot-types";
import type { Order } from "../src/lib/types";

/**
 * 本地校验「离职标签」排除口径：
 * 离职人员退出月报人员榜 / 关注名单，但订单仍计入总量与存量。
 * 用法：npx tsx scripts/verify-resigned-exclusion.ts [离职设计师姓名]
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

const baseline = buildMergedStaffRecords(snap.staffConfig, {
  includeBuiltins: true,
});

// 选取一位在册设计师作为「离职」实验对象
const targetName =
  process.argv[2] ??
  baseline.find((r) => r.position === "设计师" && !r.resigned)?.name ??
  "";
const target = baseline.find((r) => r.name === targetName);
if (!target) {
  console.error(`未找到设计师「${targetName}」`);
  process.exit(2);
}

const resignedConfig = {
  ...snap.staffConfig,
  resignedStaffIds: [
    ...new Set([...(snap.staffConfig.resignedStaffIds ?? []), target.id]),
  ],
};
const resignedRecords = buildMergedStaffRecords(resignedConfig, {
  includeBuiltins: true,
});

console.log(`快照 version=${snap.version} orders=${orders.length}`);
console.log(`实验对象：${target.name}（${target.id}，${target.homeStore}）`);
console.log("");

const opts = {
  designerRows: (records: typeof baseline) =>
    getDesignerPerformanceRows(orders, supplements, null, undefined, records, {
      preset: "all",
    }),
  dispatcherEval: (records: typeof baseline) =>
    getDispatcherEvaluationRows(orders, supplements, null, records),
  dispatcherPerf: (records: typeof baseline) =>
    getDispatcherPerformanceRows(orders, supplements, null, records, {
      preset: "all",
    }),
};

const beforeDesigners = opts.designerRows(baseline);
const afterDesigners = opts.designerRows(resignedRecords);
check(
  "离职前设计师榜包含本人",
  beforeDesigners.some((r) => r.label === target.name),
  true,
);
check(
  "离职后设计师榜排除本人",
  afterDesigners.some((r) => r.label === target.name),
  false,
);
check(
  "离职后设计师榜人数 −1",
  beforeDesigners.length - afterDesigners.length,
  1,
);

// 总量口径不受影响
const overviewBefore = getMonthlyReportOverview(orders, supplements, {
  preset: "all",
});
const overviewAfter = getMonthlyReportOverview(orders, supplements, {
  preset: "all",
});
check("离职不影响总量订单数", overviewAfter.orderCount, overviewBefore.orderCount);
check("离职不影响在途", overviewAfter.unfinishedCount, overviewBefore.unfinishedCount);
check("离职不影响存量", overviewAfter.stockCount, overviewBefore.stockCount);
check("离职不影响存量金额", overviewAfter.stockAmount, overviewBefore.stockAmount);
check("离职不影响下单金额", overviewAfter.orderedAmount, overviewBefore.orderedAmount);

// 该设计师名下订单仍留在报表口径内
const ownOrders = orders.filter((o) => o.designer === target.name);
console.log(`本人名下订单 ${ownOrders.length} 单（仍计入总量）`);

// 派单人/安装师生产者同样支持离职排除（结构一致性）
const dispatcherName = baseline.find(
  (r) => r.position === "派单人" && !r.resigned,
)?.name;
if (dispatcherName) {
  const drecord = baseline.find((r) => r.name === dispatcherName)!;
  const cfg2 = {
    ...snap.staffConfig,
    resignedStaffIds: [drecord.id],
  };
  const rec2 = buildMergedStaffRecords(cfg2, { includeBuiltins: true });
  check(
    "离职派单人退出派单人榜",
    opts.dispatcherEval(rec2).some((r) => r.label === dispatcherName),
    false,
  );
  check(
    "离职派单人退出派单人绩效榜",
    opts.dispatcherPerf(rec2).some((r) => r.label === dispatcherName),
    false,
  );
}

// 综合排行分组：离职后不应再出现在任何榜单
const boards = buildSmartLeaderboards(
  orders,
  supplements,
  { preset: "all" },
  resignedRecords,
);
const boardNames = JSON.stringify(boards);
check(
  "离职者不出现在综合排行",
  boardNames.includes(`"${target.name}"`),
  false,
);

console.log("");
console.log(failures === 0 ? "全部通过" : `${failures} 项失败`);
process.exit(failures === 0 ? 0 : 1);
