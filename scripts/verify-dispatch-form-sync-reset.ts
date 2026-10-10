/**
 * 回归验证：云端同步轮询不得清空「新建派单」正在录入的内容。
 *
 * 背景：客户端每 ~8s 轮询 /api/sync，只要服务端 version 变新（别人改了数据）就会
 * notifySnapshot → applyStaffConfig → staffRecords / designerHomeStoreIndex 引用全部刷新。
 * 若 dispatch-form 的重置 effect 依赖这两个对象，录入中的表单会被反复清空。
 *
 * 做法：拦截 /api/sync 的 GET，把返回的 version +1（其余内容原样），
 * 只读不改真实数据，真实模拟「别人改了数据 → 本机轮询收到新版本」。
 *
 * Run: npx tsx scripts/verify-dispatch-form-sync-reset.ts
 * 需先 npm run dev（.env.local 中 NEXT_PUBLIC_REMOTE_SYNC=true）。
 */
import { chromium, type Browser, type Page } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const USERNAME = process.env.VERIFY_USER ?? "admin";
const PASSWORD = process.env.VERIFY_PASSWORD ?? "003900";
const POLL_WAIT_MS = Number(process.env.VERIFY_POLL_WAIT_MS ?? 13000);

const SENTINEL = {
  customerName: "回归验证客户",
  phone: "13800001234",
  address: "验证小区 8 栋 1802",
  budget: "123456",
};

const failures: string[] = [];

function check(label: string, passed: boolean, detail = "") {
  if (passed) {
    console.log(`[ok] ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failures.push(label);
    console.error(`[FAIL] ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch({ headless: true, channel: "chrome" });
  } catch {
    console.warn("[warn] 本机未装 chrome channel，回退内置 chromium");
    return await chromium.launch({ headless: true });
  }
}

async function loginAs(page: Page, username: string, password: string) {
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });

  const loginBtn = page.getByRole("button", { name: "登录" }).first();
  if (await loginBtn.isVisible().catch(() => false)) {
    await loginBtn.click();
  }
  await page.waitForSelector('input[name="username"]', { timeout: 10000 });
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: "确认登录" }).click();
  await page.waitForTimeout(800);
}

/**
 * 让 /api/sync 的每次 GET 都返回 version+1，模拟别人持续改数据。
 * 必须等首屏加载完成后再开启：若连首次加载也 +1，本机缓存拿到的就是虚高版本，
 * 后续轮询 `remote.version > cache.version` 不成立，notifySnapshot 不会触发，
 * 验证会变成空跑。
 */
async function installVersionBumpRoute(page: Page) {
  let pollCount = 0;
  let enabled = false;
  const versions: number[] = [];

  await page.route("**/api/sync**", async (route) => {
    if (!enabled || route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    let json: unknown;
    try {
      json = await response.json();
    } catch {
      await route.fulfill({ response });
      return;
    }
    if (json && typeof json === "object" && "version" in json) {
      const snapshot = json as { version: number };
      versions.push(snapshot.version);
      snapshot.version += 1;
      pollCount += 1;
    }
    await route.fulfill({ response, json });
  });

  return {
    enable() {
      enabled = true;
    },
    get pollCount() {
      return pollCount;
    },
    versions,
  };
}

async function main() {
  console.log(`验证目标: ${BASE}/admin  (账号 ${USERNAME})`);
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

  try {
    await loginAs(page, USERNAME, PASSWORD);

    const bump = await installVersionBumpRoute(page);
    await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
    await page.waitForSelector('input[name="customerName"]', { timeout: 15000 });
    await page.waitForTimeout(1500);

    const input = (name: keyof typeof SENTINEL) => page.locator(`input[name="${name}"]`);

    // 对照组 A：首次进入，表单默认值已正确初始化（证明「能重置」这件事本身没坏）
    const defaultDispatcher = await page
      .locator('select[name="dispatcherName"]')
      .inputValue()
      .catch(() => "");
    check("对照：派单人默认值已初始化", defaultDispatcher.trim().length > 0,
      `dispatcherName="${defaultDispatcher}"`);

    // 录入内容
    for (const [name, value] of Object.entries(SENTINEL) as Array<
      [keyof typeof SENTINEL, string]
    >) {
      await input(name).fill(value);
    }
    console.log(`已录入: ${JSON.stringify(SENTINEL)}`);

    // 录入完成后再开启版本推进，确保本机缓存停在真实版本，
    // 这样轮询一定能拿到「更新的版本」并触发 notifySnapshot
    bump.enable();

    // 等待至少一个轮询周期（轮询间隔默认 8000ms）
    console.log(`等待 ${POLL_WAIT_MS}ms（模拟期间别人多次改动数据）…`);
    await page.waitForTimeout(POLL_WAIT_MS);

    // 核心断言：轮询收到更新后，录入内容必须还在
    const actual: Record<string, string> = {};
    for (const name of Object.keys(SENTINEL) as Array<keyof typeof SENTINEL>) {
      actual[name] = await input(name).inputValue();
    }
    console.log(`轮询后读回: ${JSON.stringify(actual)}`);

    check(
      "命中了云端轮询（非空验证）",
      bump.pollCount >= 1,
      `拦截到 ${bump.pollCount} 次版本+1 的快照 GET，原始 version 序列 ${bump.versions.slice(0, 5).join(",")}…`,
    );

    for (const name of Object.keys(SENTINEL) as Array<keyof typeof SENTINEL>) {
      check(
        `轮询后「${name}」内容未丢失`,
        actual[name] === SENTINEL[name],
        `期望 "${SENTINEL[name]}"，实际 "${actual[name]}"`,
      );
    }

    // 对照组 B：切换「新建客户」标签仍应清空表单（证明重置能力未被误删）
    const customerTab = page.getByRole("button", { name: "新建客户" }).first();
    if (await customerTab.isVisible().catch(() => false)) {
      await customerTab.click();
      await page.waitForTimeout(400);
      const afterSwitch = await input("customerName").inputValue();
      check("对照：切换标签仍会重置表单", afterSwitch === "",
        `切换后 customerName="${afterSwitch}"`);
    } else {
      console.log("[skip] 当前账号无「新建客户」标签，跳过切换重置对照");
    }
  } finally {
    await browser.close();
  }

  if (failures.length > 0) {
    console.error(`\n结果: FAIL（${failures.length} 项）`);
    process.exit(1);
  }
  console.log("\n结果: PASS — 云端同步轮询不再中断新建派单录入");
}

void main();
