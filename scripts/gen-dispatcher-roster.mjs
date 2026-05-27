/** 从 mock-data 推断派单人主属门店，用于维护 src/lib/dispatchers.ts 静态名册 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const text = fs.readFileSync(path.join(root, "src/lib/mock-data.ts"), "utf8");
const names = [...text.matchAll(/"dispatcherName": "([^"]+)"/g)].map((m) => m[1]);
const stores = [...text.matchAll(/"dispatchStore": "([^"]+)"/g)].map((m) => m[1]);

const map = new Map();
for (let i = 0; i < names.length; i++) {
  const n = names[i];
  const s = stores[i];
  if (!n || n === "—") continue;
  if (!map.has(n)) map.set(n, new Map());
  const c = map.get(n);
  c.set(s, (c.get(s) || 0) + 1);
}

const roster = [...map.entries()]
  .map(([name, counts]) => {
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return { name, homeStore: top[0] };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

console.log(JSON.stringify(roster, null, 2));
