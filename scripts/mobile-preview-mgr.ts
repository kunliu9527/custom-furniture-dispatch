import { chromium, devices } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const OUT = join("scripts", "mobile-preview");

async function loginAsManager(page: import("playwright").Page) {
  await page.goto("http://localhost:3000/");
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "登录" }).first().click();
  await page.fill("input[name=username]", "刘坤");
  await page.fill("input[name=password]", "2");
  await page.getByRole("button", { name: "确认登录" }).click();
  await page.waitForTimeout(1000);
}

async function mainScroll(page: import("playwright").Page) {
  return page.evaluateHandle(() => {
    const list = Array.from(
      document.querySelectorAll("main .overflow-y-auto"),
    ) as HTMLElement[];
    return list.sort((a, b) => b.scrollHeight - a.scrollHeight)[0] ?? null;
  });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext({
    ...devices["iPhone 13"],
  });
  const page = await context.newPage();

  await loginAsManager(page);
  await page.goto("http://localhost:3000/designer", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1500);

  // 1. 首屏
  await page.screenshot({
    path: join(OUT, "01-designer-top.png"),
    fullPage: false,
  });

  // 2. 导航滑到最右（应看到「综合系统看板」）
  await page.evaluate(() => {
    const nav = document.querySelector(".vi-nav-segment") as HTMLElement | null;
    if (nav) nav.scrollLeft = nav.scrollWidth;
  });
  await page.screenshot({
    path: join(OUT, "02-nav-scrolled-right.png"),
    fullPage: false,
  });
  await page.evaluate(() => {
    const nav = document.querySelector(".vi-nav-segment") as HTMLElement | null;
    if (nav) nav.scrollLeft = 0;
  });

  // 3. 状态 chips 滑到最右
  await page.evaluate(() => {
    const chips = document
      .querySelector(".vi-filter-chip")
      ?.parentElement?.parentElement as HTMLElement | null;
    if (chips) chips.scrollLeft = chips.scrollWidth;
  });
  await page.screenshot({
    path: join(OUT, "03-status-chips-right.png"),
    fullPage: false,
  });
  await page.evaluate(() => {
    const chips = document
      .querySelector(".vi-filter-chip")
      ?.parentElement?.parentElement as HTMLElement | null;
    if (chips) chips.scrollLeft = 0;
  });

  // 4. 正文下滚一段
  const scroller = await mainScroll(page);
  await page.evaluate((el) => {
    if (el) (el as HTMLElement).scrollTop = 900;
  }, scroller);
  await page.screenshot({
    path: join(OUT, "04-list-scrolled.png"),
    fullPage: false,
  });

  // 5. 再滚更深
  await page.evaluate((el) => {
    if (el) (el as HTMLElement).scrollTop = 2800;
  }, scroller);
  await page.screenshot({
    path: join(OUT, "05-list-deeper.png"),
    fullPage: false,
  });

  // 6. 项目进程管理
  await page.goto("http://localhost:3000/manager", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: join(OUT, "06-manager-board.png"),
    fullPage: false,
  });

  console.log(`Saved previews to ${OUT}`);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
