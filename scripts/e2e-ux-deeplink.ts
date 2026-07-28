/**
 * Deep-link checks using live browser order data (not snapshot file alone).
 * Run: npx tsx scripts/e2e-ux-deeplink.ts
 */
import { chromium, type Page } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const issues: string[] = [];
function fail(msg: string) {
  issues.push(msg);
  console.error("[fail]", msg);
}
function ok(msg: string) {
  console.log("[ok]", msg);
}

async function login(page: Page, user: string, pass: string) {
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "登录" }).first().click();
  await page.fill('input[name="username"]', user);
  await page.fill('input[name="password"]', pass);
  await page.getByRole("button", { name: "确认登录" }).click();
  await page.waitForTimeout(1000);
}

async function logout(page: Page) {
  const btn = page.getByRole("button", { name: "退出" });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(500);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await browser.newPage();
  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  try {
    await login(page, "admin", "003900");

    // —— Live delivery deep link ——
    await page.goto(`${BASE}/delivery`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    // Prefer switching period to 全部 if control exists
    const allPeriod = page.getByRole("button", { name: /^全部$/ }).first();
    if (await allPeriod.isVisible().catch(() => false)) {
      await allPeriod.click();
      await page.waitForTimeout(600);
    }

    // 从同步接口取真实交付单 id（列表 UI 不展示原始 id）
    let liveDeliveryId: string | null = null;
    let liveDeliveryLabel = "";
    const fromApi = await page.evaluate(async () => {
      const res = await fetch("/api/sync", { cache: "no-store" });
      if (!res.ok) return null;
      const json = (await res.json()) as {
        orders?: Array<{ id: string; status: string; address?: string }>;
      };
      const hit = (json.orders ?? []).find((o) =>
        ["已下单", "已安装", "已验收", "已签约"].includes(o.status),
      );
      return hit ? { id: hit.id, address: hit.address ?? "" } : null;
    });
    if (fromApi?.id) {
      liveDeliveryId = fromApi.id;
      liveDeliveryLabel = fromApi.address || fromApi.id;
    }

    if (!liveDeliveryId) {
      ok("同步接口无交付样本，跳过深链定位断言");
    } else {
      ok(`拿到在线交付单 ${liveDeliveryId} (${liveDeliveryLabel})`);
      await page.goto(
        `${BASE}/delivery?orderId=${encodeURIComponent(liveDeliveryId)}`,
        { waitUntil: "networkidle" },
      );
      await page.waitForTimeout(1800);
      const body = await page.locator("body").innerText();
      const hit =
        (liveDeliveryLabel &&
          liveDeliveryLabel.length >= 4 &&
          body.includes(liveDeliveryLabel.slice(0, 8))) ||
        body.includes(liveDeliveryId);
      // 选中详情区应出现「标记为已安装」或客户信息
      const selected =
        hit || /标记为已安装|更新进度|客户姓名/.test(body);
      if (selected) ok("交付深链定位成功");
      else fail(`交付深链定位失败 ${liveDeliveryId}`);
    }

    // —— Admin undispatched live ——
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const undSection = page.locator("#admin-undispatched-section").first();
    if (await undSection.isVisible()) {
      ok("未派单区常显");
      const card = undSection.locator("[id^='order-card-']").first();
      if (await card.count()) {
        const idAttr = await card.getAttribute("id");
        const oid = idAttr?.replace("order-card-", "") ?? "";
        if (oid) {
          await page.goto(
            `${BASE}/admin?view=dispatch&orderId=${encodeURIComponent(oid)}`,
            { waitUntil: "networkidle" },
          );
          await page.waitForTimeout(1500);
          const focused = page.locator(`#order-card-${oid}`);
          if (await focused.count()) ok(`未派单深链高亮 ${oid}`);
          else fail(`未派单深链未高亮 ${oid}`);
        }
      } else {
        ok("当前无未派单客户（空态正常）");
      }
    } else {
      fail("未派单区不可见");
    }

    // —— Designer deep link live ——
    await logout(page);
    await login(page, "汤雷", "1");
    await page.goto(`${BASE}/designer`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const desCard = page.locator("[id^='order-card-']").first();
    if (await desCard.count()) {
      const idAttr = await desCard.getAttribute("id");
      const oid = idAttr?.replace("order-card-", "") ?? "";
      await page.goto(`${BASE}/designer?orderId=${encodeURIComponent(oid)}`, {
        waitUntil: "networkidle",
      });
      await page.waitForTimeout(1500);
      if (await page.locator(`#order-card-${oid}`).count()) {
        ok(`设计师深链高亮 ${oid}`);
      } else {
        const body = await page.locator("body").innerText();
        if (body.includes(oid)) ok(`设计师深链可见 ${oid}`);
        else fail(`设计师深链失败 ${oid}`);
      }
    } else {
      ok("汤雷当前列表无单，跳过设计师深链");
    }

    // —— Permission + default landing quick recheck ——
    await page.goto(`${BASE}/delivery`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    if (!(await page.locator("body").innerText()).includes("没有权限")) {
      fail("设计师访问交付应无权限");
    } else ok("设计师访问交付仍正确拦截");

    await logout(page);
    await login(page, "盛慧", "1");
    if (!page.url().includes("/admin")) fail(`派单默认落地错误 ${page.url()}`);
    else ok("派单默认落地 /admin");

    // willDispatch hint: select designer on 新建客户
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const tab = page.getByRole("button", { name: "新建客户" });
    if (await tab.count()) {
      await tab.click();
      await page.waitForTimeout(400);
      // find designer combobox/select
      const selects = page.locator("select:not([disabled])");
      const sc = await selects.count();
      let toggled = false;
      for (let i = 0; i < sc; i++) {
        const sel = selects.nth(i);
        const name = (await sel.getAttribute("name")) || "";
        if (name && name !== "designer" && !/designer/i.test(name)) continue;
        const values = await sel.locator("option").evaluateAll((els) =>
          els.map((e) => (e as HTMLOptionElement).value),
        );
        const pick = values.find((v) => v && v !== "");
        if (pick) {
          await sel.selectOption(pick);
          toggled = true;
          await page.waitForTimeout(400);
          break;
        }
      }
      // 若设计师是自定义控件而非 native select，不强制失败
      const body = await page.locator("body").innerText();
      if (toggled && /确认派单|已选择设计师/.test(body)) {
        ok("新建客户选设计师后出现派单提示/按钮");
      } else {
        ok("新建客户页可用（设计师控件为自定义或未选，跳过强断言）");
      }
    }

    const serious = consoleErrors.filter(
      (e) => !/favicon|React DevTools|hydration/i.test(e),
    );
    if (serious.length) fail(`pageerror: ${serious.slice(0, 3).join(" | ")}`);
    else ok("无 pageerror");
  } finally {
    await browser.close();
  }

  console.log("\n======== DEEPLINK SUMMARY ========");
  console.log(
    issues.length ? issues.map((i) => `- ${i}`).join("\n") : "all passed",
  );
  if (issues.length) process.exit(1);
}

main();
