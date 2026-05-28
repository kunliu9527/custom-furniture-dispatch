#!/usr/bin/env node
/**
 * Push to GitHub, then pull/build/restart on Aliyun ECS.
 * Env: DISPATCH_SERVER, DISPATCH_SSH_USER (default root), DISPATCH_APP_DIR
 */
import { spawnSync } from "node:child_process";

const server = process.env.DISPATCH_SERVER ?? "121.199.20.177";
const sshUser = process.env.DISPATCH_SSH_USER ?? "root";
const appDir = process.env.DISPATCH_APP_DIR ?? "/opt/custom-furniture-dispatch";

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const dirty = spawnSync("git", ["status", "--porcelain"], { encoding: "utf8" });
if (dirty.stdout?.trim()) {
  console.warn("Warning: you have uncommitted changes; only pushed commits will deploy.");
}

console.log("==> git push");
run("git", ["push"]);

const remote = `${sshUser}@${server}`;
const remoteCmd = `cd ${appDir} && bash scripts/deploy-update.sh`;
console.log(`==> ssh ${remote}`);
run("ssh", [remote, remoteCmd]);

console.log("==> deploy complete");
