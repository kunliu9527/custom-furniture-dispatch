#!/usr/bin/env node
/**
 * 生产构建防线：`npm run build` 构建前校验 NEXT_PUBLIC_SYNC_API_KEY。
 *
 * 背景：线上曾把本机开发密钥（local-test-secret）打进生产包，导致浏览器端
 * 所有写入被服务端以 401「无写入权限」拒绝（设计师更新数据没有反应）。
 *
 * 规则：
 *  - 按 `next build` 的环境加载顺序解析（.env.production.local > .env.local > ...）
 *  - 密钥为空或等于开发密钥 local-test-secret 时直接退出，中止构建
 *  - 仅挂在 `npm run build` 上，不影响 `next dev` 本地开发
 */
import nextEnv from "@next/env";
import { resolve } from "node:path";

const { loadEnvConfig } = nextEnv;
const DEV_KEY = "local-test-secret";

// dev=false：按生产构建的优先级加载 env 文件
loadEnvConfig(resolve(process.cwd()), false, undefined, true);

const key = (process.env.NEXT_PUBLIC_SYNC_API_KEY ?? "").trim();

function fail(msg) {
  console.error(`\n[check-prod-env] ❌ ${msg}`);
  console.error("[check-prod-env] 已中止构建。请修正环境变量后重试（见 docs/CHINA-SERVER-DEPLOY.md）。\n");
  process.exit(1);
}

if (!key) {
  fail(
    "NEXT_PUBLIC_SYNC_API_KEY 为空：线上客户端将不带密钥推送，会被服务端以 401 拒绝。" +
      "请在 .env.production.local 中配置与服务端 SYNC_API_KEY 一致的真实密钥。",
  );
}

if (key === DEV_KEY) {
  fail(
    `检测到本地开发密钥「${DEV_KEY}」：它仅用于本机开发（.env.local），` +
      "打入生产包会导致线上所有写入报「无写入权限」。" +
      "请在 .env.production.local 中配置与服务端 SYNC_API_KEY 一致的真实密钥。",
  );
}

console.log(
  `[check-prod-env] ✅ NEXT_PUBLIC_SYNC_API_KEY 已配置（长度 ${key.length}），非开发密钥，继续构建。`,
);
