#!/usr/bin/env node
/**
 * 构建 standalone 并打包到 release/ 目录，可复制到任意电脑运行（需 Node.js 20+）。
 *
 * 用法：npm run pack
 * 产出：release/custom-furniture-dispatch/
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const releaseName = `custom-furniture-dispatch`;
const outDir = join(root, "release", releaseName);

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: root,
    shell: process.platform === "win32",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("==> npm run build");
run("npm", ["run", "build"]);

const standaloneDir = join(root, ".next", "standalone");
if (!existsSync(join(standaloneDir, "server.js"))) {
  console.error("ERROR: .next/standalone/server.js 不存在，请确认 next.config 已设置 output: standalone");
  process.exit(1);
}

console.log("==> 组装发布目录:", outDir);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

cpSync(standaloneDir, outDir, { recursive: true });
cpSync(join(root, ".next", "static"), join(outDir, ".next", "static"), {
  recursive: true,
});
if (existsSync(join(root, "public"))) {
  cpSync(join(root, "public"), join(outDir, "public"), { recursive: true });
}

for (const rel of [
  "scripts/start-dispatch.ps1",
  "scripts/start-dispatch.sh",
  "scripts/start-dispatch.bat",
  "deploy/env.local.example",
]) {
  const src = join(root, rel);
  if (existsSync(src)) {
    const dest = join(outDir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
  }
}

mkdirSync(join(outDir, "data"), { recursive: true });

const readme = `# 定制家具派单系统 v${pkg.version}

## 环境要求
- Node.js 20 或更高（https://nodejs.org/）
- Windows 10+ / macOS / Linux

## 首次配置
1. 复制 deploy/env.local.example 为 .env.local
2. 修改 SYNC_API_KEY（同步密码，浏览器端也需一致）

## 启动
- Windows：双击 scripts/start-dispatch.bat，或在 PowerShell 执行 scripts/start-dispatch.ps1
- macOS / Linux：bash scripts/start-dispatch.sh

浏览器访问 http://localhost:3000

## 数据
订单与人员数据保存在 data/ 目录（snapshot.json），请定期备份。

## 局域网访问
其他电脑可通过 http://本机IP:3000 访问（需防火墙放行 3000 端口）。
`;

writeFileSync(join(outDir, "README-INSTALL.txt"), readme, "utf8");

writeFileSync(
  join(outDir, "VERSION.txt"),
  `${pkg.version}\n${new Date().toISOString()}\n`,
  "utf8",
);

console.log("");
console.log("============================================");
console.log("  打包完成:", outDir);
console.log("  将整个文件夹复制到目标电脑后：");
console.log("  1. 安装 Node.js 20+");
console.log("  2. 配置 .env.local");
console.log("  3. 运行 scripts/start-dispatch");
console.log("============================================");

const zipPath = join(root, "release", `${releaseName}.zip`);
if (process.platform === "win32") {
  console.log("");
  console.log("==> 压缩为 zip:", zipPath);
  rmSync(zipPath, { force: true });
  const zipCmd = `Compress-Archive -Path '${outDir.replace(/'/g, "''")}\\*' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`;
  spawnSync("powershell", ["-NoProfile", "-Command", zipCmd], {
    stdio: "inherit",
  });
  if (existsSync(zipPath)) {
    console.log("  ZIP 已生成:", zipPath);
  }
}
