#!/usr/bin/env node
/**
 * 从阿里云（或任意已部署站点）拉取 snapshot 到本地 data/snapshot.json，供离线本地同步测试。
 * 用法：node scripts/pull-cloud-snapshot.mjs [http://121.199.20.177]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const base = (process.argv[2] ?? "http://121.199.20.177").replace(/\/$/, "");
const outDir = path.join(process.cwd(), "data");
const outFile = path.join(outDir, "snapshot.json");

const res = await fetch(`${base}/api/sync`, { cache: "no-store" });
if (!res.ok) {
  console.error(`拉取失败 HTTP ${res.status}`);
  process.exit(1);
}

const snap = await res.json();
mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(snap, null, 2), "utf8");
console.log(
  `已写入 ${outFile} · version=${snap.version} · orders=${snap.orders?.length ?? 0}`,
);
