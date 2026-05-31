/**
 * 本地环境重新初始化：重置 data/snapshot.json 为初始订单（无操作日志），
 * 并提示清除浏览器缓存。
 *
 * 用法：npm run reinit
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { createInitialSnapshot } from "../src/lib/server/snapshot-normalize";

const DATA_DIR =
  process.env.SYNC_DATA_DIR?.trim() || path.join(process.cwd(), "data");
const SNAPSHOT_PATH = path.join(DATA_DIR, "snapshot.json");

async function main() {
  const snapshot = createInitialSnapshot();
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), "utf8");

  console.log("已写入全新 snapshot：", SNAPSHOT_PATH);
  console.log(
    `订单 ${snapshot.orders.length} 笔，增补单 ${snapshot.supplements.length} 笔（已清除 orderEvents / 流程备注）`,
  );
  console.log("");
  console.log("请在本机浏览器完成本地初始化（任选其一）：");
  console.log("  1. 已登录管理员 → 右上角「初始化本地」");
  console.log("  2. 开发者工具 Console 执行：");
  console.log(
    '     Object.keys(localStorage).filter(k=>k.startsWith("custom-furniture-dispatch-")).forEach(k=>localStorage.removeItem(k)); location.reload();',
  );
  console.log("");
  console.log("若 dev 服务已在运行，请重启一次以加载新 snapshot。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
