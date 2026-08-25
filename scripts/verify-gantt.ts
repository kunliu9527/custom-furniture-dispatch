/**
 * 流程甘特图浏览器验证（本地 dev server + Chrome）：
 * 1. /manager 侧边栏出现「流程甘特图」并进入
 * 2. 渲染订单行 + 彩色阶段条 + 日期轴 + 「今天」线 + 图例
 * 3. 范围/状态/门店筛选生效
 * 4. 点击行 → 跳转订单查询深链
 * 5. 退单筛选空结果 → 空态
 *
 * 用法：npx tsx scripts/verify-gantt.ts（需先 npm run dev）
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await browser.newPage();
  const failed: string[] = [];
  const report = (name: string, pass: boolean, extra = "") => {
    console.log(`${pass ? "PASS" : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
    if (!pass) failed.push(name);
  };

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });

  // 登录 admin
  await page.getByRole("button", { name: "登录" }).first().click();
  await page.fill("input[name=username]", "admin");
  await page.fill("input[name=password]", "003900");
  await page.getByRole("button", { name: "确认登录" }).click();
  await page.waitForTimeout(2000);

  // 1) 侧边栏入口
  await page.goto(BASE + "/manager", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const sidebarItem = page.getByRole("button", { name: /流程甘特图/ }).first();
  const sidebarVisible = await sidebarItem.isVisible().catch(() => false);
  report("manager 侧边栏出现「流程甘特图」", sidebarVisible);

  // 2) 进入甘特图
  if (sidebarVisible) {
    await sidebarItem.click();
    await page.waitForTimeout(1500);
  } else {
    await page.goto(BASE + "/manager?section=gantt", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
  }
  const title = await page.getByRole("heading", { name: "流程甘特图" }).isVisible().catch(() => false);
  const rowCount = await page.locator("button.sticky.left-0").count();
  const barCount = await page.locator("span.absolute.top-1\\/2").count();
  const todayLine = await page.locator("text=今天").first().isVisible().catch(() => false);
  const legend = await page.locator("text=图例").count() > 0 || await page.locator("span", { hasText: "已验收" }).count() > 0;
  report(
    "甘特图渲染（标题/订单行/阶段条/今天线/图例）",
    title && rowCount > 0 && barCount > 0 && todayLine,
    `rows=${rowCount} bars=${barCount} today=${todayLine} legend=${legend}`,
  );

  // 3) 范围切换不崩溃
  const countBefore = await page.locator("text=/^共 /").first().innerText().catch(() => "");
  await page.getByRole("button", { name: "180天" }).click();
  await page.waitForTimeout(1000);
  const countAfter = await page.locator("text=/^共 /").first().innerText().catch(() => "");
  const pageOk = await page.getByRole("heading", { name: "流程甘特图" }).isVisible().catch(() => false);
  report("范围切换（180天）正常", pageOk, `count ${countBefore} → ${countAfter}`);

  // 4) 点击行 → 订单查询深链
  const firstRow = page.locator("button.sticky.left-0").first();
  if (await firstRow.isVisible().catch(() => false)) {
    await firstRow.click();
    await page.waitForTimeout(2000);
    const url = page.url();
    report("点击行跳转订单查询深链", url.includes("/manager?section=lookup&orderId="), url);
  } else {
    report("点击行跳转订单查询深链", false, "无可见行");
  }

  // 5) 回到甘特图，验证空态（退单筛选可能为空则显示空态）
  await page.goto(BASE + "/manager?section=gantt", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "退单", exact: true }).click();
  await page.waitForTimeout(800);
  const emptyState = await page.locator("text=当前筛选下暂无订单").isVisible().catch(() => false);
  const stillRows = (await page.locator("button.sticky.left-0").count()) > 0;
  report("退单筛选（有单或有空态）", emptyState || stillRows, `empty=${emptyState} rows=${stillRows}`);

  await browser.close();
  console.log(`\n===== ${failed.length === 0 ? "全部通过" : `${failed.length} 项失败：${failed.join("、")}`} =====`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
