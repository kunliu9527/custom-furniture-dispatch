#!/usr/bin/env node
/**
 * 调用每日待办 cron API（企微推送）。
 * 环境变量：DISPATCH_APP_URL, DIGEST_PUSH_KEY, SYNC_API_KEY
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = val;
  }
}

loadEnvFile(join(root, ".env.local"));
loadEnvFile(join(root, ".env"));

const base = (process.env.DISPATCH_APP_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const key = process.env.DIGEST_PUSH_KEY?.trim() || process.env.SYNC_API_KEY?.trim();

const headers = { "Content-Type": "application/json" };
if (key) headers["x-digest-key"] = key;

const preview = process.argv.includes("--preview");
const url = `${base}/api/daily-todos/cron`;

const res = await fetch(url, {
  method: preview ? "GET" : "POST",
  headers,
  body: preview ? undefined : "{}",
});

const body = await res.text();
let json;
try {
  json = JSON.parse(body);
} catch {
  json = body;
}

if (!res.ok) {
  console.error(`[daily-todos-cron] HTTP ${res.status}`, json);
  process.exit(1);
}

console.log("[daily-todos-cron] OK", json);
if (preview && json?.text) {
  console.log("\n--- preview ---\n");
  console.log(json.text);
}
