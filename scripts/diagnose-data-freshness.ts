#!/usr/bin/env node
/**
 * 数据新鲜度诊断：判断报表「本期」数字偏小到底是口径问题还是数据停更。
 *
 * 用法：
 *   npx tsx scripts/diagnose-data-freshness.ts                 # 只看本地 data/snapshot.json
 *   npx tsx scripts/diagnose-data-freshness.ts http://host:port # 同时对比远端 /api/sync
 *
 * 只读，不写任何文件。
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { AppSnapshot } from "../src/lib/server/snapshot-types";

const orderedStatuses = new Set(["已下单", "已安装", "已验收"]);

function daysBetween(fromIso: string | null, to: Date): number | null {
  if (!fromIso) return null;
  const t = new Date(fromIso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.floor((to.getTime() - t) / 86_400_000);
}

function ym(iso: string | null): string | null {
  return iso ? iso.slice(0, 7) : null;
}

function collect(snapshot: AppSnapshot, label: string) {
  const now = new Date();
  const orders = snapshot.orders ?? [];
  const nodeByMonth = new Map<string, number>();
  const orderedNodeByMonth = new Map<string, number>();
  const createdByMonth = new Map<string, number>();
  const storeLastActivity = new Map<string, string>();
  let maxNode: string | null = null;
  let noEnteredAt = 0;
  let orderedWithoutNode = 0;
  let orderedWithNode = 0;

  for (const o of orders) {
    const entered = o.statusEnteredAt ?? {};
    const keys = Object.keys(entered);
    if (keys.length === 0) noEnteredAt += 1;

    for (const [status, at] of Object.entries(entered)) {
      if (!at) continue;
      if (!maxNode || at > maxNode) maxNode = at;
      const m = ym(at);
      if (m) {
        nodeByMonth.set(m, (nodeByMonth.get(m) ?? 0) + 1);
        if (status === "已下单") {
          orderedNodeByMonth.set(m, (orderedNodeByMonth.get(m) ?? 0) + 1);
        }
      }
    }

    if (orderedStatuses.has(o.status)) {
      if (entered["已下单"]) orderedWithNode += 1;
      else orderedWithoutNode += 1;
    }

    const created = ym(o.createdAt);
    if (created) createdByMonth.set(created, (createdByMonth.get(created) ?? 0) + 1);

    const store = o.dispatchStore?.trim() || "（未填门店）";
    const activity = [
      o.createdAt,
      ...Object.values(entered).filter(Boolean),
    ].sort().at(-1)!;
    const prev = storeLastActivity.get(store);
    if (!prev || activity > prev) storeLastActivity.set(store, activity);
  }

  const months = [...nodeByMonth.keys()].sort();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  console.log(`\n══════ ${label} ══════`);
  console.log(`version=${snapshot.version} · orders=${orders.length} · updatedAt=${snapshot.updatedAt}`);
  console.log(`最新流程节点 = ${maxNode ?? "—"}（距今 ${daysBetween(maxNode, now) ?? "?"} 天）`);
  console.log(`本月（${currentMonth}）节点数 = ${nodeByMonth.get(currentMonth) ?? 0}`);

  console.log("\n【按月 · 流程节点数 / 其中「已下单」/ 新建单】");
  for (const m of months.slice(-8)) {
    console.log(
      `  ${m}  节点 ${String(nodeByMonth.get(m) ?? 0).padStart(4)}` +
        `  已下单 ${String(orderedNodeByMonth.get(m) ?? 0).padStart(3)}` +
        `  新建 ${String(createdByMonth.get(m) ?? 0).padStart(4)}`,
    );
  }

  console.log("\n【数据完整性】");
  console.log(`  无 statusEnteredAt 的订单 = ${noEnteredAt}`);
  console.log(
    `  当前为已下单类的订单 = ${orderedWithNode + orderedWithoutNode}` +
      `（有「已下单」节点 ${orderedWithNode} · 缺节点 ${orderedWithoutNode}）`,
  );

  console.log("\n【各门店最近活动】");
  for (const [store, at] of [...storeLastActivity.entries()].sort((a, b) =>
    a[1] < b[1] ? 1 : -1,
  )) {
    console.log(`  ${at.slice(0, 16).replace("T", " ")}  ${store}`);
  }

  const staleDays = daysBetween(maxNode, now);
  const verdict =
    staleDays != null && staleDays > 7
      ? `⚠ 疑似停更：最新节点距今 ${staleDays} 天`
      : "✓ 数据新鲜";
  console.log(`\n判定：${verdict}`);
  return { maxNode, staleDays, currentMonthNodes: nodeByMonth.get(currentMonth) ?? 0 };
}

async function main() {
  const file = path.join(process.cwd(), "data", "snapshot.json");
  if (!existsSync(file)) {
    console.error(`找不到 ${file}`);
    process.exit(1);
  }
  const local = JSON.parse(readFileSync(file, "utf8")) as AppSnapshot;
  const localResult = collect(local, "本地 data/snapshot.json");

  const remoteBase = process.argv[2]?.replace(/\/$/, "");
  if (!remoteBase) {
    console.log(
      "\n（如需与生产对比：npx tsx scripts/diagnose-data-freshness.ts http://121.199.20.177）",
    );
    return;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    const res = await fetch(`${remoteBase}/api/sync`, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.log(`\n远端 ${remoteBase} 返回 HTTP ${res.status}`);
      return;
    }
    const remote = (await res.json()) as AppSnapshot;
    const remoteResult = collect(remote, `远端 ${remoteBase}`);

    console.log("\n══════ 对比结论 ══════");
    console.log(
      `本地 version=${local.version} · 远端 version=${remote.version}` +
        (remote.version > local.version ? " → 本地落后，需重新拉取" : " → 版本一致"),
    );
    if (remoteResult.maxNode && localResult.maxNode) {
      console.log(
        remoteResult.maxNode > localResult.maxNode
          ? `远端节点更新（${remoteResult.maxNode} > ${localResult.maxNode}）→ 本地数据需刷新`
          : "两端最新节点一致 → 若都陈旧，问题在上游录入侧，不在本系统",
      );
    }
  } catch (err) {
    console.log(
      `\n远端 ${remoteBase} 不可达：${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

void main();
