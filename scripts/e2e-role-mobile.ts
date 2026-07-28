/**
 * Mobile layout audit across roles + measure save-back flow.
 * Run: npx tsx scripts/e2e-role-mobile.ts
 */
import { chromium, type Browser, type Page } from "playwright";
import fs from "fs";
import os from "os";
import path from "path";

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

async function loginAs(page: Page, username: string, password: string) {
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  const loginBtn = page.getByRole("button", { name: "登录" }).first();
  if (await loginBtn.isVisible().catch(() => false)) await loginBtn.click();
  await page.waitForSelector('input[name="username"]', { timeout: 10000 });
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: "确认登录" }).click();
  await page.waitForTimeout(1000);
}

async function logout(page: Page) {
  const exit = page.getByRole("button", { name: /退出/ }).first();
  if (await exit.isVisible().catch(() => false)) {
    await exit.click();
    await page.waitForTimeout(500);
  }
}

async function auditPage(page: Page, role: string, pathName: string) {
  await page.goto(BASE + pathName, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const m = await page.evaluate(() => {
    const body = document.body;
    const header = document.querySelector("header") as HTMLElement | null;
    const card = document.querySelector(".vi-order-card") as HTMLElement | null;
    const dl = card?.querySelector("dl") as HTMLElement | null;
    const action = card?.querySelector(".vi-order-action-bar") as HTMLElement | null;
    const remark = card?.querySelector("textarea") as HTMLElement | null;
    return {
      overflowX: body.scrollWidth - window.innerWidth,
      headerH: header?.getBoundingClientRect().height ?? 0,
      denied: /没有权限访问此板块/.test(body.innerText),
      hasCard: Boolean(card),
      orderOk:
        !dl ||
        !action ||
        (dl.getBoundingClientRect().top < action.getBoundingClientRect().top &&
          (!remark ||
            action.getBoundingClientRect().bottom <=
              remark.getBoundingClientRect().top + 4)),
      depositClipped: (() => {
        const btn = Array.from(card?.querySelectorAll("button") || []).find((b) =>
          (b.textContent || "").includes("修改定金"),
        ) as HTMLElement | undefined;
        if (!btn || !card) return false;
        return btn.getBoundingClientRect().right > card.getBoundingClientRect().right + 2;
      })(),
    };
  });
  const tag = `${role}${pathName}`;
  if (m.denied) {
    ok(tag, "无权限页（预期或越权）");
    return m;
  }
  if (m.overflowX > 8) fail("high", tag, `横向溢出 ${m.overflowX}px`);
  else ok(tag, `无横向溢出 (header=${Math.round(m.headerH)}px)`);
  if (m.hasCard && !m.orderOk) fail("high", tag, "订单卡区块顺序异常（备注/操作错位）");
  if (m.hasCard && m.depositClipped) fail("high", tag, "修改定金按钮被裁切");
  if (m.hasCard && m.orderOk && !m.depositClipped) ok(tag, "订单卡布局正常");
  return m;
}

function tinyJpeg(): string {
  const b64 =
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z";
  const file = path.join(os.tmpdir(), `role-m-${Date.now()}.jpg`);
  fs.writeFileSync(file, Buffer.from(b64, "base64"));
  return file;
}

async function testMeasureSaveBack(page: Page) {
  await loginAs(page, "汤雷", "1");
  await page.goto(BASE + "/designer", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const measure = page.getByRole("button", { name: /易测量/ }).first();
  if (!(await measure.isVisible().catch(() => false))) {
    fail("medium", "measure", "找不到易测量入口");
    return;
  }
  await measure.click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "本地" }).first().click().catch(() => undefined);
  const file = tinyJpeg();
  await page.locator('label:has-text("图库选图") input[type="file"]').setInputFiles(file);
  await page.waitForSelector("canvas.measure-canvas", { timeout: 10000 });
  const canvasH = await page.locator("canvas.measure-canvas").evaluate((el) => {
    const r = (el as HTMLElement).getBoundingClientRect();
    return r.height;
  });
  if (canvasH < 200) fail("medium", "measure-size", `画布偏矮 ${Math.round(canvasH)}px`);
  else ok("measure-size", `画布高度 ${Math.round(canvasH)}px`);

  await page.getByRole("button", { name: /保存并继续|完成/ }).click();
  await page.waitForTimeout(600);
  const backToPicker = await page.getByRole("button", { name: "图库选图" }).isVisible().catch(() => false);
  const stillAnnotating = await page.locator("canvas.measure-canvas").isVisible().catch(() => false);
  if (backToPicker && !stillAnnotating) ok("measure-save-back", "保存后回到选图页");
  else fail("high", "measure-save-back", `未回到选图页 picker=${backToPicker} canvas=${stillAnnotating}`);
  try {
    fs.unlinkSync(file);
  } catch {
    /* ignore */
  }
}

async function run() {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true, channel: "chrome" });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    const roles: { name: string; user: string; pass: string; paths: string[] }[] = [
      { name: "designer", user: "汤雷", pass: "1", paths: ["/designer"] },
      { name: "dispatcher", user: "盛慧", pass: "1", paths: ["/admin", "/manager"] },
      { name: "admin", user: "admin", pass: "003900", paths: ["/designer", "/manager", "/admin"] },
      { name: "store-mgr", user: "彭朝霞", pass: "1", paths: ["/manager", "/designer"] },
    ];

    for (const r of roles) {
      await loginAs(page, r.user, r.pass);
      for (const p of r.paths) {
        await auditPage(page, r.name, p);
      }
      await logout(page);
    }

    await testMeasureSaveBack(page);

    console.log("\n—— summary ——");
    console.log(`issues=${issues.length} high=${issues.filter((i) => i.severity === "high").length}`);
    if (issues.some((i) => i.severity === "high")) process.exitCode = 1;
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await browser?.close();
  }
}

void run();
