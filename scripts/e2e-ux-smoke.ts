/**
 * Smoke-test UX friction fixes against local Next.js (http://localhost:3000).
 * Run: npx tsx scripts/e2e-ux-smoke.ts
 */
import { chromium, type Page, type Browser } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

type Issue = { severity: "high" | "medium" | "low"; area: string; detail: string };

const issues: Issue[] = [];

function fail(severity: Issue["severity"], area: string, detail: string) {
  issues.push({ severity, area, detail });
  console.error(`[${severity}] ${area}: ${detail}`);
}

function ok(area: string, detail: string) {
  console.log(`[ok] ${area}: ${detail}`);
}

async function openLogin(page: Page) {
  // Home header login button
  const loginBtn = page.getByRole("button", { name: "登录" }).first();
  if (await loginBtn.isVisible().catch(() => false)) {
    await loginBtn.click();
  }
  await page.waitForSelector('input[name="username"]', { timeout: 8000 });
}

async function loginAs(page: Page, username: string, password: string) {
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  // Clear prior session
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });

  await openLogin(page);
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: "确认登录" }).click();
  await page.waitForTimeout(800);
}

async function logout(page: Page) {
  const exit = page.getByRole("button", { name: /退出|登出/ }).first();
  if (await exit.isVisible().catch(() => false)) {
    await exit.click();
    await page.waitForTimeout(400);
  } else {
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
  }
}

async function textHas(page: Page, re: RegExp) {
  const body = await page.locator("body").innerText();
  return re.test(body);
}

async function run() {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true, channel: "chrome" });
    const page = await browser.newPage();

    // —— Guest landing ——
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const guestOk = await textHas(page, /全屋定制|派单原型|请使用右上角登录|请登录后进入/);
    if (!guestOk) fail("high", "guest", "未登录首页缺少门户文案");
    else ok("guest", "门户落地页可见");

    const syncClaim = await textHas(page, /数据实时同步/);
    if (syncClaim) fail("medium", "guest", "仍宣传「数据实时同步」");
    else ok("guest", "已去掉「实时同步」夸大表述");

    const salesGuest = await textHas(page, /销售概览/);
    if (salesGuest) fail("low", "guest", "未登录页不应出现销售概览");

    // —— Designer personal ——
    await loginAs(page, "汤雷", "1");
    await page.waitForTimeout(600);
    const designerUrl = page.url();
    if (!designerUrl.includes("/designer")) {
      // may land then redirect
      await page.waitForTimeout(1500);
    }
    const afterDesigner = page.url();
    if (!afterDesigner.includes("/designer")) {
      fail("high", "designer-login", `期望默认进 /designer，实际 ${afterDesigner}`);
    } else ok("designer-login", "默认进入设计师工作台");

    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    if (await textHas(page, /销售概览|销售指标待接入/)) {
      fail("medium", "home", "登录后仍有空壳销售概览");
    } else ok("home", "无销售概览空壳");

    if (!(await textHas(page, /履约进程/))) {
      fail("medium", "home", "缺少履约进程分区");
    } else ok("home", "履约进程可见");

    // KPI links should not trap to delivery/evaluation
    const kpiLinks = page.locator('a[href^="/"]');
    const hrefs: string[] = [];
    const count = await kpiLinks.count();
    for (let i = 0; i < Math.min(count, 40); i++) {
      const h = await kpiLinks.nth(i).getAttribute("href");
      if (h) hrefs.push(h);
    }
    const bad = hrefs.filter((h) => h === "/delivery" || h === "/evaluation");
    // personal designer typically cannot open these — if present as KPI cards it's a trap
    const fulfillmentLinks = await page
      .locator('[aria-label="工作台概览"] a')
      .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute("href") || ""));
    const trap = fulfillmentLinks.filter((h) => h === "/delivery" || h === "/evaluation");
    if (trap.length) fail("high", "kpi", `设计师 KPI 仍链到无权限板: ${trap.join(",")}`);
    else ok("kpi", `设计师履约链接均可访问: ${fulfillmentLinks.join(" | ") || "(none)"}`);

    // Permission denial page
    await page.goto(BASE + "/delivery", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const denied = await textHas(page, /没有权限访问此板块/);
    if (!denied) fail("high", "route-guard", "访问 /delivery 未见无权限提示");
    else ok("route-guard", "无权限提示出现");

    await page.goto(BASE + "/evaluation", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    if (!(await textHas(page, /没有权限访问此板块/))) {
      fail("high", "route-guard", "访问 /evaluation 未见无权限提示");
    } else ok("route-guard", "evaluation 无权限提示 OK");

    await logout(page);

    // —— Dispatcher personal ——
    await loginAs(page, "盛慧", "1");
    await page.waitForTimeout(1000);
    if (!page.url().includes("/admin")) {
      fail("high", "dispatcher-login", `期望默认 /admin，实际 ${page.url()}`);
    } else ok("dispatcher-login", "默认进入新客户开发");

    await page.goto(BASE + "/manager", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    // personal can access manager — should see 简报/查询, not 工单待办 in sidebar
    const mgrText = await page.locator("body").innerText();
    if (/工单待办/.test(mgrText) && /本周简报/.test(mgrText)) {
      // sidebar may hide 工单待办 for personal
      const sidebar = await page.locator(".vi-sidebar-item-title, [class*='sidebar']").allInnerTexts().catch(() => []);
      const joined = sidebar.join("\n");
      if (joined.includes("工单待办")) {
        fail("medium", "manager-personal", "本人侧栏仍显示工单待办");
      } else ok("manager-personal", "本人侧栏无工单待办");
    } else {
      ok("manager-personal", "已进入项目进程管理");
    }

    // Notification labels for personal
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const headerText = await page.locator("header").innerText();
    if (/通知/.test(headerText) && !/查询/.test(headerText)) {
      // on home, manager bell may show
    }
    // Bell is in app shell boards; on home may also show via LoginPanel area — check manager page header
    await page.goto(BASE + "/manager", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const shell = await page.locator("header, [class*='shell']").first().innerText().catch(() => "");
    const top = await page.locator("body").innerText();
    if (/查询/.test(top) || /简报/.test(top)) {
      ok("notify", "本人可见简报/查询入口");
    } else {
      fail("low", "notify", "未看到简报/查询文案（可能布局差异）");
    }

    // Admin deep link with fake order id should at least open dispatch/lookup without crash
    await page.goto(BASE + "/admin?view=dispatch&orderId=nonexistent-id", {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(600);
    if (await textHas(page, /Application error|Unhandled/)) {
      fail("high", "admin-deeplink", "深链导致运行时错误");
    } else ok("admin-deeplink", "dispatch+orderId 深链未崩溃");

    if (!(await textHas(page, /未派单客户|全部已指派/))) {
      fail("medium", "admin-undispatched", "未派单区未常显");
    } else ok("admin-undispatched", "未派单区可见（含空态）");

    await logout(page);

    // —— Admin ——
    await loginAs(page, "admin", "003900");
    await page.waitForTimeout(1000);
    // executives land on /
    if (!page.url().endsWith("/") && !page.url().includes(":3000/")) {
      // allow query
    }
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    if (!(await textHas(page, /履约进程/))) fail("medium", "admin-home", "管理员首页无履约进程");
    else ok("admin-home", "管理员首页履约进程 OK");

    await page.goto(BASE + "/evaluation", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    if (await textHas(page, /前往店长看板/)) {
      fail("high", "eval-copy", "仍显示「前往店长看板」");
    } else if (await textHas(page, /前往项目进程管理/)) {
      ok("eval-copy", "驾驶舱文案已改为项目进程管理");
    } else {
      fail("low", "eval-copy", "未找到驾驶舱异常处理链接（可能默认不在驾驶舱页）");
    }

    if (await textHas(page, /演示趋势数据/) && !(await textHas(page, /请勿当作真实经营指标|非正式数据/))) {
      fail("medium", "demo-trend", "演示趋势警告不够明显");
    }

    // Delivery deep link as admin (has access)
    await page.goto(BASE + "/delivery?orderId=nonexistent", {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(800);
    if (await textHas(page, /Application error|Unhandled/)) {
      fail("high", "delivery-deeplink", "交付深链崩溃");
    } else ok("delivery-deeplink", "orderId 深链未崩溃");

    // Store manager if exists
    await logout(page);
    await loginAs(page, "彭朝霞", "1");
    await page.waitForTimeout(1000);
    if (await textHas(page, /登录失败|账号或密码/)) {
      ok("store-mgr", "本地无此店长账号，跳过");
    } else {
      await page.goto(BASE + "/delivery", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      if (await textHas(page, /只读/)) ok("store-mgr", "店长交付只读提示可见");
      else fail("medium", "store-mgr", "店长进入交付未见只读提示");

      await page.goto(BASE + "/designer", { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      if (await textHas(page, /没有权限访问此板块/)) {
        ok("store-mgr", "店长无法进设计师工作台（与文案一致）");
      } else {
        fail("medium", "store-mgr", "店长仍能进入设计师工作台或未见无权限页");
      }
    }

    // Accept page public (token invalid)
    await page.goto(BASE + "/accept/invalid-token-test", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    if (await textHas(page, /无效|过期/)) ok("accept", "无效验收链接有提示");
    else fail("low", "accept", "无效 token 提示不明确");

  } catch (err) {
    fail("high", "runner", String(err));
  } finally {
    await browser?.close();
  }

  const high = issues.filter((i) => i.severity === "high").length;
  const medium = issues.filter((i) => i.severity === "medium").length;
  const low = issues.filter((i) => i.severity === "low").length;
  console.log("\n======== SUMMARY ========");
  console.log(`issues: high=${high} medium=${medium} low=${low} total=${issues.length}`);
  for (const i of issues) {
    console.log(`- [${i.severity}] ${i.area}: ${i.detail}`);
  }
  if (high > 0) process.exit(1);
}

run();
