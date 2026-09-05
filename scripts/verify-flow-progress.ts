/**
 * 流程推进图浏览器验证（本地 dev server + Chrome）：
 * 1. /manager 侧边栏出现「流程推进图」并进入
 * 2. 渲染订单行 + 主流程列表头 + 填色达成日期格 + 图例
 * 3. 时间范围筛选已移除;状态分组切换正常
 * 4. 点击行首 → 打开订单卡浮层(不跳转)
 * 5. 退单筛选空结果 → 空态
 *
 * 用法：npx tsx scripts/verify-flow-progress.ts（需先 npm run dev）
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
  const sidebarItem = page
    .getByRole("button", { name: /流程推进图/ })
    .first();
  const sidebarVisible = await sidebarItem.isVisible().catch(() => false);
  report("manager 侧边栏出现「流程推进图」", sidebarVisible);

  // 2) 进入流程推进图
  if (sidebarVisible) {
    await sidebarItem.click();
    await page.waitForTimeout(1500);
  } else {
    await page.goto(BASE + "/manager?section=gantt", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
  }
  const title = await page
    .getByRole("heading", { name: "流程推进图" })
    .isVisible()
    .catch(() => false);
  const rowCount = await page.locator("button.sticky.left-0").count();
  const stageHeaders = await page
    .getByText("已验收")
    .first()
    .isVisible()
    .catch(() => false);
  const dateCells = await page
    .locator("span", { hasText: /20\d{2}\/\d{2}\/\d{2}/ })
    .count();
  const currentLegend = await page
    .getByText("当前环节 · 进行中")
    .first()
    .isVisible()
    .catch(() => false);
  report(
    "流程推进图渲染（标题/订单行/流程列表头/达成日期格/图例）",
    title && rowCount > 0 && stageHeaders && dateCells > 0 && currentLegend,
    `rows=${rowCount} dateCells=${dateCells}`,
  );

  // 3) 时间范围筛选已移除;状态分组切换不崩溃
  const rangeRemoved =
    (await page.getByRole("button", { name: "180天" }).count()) === 0;
  report("时间范围筛选已移除", rangeRemoved);
  const countBefore = await page
    .locator("text=/^共 /")
    .first()
    .innerText()
    .catch(() => "");
  await page.getByRole("button", { name: "已验收", exact: true }).click();
  await page.waitForTimeout(1000);
  const countAfter = await page
    .locator("text=/^共 /")
    .first()
    .innerText()
    .catch(() => "");
  const pageOk = await page
    .getByRole("heading", { name: "流程推进图" })
    .isVisible()
    .catch(() => false);
  report("状态分组切换（已验收）正常", pageOk, `count ${countBefore} → ${countAfter}`);
  await page.getByRole("button", { name: "全部", exact: true }).click();
  await page.waitForTimeout(800);

  // 4) 点击行首 → 打开订单卡浮层(订单详情/操作统一在卡内完成)
  const firstRow = page.locator("button.sticky.left-0").first();
  if (await firstRow.isVisible().catch(() => false)) {
    await firstRow.click();
    await page.waitForTimeout(1500);
    const dialog = page.getByRole("dialog", { name: /订单详情/ });
    const dialogVisible = (await dialog.count()) > 0 && (await dialog.isVisible());
    const url = page.url();
    report(
      "点击行首打开订单卡浮层(不再跳转)",
      dialogVisible && !url.includes("section=lookup"),
      `dialog=${dialogVisible} url=${url.slice(0, 60)}`,
    );
    if (dialogVisible) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(600);
    }
  } else {
    report("点击行首打开订单卡浮层(不再跳转)", false, "无可见行");
  }

  // 5) 回到流程推进图，验证空态（退单筛选可能为空则显示空态）
  await page.goto(BASE + "/manager?section=gantt", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "退单", exact: true }).click();
  await page.waitForTimeout(800);
  const emptyState = await page
    .locator("text=当前筛选下暂无订单")
    .isVisible()
    .catch(() => false);
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
