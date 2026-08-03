import { chromium, devices } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const OUT = join("scripts", "iphone-audit");

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();

  await page.goto("http://localhost:3000/");
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "登录" }).first().click();
  await page.fill("input[name=username]", "汤雷");
  await page.fill("input[name=password]", "1");
  await page.getByRole("button", { name: "确认登录" }).click();
  await page.waitForTimeout(1200);
  await page.goto("http://localhost:3000/designer", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // filter 已量尺
  const measuredChip = page.getByRole("button", { name: /已量尺/ }).first();
  if (await measuredChip.count()) await measuredChip.click();
  await page.waitForTimeout(800);

  // open first 易测量
  const easy = page.getByRole("button", { name: /易测量/ }).first();
  console.log("easyCount", await easy.count());
  if (!(await easy.count())) {
    // try any measure related
    const alt = page.locator("button").filter({ hasText: /测量|量尺/ });
    console.log(
      "altButtons",
      await alt.evaluateAll((els) => els.map((e) => e.textContent?.trim()).slice(0, 20)),
    );
  } else {
    await easy.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({
    path: join(OUT, "10-measure-picker.png"),
    fullPage: false,
  });

  const info = await page.evaluate(() => {
    const root = document.querySelector(".measure-root") as HTMLElement | null;
    const title = document.querySelector("h1")?.textContent;
    const buttons = Array.from(document.querySelectorAll("button"))
      .map((b) => (b.textContent || "").trim())
      .filter(Boolean)
      .slice(0, 40);
    return {
      title,
      hasMeasureRoot: !!root,
      path: location.pathname,
      root: root
        ? {
            cls: root.className,
            h: root.clientHeight,
            sh: root.scrollHeight,
            w: root.clientWidth,
          }
        : null,
      buttons,
      vw: innerWidth,
      vh: innerHeight,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  // try click a photo card / 标注
  const photoCard = page
    .locator(".measure-root button, .measure-root label, [class*='photo']")
    .filter({ hasText: /标注|编辑|房间|卧室|客厅|厨房|卫生间|继续/ })
    .first();
  if (await photoCard.count()) {
    await photoCard.click();
    await page.waitForTimeout(1500);
  } else {
    // click first image in measure
    const img = page.locator(".measure-root img").first();
    if (await img.count()) {
      await img.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1200);
    }
  }

  await page.screenshot({
    path: join(OUT, "11-measure-annotator.png"),
    fullPage: false,
  });

  const annot = await page.evaluate(() => {
    const root = document.querySelector(".measure-root") as HTMLElement | null;
    const wrap = root?.querySelector(".canvas-wrap") as HTMLElement | null;
    const canvas = root?.querySelector("canvas") as HTMLCanvasElement | null;
    const toolbar = root?.querySelector(".toolbar") as HTMLElement | null;
    const topbar = root?.querySelector(".topbar") as HTMLElement | null;
    return {
      hasRoot: !!root,
      vh: innerHeight,
      rootH: root?.clientHeight,
      rootSH: root?.scrollHeight,
      wrapH: wrap?.clientHeight,
      wrapMaxH: wrap ? getComputedStyle(wrap).maxHeight : null,
      canvasW: canvas?.clientWidth,
      canvasH: canvas?.clientHeight,
      toolbarH: toolbar?.clientHeight,
      toolbarSW: toolbar?.scrollWidth,
      toolbarCW: toolbar?.clientWidth,
      topbarH: topbar?.clientHeight,
      orders: root
        ? Array.from(root.children).map((c) => ({
            cls: String((c as HTMLElement).className).slice(0, 60),
            order: getComputedStyle(c as HTMLElement).order,
            h: (c as HTMLElement).clientHeight,
          }))
        : [],
    };
  });
  console.log("ANNOT", JSON.stringify(annot, null, 2));

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
