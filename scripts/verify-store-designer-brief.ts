import { readFileSync } from "node:fs";
import path from "node:path";
import { buildMergedStaffRecords } from "../src/lib/auth-staff-config";
import { buildStoreDesignerBrief } from "../src/lib/store-designer-brief";
import type { AppSnapshot } from "../src/lib/server/snapshot-types";

/**
 * 本地校验「设计简报」统计口径（不依赖浏览器）。
 * 用法：npx tsx scripts/verify-store-designer-brief.ts [weekRefISO] [门店范围标签]
 * 例：  npx tsx scripts/verify-store-designer-brief.ts 2026-09-27 "东岸天冠、高桥天冠"
 */
const file = path.join(process.cwd(), "data", "snapshot.json");
const snap = JSON.parse(readFileSync(file, "utf8")) as AppSnapshot;

const weekRef = process.argv[2] ? new Date(process.argv[2]) : new Date();
const storeScopeLabel = process.argv[3] ?? null;

const staffRecords = buildMergedStaffRecords(snap.staffConfig, {
  includeBuiltins: true,
});

const briefs = buildStoreDesignerBrief(snap.orders, staffRecords, {
  weekRef,
  storeScopeLabel,
});

console.log(`快照 version=${snap.version} orders=${snap.orders.length}`);
console.log(`周参照=${weekRef.toISOString()} 门店范围=${storeScopeLabel ?? "（全部）"}`);
console.log("");

if (briefs.length === 0) {
  console.log("（无匹配的设计简报分组）");
}

for (const store of briefs) {
  console.log(`${store.store}设计简报`);
  for (const d of store.designers) {
    const pre =
      d.preOrderLabels.length > 0 ? `（${d.preOrderLabels.join("，")}）` : "";
    console.log(`  ${d.name}：在途${d.inProgress}，前置${d.preOrder}${pre}，下单${d.ordered}`);
  }
  console.log(
    `  合计：在途${store.totals.inProgress}，前置${store.totals.preOrder}，下单${store.totals.ordered}`,
  );
  console.log("");
}
