/**
 * 回归验证：云端同步轮询不得重置各工作台的录入 / 筛选 / 未保存草稿。
 *
 * 背景：客户端每 ~8s 轮询 /api/sync，只要服务端 version 变新（别人改了数据）就会
 * notifySnapshot → 各 Context 用「内容相同、引用全新」的对象覆盖状态。
 * 凡把 staffRecords / designerHomeStoreIndex / orders / siteBranding / commissionSettings
 * 直接放进 effect 依赖的地方，都会在每次轮询重跑并重置用户操作。
 *
 * 做法：拦截 /api/sync 的 GET，把返回的 version +1（其余原样，只读不改真实数据），
 * 真实模拟「别的同事改了数据 → 本机轮询拿到新版本」。
 *
 * Run: npx tsx scripts/verify-sync-poll-no-reset.ts   （需先 npm run dev）
 */
import { chromium, type Browser, type Page } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const POLL_WAIT_MS = Number(process.env.VERIFY_POLL_WAIT_MS ?? 13000);

const failures: string[] = [];

function check(label: string, passed: boolean, detail = "") {
  if (passed) {
    console.log(`  [ok] ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failures.push(label);
    console.error(`  [FAIL] ${label}${detail ? ` — ${detail}` : ""}`);
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
  const btn = page.getByRole("button", { name: "登录" }).first();
  if (await btn.isVisible().catch(() => false)) await btn.click();
  await page.waitForSelector('input[name="username"]', { timeout: 10000 });
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: "确认登录" }).click();
  await page.waitForTimeout(1000);
}

/** /api/sync 的 GET 一律返回 version+1；开启前先加载完页面，缓存才停在真实版本 */
function createBumpController() {
  const state = { enabled: false, pollCount: 0, versions: [] as number[] };
  return {
    state,
    reset() {
      state.enabled = false;
      state.pollCount = 0;
      state.versions = [];
    },
    enable() {
      state.enabled = true;
    },
    async route(page: Page) {
      await page.route("**/api/sync**", async (route) => {
        if (!state.enabled || route.request().method() !== "GET") {
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
          state.versions.push(snapshot.version);
          snapshot.version += 1;
          state.pollCount += 1;
        }
        await route.fulfill({ response, json });
      });
    },
  };
}

function isActive(className: string) {
  return className.includes("active");
}

async function main() {
  console.log(`验证目标: ${BASE}（模拟别人持续改数据，触发云端轮询）`);
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1500, height: 1200 } });
  const bump = createBumpController();
  await bump.route(page);

  const waitForPoll = async (label: string) => {
    bump.enable();
    console.log(`  等待 ${POLL_WAIT_MS}ms（至少一个轮询周期）…`);
    await page.waitForTimeout(POLL_WAIT_MS);
    check(`${label}：已命中云端轮询`, bump.state.pollCount >= 1,
      `version 序列 ${bump.state.versions.slice(0, 4).join(",")}`);
  };

  try {
    // 注意：每个用例必须在「进入页面前」先关掉版本推进，否则首屏加载就会拿到虚高版本，
    // 后续轮询 remote.version > cache.version 不成立 → notifySnapshot 不触发 → 验证空跑。

    // ── 1. 设计师工作台：切换设计师后不得被轮询重置（设计经理账号才有切换器）
    console.log("\n[1] 设计师工作台 · 当前查看设计师");
    bump.reset();
    await loginAs(page, "刘坤", "2");
    await page.goto(BASE + "/designer", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    const switcher = page.locator('select[aria-label="切换设计师"]').first();
    if (await switcher.isVisible().catch(() => false)) {
      const values = await switcher.locator("option").evaluateAll((els) =>
        els.map((e) => (e as HTMLOptionElement).value),
      );
      const before = await switcher.inputValue();
      const target = values.find((v) => v !== before);
      if (!target) {
        console.log("  [skip] 名册只有一个设计师，无法验证切换");
      } else {
        await switcher.selectOption(target);
        await page.waitForTimeout(600);
        check("切换后即生效（前置条件）", (await switcher.inputValue()) === target,
          `${before} → ${target}`);
        await waitForPoll("设计师切换");
        check("轮询后仍停留在所选设计师", (await switcher.inputValue()) === target,
          `期望 "${target}"，实际 "${await switcher.inputValue()}"`);
      }
    } else {
      console.log("  [skip] 当前账号无「切换设计师」控件（需设计经理/总经理账号）");
    }

    // ── 2. 经理工作台：订单查询的查找方式不得被轮询重置
    console.log("\n[2] 经理工作台 · 订单查询查找方式");
    bump.reset();
    await loginAs(page, "盛慧", "1");
    await page.goto(BASE + "/manager", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: /订单查询/ }).first().click();
    await page.waitForTimeout(1200);
    const byDesigner = page.getByRole("button", { name: /按设计师查找/ }).first();
    const byDispatcher = page.getByRole("button", { name: /按派单人查找/ }).first();
    await byDesigner.click();
    await page.waitForTimeout(600);
    check("切换后即生效（前置条件）",
      isActive(await byDesigner.evaluate((el) => el.className)),
      "已切到「按设计师查找」");
    await waitForPoll("经理查找方式");
    check("轮询后仍是「按设计师查找」",
      isActive(await byDesigner.evaluate((el) => el.className)) &&
        !isActive(await byDispatcher.evaluate((el) => el.className)),
      "未被重置回默认的「按派单人查找」");

    // ── 3. 公司名修改：管理员未保存的编辑不得被轮询清空
    console.log("\n[3] 公司名修改 · 未保存草稿");
    bump.reset();
    await loginAs(page, "admin", "003900");
    await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: /公司名修改/ }).first().click();
    await page.waitForTimeout(800);
    const badge = page.locator('input[name="badgeLabel"]').first();
    if (await badge.isVisible().catch(() => false)) {
      const draft = "回归验证·未保存草稿";
      await badge.fill(draft);
      await waitForPoll("公司名草稿");
      check("轮询后未保存的品牌文案仍在", (await badge.inputValue()) === draft,
        `实际 "${await badge.inputValue()}"`);
    } else {
      console.log("  [skip] 未找到品牌文案输入框");
    }

    // ── 4. 提成比例：管理员未保存的编辑不得被轮询清空
    console.log("\n[4] 提成比例 · 未保存草稿");
    bump.reset();
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: /数据工具/ }).first().click();
    await page.waitForTimeout(1000);
    const rate = page.getByLabel("签约金额").first();
    if (await rate.isVisible().catch(() => false)) {
      await rate.fill("42.5");
      await waitForPoll("提成草稿");
      check("轮询后未保存的提成比例仍在", (await rate.inputValue()) === "42.5",
        `实际 "${await rate.inputValue()}"`);
    } else {
      console.log("  [skip] 未找到提成比例输入框");
    }
  } finally {
    await browser.close();
  }

  if (failures.length > 0) {
    console.error(`\n结果: FAIL（${failures.length} 项）`);
    process.exit(1);
  }
  console.log("\n结果: PASS — 云端同步轮询不再重置录入 / 筛选 / 未保存草稿");
}

void main();
