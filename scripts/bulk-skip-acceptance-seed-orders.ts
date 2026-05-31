/**
 * 批量将预制单（ord-####）中「已安装」订单无电子验收更新为「已验收」。
 *
 * 用法：
 *   npx tsx scripts/bulk-skip-acceptance-seed-orders.ts --dry-run
 *   npx tsx scripts/bulk-skip-acceptance-seed-orders.ts --fetch http://121.199.20.177 --dry-run
 *   npx tsx scripts/bulk-skip-acceptance-seed-orders.ts --fetch http://121.199.20.177 --apply --push http://121.199.20.177
 *
 * 阿里云 ECS：真实数据在 SYNC_DATA_DIR（通常 /var/lib/custom-furniture-dispatch/snapshot.json），
 * 不是项目内 data/snapshot.json。请用 --file 指向 .env.local 中的目录，或：
 *   bash scripts/bulk-skip-acceptance-on-server.sh
 *
 * 环境变量：SYNC_API_KEY（--push 时若服务端配置了密钥则必填）
 *           SYNC_DATA_DIR（未指定 --file 时默认 snapshot 路径）
 */
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { bulkSkipSeedInstalledOrders } from "../src/lib/bulk-skip-seed-acceptance";
import { isSeedOrderId } from "../src/lib/seed-order-id";
import type { AppSnapshot } from "../src/lib/server/snapshot-types";
import type { Order } from "../src/lib/types";

function loadEnvLocalSyncDataDir(): string | undefined {
  try {
    const raw = require("fs").readFileSync(
      path.join(process.cwd(), ".env.local"),
      "utf8",
    ) as string;
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*SYNC_DATA_DIR=(.+)\s*$/);
      if (!m) continue;
      return m[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local */
  }
  return undefined;
}

const DATA_DIR =
  process.env.SYNC_DATA_DIR?.trim() ||
  loadEnvLocalSyncDataDir() ||
  path.join(process.cwd(), "data");
const DEFAULT_SNAPSHOT = path.join(DATA_DIR, "snapshot.json");

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const apply = argv.includes("--apply");
  const fetchIdx = argv.indexOf("--fetch");
  const fetchUrl =
    fetchIdx >= 0 ? argv[fetchIdx + 1]?.replace(/\/$/, "") : undefined;
  const fileIdx = argv.indexOf("--file");
  const filePath = fileIdx >= 0 ? argv[fileIdx + 1] : DEFAULT_SNAPSHOT;
  const pushIdx = argv.indexOf("--push");
  const pushUrl =
    pushIdx >= 0 ? argv[pushIdx + 1]?.replace(/\/$/, "") : undefined;

  if (!dryRun && !apply) {
    console.error("请指定 --dry-run 或 --apply");
    process.exit(1);
  }
  if (apply && dryRun) {
    console.error("--dry-run 与 --apply 不能同时使用");
    process.exit(1);
  }

  return { dryRun, apply, fetchUrl, filePath, pushUrl };
}

async function loadSnapshot(
  fetchUrl: string | undefined,
  filePath: string,
): Promise<AppSnapshot> {
  if (fetchUrl) {
    const res = await fetch(`${fetchUrl}/api/sync`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`拉取 snapshot 失败 HTTP ${res.status}`);
    }
    return (await res.json()) as AppSnapshot;
  }
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as AppSnapshot;
}

async function pushSnapshot(baseUrl: string, snapshot: AppSnapshot): Promise<void> {
  const key = process.env.SYNC_API_KEY?.trim();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (key) headers["x-sync-key"] = key;

  const res = await fetch(`${baseUrl}/api/sync`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      version: snapshot.version,
      orders: snapshot.orders,
      supplements: snapshot.supplements,
    }),
  });

  if (res.status === 409) {
    const body = (await res.json()) as { current?: AppSnapshot };
    throw new Error(
      `version 冲突（当前 version=${body.current?.version ?? "?"}），请重新拉取后再执行`,
    );
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PUT /api/sync 失败 HTTP ${res.status}: ${text}`);
  }
}

function printReport(
  orders: Order[],
  result: ReturnType<typeof bulkSkipSeedInstalledOrders>,
  atIso: string,
) {
  const seedInstalledBefore = orders.filter(
    (o) => isSeedOrderId(o.id) && o.status === "已安装",
  ).length;

  console.log("");
  console.log("=== 预制单无电子验收批量更新 ===");
  console.log(`验收时间（acceptedAt）：${atIso}`);
  console.log(`识别规则：id 匹配 ord-#### 且 status=已安装`);
  console.log("");
  console.log(`云端/文件总订单：${orders.length}`);
  console.log(`其中预制单「已安装」（执行前）：${seedInstalledBefore}`);
  console.log(`将更新为「已验收（无电子）」：${result.updatedCount}`);
  console.log("");
  console.log("跳过统计（预制单）：");
  console.log(`  非已安装：${result.skipped.notInstalled}`);
  console.log(`  已是已验收：${result.skipped.alreadyAccepted}`);
  console.log(`  已有电子评分：${result.skipped.hasElectronicRating}`);
  console.log(`非预制单「已安装」（不处理）：${result.skipped.notSeed}`);

  if (result.updatedIds.length > 0) {
    console.log("");
    console.log("将更新的订单 ID（前 20 笔）：");
    for (const id of result.updatedIds.slice(0, 20)) {
      const order = orders.find((o) => o.id === id);
      console.log(`  ${id}  ${order?.address ?? order?.customerName ?? ""}`);
    }
    if (result.updatedIds.length > 20) {
      console.log(`  … 另有 ${result.updatedIds.length - 20} 笔`);
    }
  }
}

async function main() {
  const { dryRun, apply, fetchUrl, filePath, pushUrl } = parseArgs(
    process.argv.slice(2),
  );
  const atIso = new Date().toISOString();

  console.log(
    dryRun
      ? "模式：dry-run（不改数据）"
      : "模式：apply（写入 snapshot" + (pushUrl ? " 并推送云端" : "") + "）",
  );
  if (fetchUrl) console.log("数据源：", fetchUrl);
  else {
    console.log("数据源：", filePath);
    if (
      filePath.includes(`${path.sep}data${path.sep}snapshot.json`) &&
      !process.env.SYNC_DATA_DIR &&
      loadEnvLocalSyncDataDir()
    ) {
      console.warn(
        "警告：检测到 .env.local 的 SYNC_DATA_DIR 与默认 data/ 不同，线上请改用：",
      );
      console.warn(`  --file ${path.join(loadEnvLocalSyncDataDir()!, "snapshot.json")}`);
    }
  }

  const snapshot = await loadSnapshot(fetchUrl, filePath);
  const orders = (snapshot.orders ?? []) as Order[];
  const result = bulkSkipSeedInstalledOrders(orders, atIso);

  printReport(orders, result, atIso);

  if (dryRun) {
    console.log("");
    console.log("dry-run 完成，未修改任何数据。");
    console.log("正式执行示例：");
    console.log(
      "  npx tsx scripts/bulk-skip-acceptance-seed-orders.ts --fetch http://121.199.20.177 --apply --push http://121.199.20.177",
    );
    return;
  }

  const nextSnapshot: AppSnapshot = {
    ...snapshot,
    updatedAt: atIso,
    orders: result.orders,
  };

  if (!fetchUrl || pushUrl) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(nextSnapshot, null, 2), "utf8");
    console.log("");
    console.log("已写入：", filePath);
  }

  if (pushUrl) {
    await pushSnapshot(pushUrl, nextSnapshot);
    console.log("已推送至：", pushUrl);
    console.log("请在 ECS 执行 pm2 restart dispatch（若未自动热加载）");
  } else if (fetchUrl) {
    console.log("");
    console.warn(
      "已从远端拉取并计算，但未 --push。请在服务器上直接 --apply 或加 --push。",
    );
  }

  console.log("");
  console.log(`完成：${result.updatedCount} 笔预制单已更新为已验收（无电子）。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
