import { chromium, devices } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const OUT = join("scripts", "iphone-audit");

async function login(page: import("playwright").Page, user: string, pass: string) {
  await page.goto("http://localhost:3000/");
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "登录" }).first().click();
  await page.fill("input[name=username]", user);
  await page.fill("input[name=password]", pass);
  await page.getByRole("button", { name: "确认登录" }).click();
  await page.waitForTimeout(1500);
}

async function overflowReport(page: import("playwright").Page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const wide: Array<{ cls: string; sw: number; cw: number; tag: string }> = [];
    document.querySelectorAll("body *").forEach((node) => {
      const el = node as HTMLElement;
      if (!el.getBoundingClientRect) return;
      if (el.scrollWidth > vw + 8) {
        wide.push({
          tag: el.tagName,
          cls: String(el.className).slice(0, 100),
          sw: el.scrollWidth,
          cw: el.clientWidth,
        });
      }
    });
    wide.sort((a, b) => b.sw - a.sw);
    return {
      vw,
      vh,
      bodySW: document.body.scrollWidth,
      htmlSW: document.documentElement.scrollWidth,
      shellSw: (document.querySelector(".vi-app-bg") as HTMLElement | null)
        ?.scrollWidth,
      shellCw: (document.querySelector(".vi-app-bg") as HTMLElement | null)
        ?.clientWidth,
      topWide: wide.slice(0, 8),
    };
  });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();

  // 1) guest home
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.screenshot({ path: join(OUT, "01-guest-home.png"), fullPage: true });
  const guest = await overflowReport(page);

  // 2) designer login -> default board
  await login(page, "汤雷", "1");
  await page.waitForTimeout(800);
  await page.screenshot({
    path: join(OUT, "02-after-login-designer.png"),
    fullPage: false,
  });
  const afterLogin = await overflowReport(page);
  console.log("AFTER_LOGIN", JSON.stringify(afterLogin, null, 2));

  // 3) open measure if button exists
  await page.goto("http://localhost:3000/designer", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const measureBtn = page.getByRole("button", { name: /易测量|去测量|量尺/ }).first();
  if (await measureBtn.count()) {
    await measureBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: join(OUT, "03-measure-entry.png"),
      fullPage: false,
    });
    const measureEntry = await overflowReport(page);
    console.log("MEASURE_ENTRY", JSON.stringify(measureEntry, null, 2));

    // try open annotator if photo exists
    const annotate = page
      .locator("button, a, label")
      .filter({ hasText: /标注|编辑|继续|打开|拍照|相册|图库/ })
      .first();
    if (await annotate.count()) {
      await annotate.click().catch(() => {});
      await page.waitForTimeout(1200);
    }
    // click first photo thumbnail if any
    const thumb = page.locator(".measure-root img, .measure-root button img").first();
    if (await thumb.count()) {
      await thumb.click().catch(() => {});
      await page.waitForTimeout(1000);
    }
    await page.screenshot({
      path: join(OUT, "04-measure-workspace.png"),
      fullPage: false,
    });
    const measureWs = await overflowReport(page);
    console.log("MEASURE_WS", JSON.stringify(measureWs, null, 2));

    // measure DOM structure
    const measureDom = await page.evaluate(() => {
      const root = document.querySelector(".measure-root") as HTMLElement | null;
      if (!root) return { found: false };
      const canvas = root.querySelector(".measure-canvas, canvas") as HTMLElement | null;
      const wrap = root.querySelector(".canvas-wrap") as HTMLElement | null;
      const toolbar = root.querySelector(".toolbar") as HTMLElement | null;
      const cs = root ? getComputedStyle(root) : null;
      return {
        found: true,
        rootH: root.clientHeight,
        rootSH: root.scrollHeight,
        canvas: canvas
          ? {
              w: canvas.clientWidth,
              h: canvas.clientHeight,
              maxH: getComputedStyle(canvas).maxHeight,
            }
          : null,
        wrap: wrap
          ? {
              w: wrap.clientWidth,
              h: wrap.clientHeight,
              maxH: getComputedStyle(wrap).maxHeight,
            }
          : null,
        toolbar: toolbar
          ? { w: toolbar.clientWidth, sw: toolbar.scrollWidth }
          : null,
        overflow: cs?.overflow,
        display: cs?.display,
      };
    });
    console.log("MEASURE_DOM", JSON.stringify(measureDom, null, 2));
  } else {
    console.log("NO_MEASURE_BUTTON");
  }

  // 4) manager login home overflow (刘坤)
  await login(page, "刘坤", "2");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: join(OUT, "05-manager-home.png"),
    fullPage: false,
  });
  const mgrHome = await overflowReport(page);
  console.log("MGR_HOME", JSON.stringify(mgrHome, null, 2));

  await page.goto("http://localhost:3000/designer", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: join(OUT, "06-manager-designer.png"),
    fullPage: false,
  });
  console.log("MGR_DESIGNER", JSON.stringify(await overflowReport(page), null, 2));

  console.log("GUEST", JSON.stringify(guest, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
