import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

async function loginAs(
  page: import("playwright").Page,
  username: string,
  password: string,
) {
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  const loginBtn = page.getByRole("button", { name: "登录" }).first();
  if (await loginBtn.isVisible().catch(() => false)) await loginBtn.click();
  await page.waitForSelector('input[name="username"]', { timeout: 8000 });
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: "确认登录" }).click();
  await page.waitForTimeout(1200);
}

/**
 * 月报 / 人员管理（离职标签）UI 预览截图。
 * 月报入口：/evaluation → 侧栏「全局报告」→ tab「本月全局简报」。
 */
async function main() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
  // 离职/复职会弹 window.confirm，Playwright 默认自动取消 → 显式接受
  page.on("dialog", (dialog) => void dialog.accept());
  // 默认无已离职人员时，截图前临时标注一位，结束后自动复职
  let resignToggledName = "";

  try {
    await loginAs(page, "admin", "003900");

    // ── 本月简报（含 ⑤ 关注订单）──
    await page.goto(BASE + "/evaluation", { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    const reportsNav = page.getByRole("button", { name: /全局报告/ }).first();
    if (await reportsNav.isVisible().catch(() => false)) {
      await reportsNav.click();
      await page.waitForTimeout(800);
    } else {
      console.log("[monthly] 未找到侧栏「全局报告」入口");
    }

    const monthlyTab = page.getByRole("tab", { name: /本月/ }).first();
    if (await monthlyTab.isVisible().catch(() => false)) {
      await monthlyTab.click();
      await page.waitForTimeout(1800);
    } else {
      console.log("[monthly] 未找到「本月…简报」tab");
    }

    const watchHeading = page.getByText(/关注订单/).first();
    const watchVisible = await watchHeading.isVisible().catch(() => false);
    console.log(`[monthly] 关注订单区块可见=${watchVisible}`);

    if (watchVisible) {
      const block = page.locator("section", { hasText: /关注订单/ }).last();
      const lines = (await block.innerText()).split("\n");
      console.log(`[monthly] 关注订单区块行数=${lines.length}`);
      console.log("[monthly] 关注订单前 12 行:\n" + lines.slice(0, 12).join("\n"));
    }
    await page.screenshot({ path: "scripts/monthly-admin.png", fullPage: true });

    // ── 月报总览 KPI（在途合计 / 存量合计）：数据板块 → 设计师绩效报告 + 本月 ──
    const designerTab = page.getByRole("button", { name: /设计师数据/ }).first();
    if (await designerTab.isVisible().catch(() => false)) {
      await designerTab.click();
      await page.waitForTimeout(1200);
    } else {
      console.log("[kpi] 未找到「设计师数据」板块入口");
    }
    const performanceNav = page
      .getByRole("button", { name: /设计师绩效报告/ })
      .first();
    if (await performanceNav.isVisible().catch(() => false)) {
      await performanceNav.click();
      await page.waitForTimeout(1200);
    } else {
      console.log("[kpi] 未找到「设计师绩效报告」子视图");
    }
    const monthChip = page.getByRole("button", { name: "本月", exact: true }).first();
    if (await monthChip.isVisible().catch(() => false)) {
      await monthChip.click();
      await page.waitForTimeout(1800);
    } else {
      console.log("[kpi] 未找到周期「本月」按钮");
    }

    const overviewCard = page.locator("div", { hasText: /· 总览/ }).last();
    const inProgressTotal = await page
      .getByText("在途合计", { exact: true })
      .first()
      .isVisible()
      .catch(() => false);
    const stockTotal = await page
      .getByText("存量合计", { exact: true })
      .first()
      .isVisible()
      .catch(() => false);
    console.log(
      `[kpi] 在途合计可见=${inProgressTotal} 存量合计可见=${stockTotal}`,
    );
    if (inProgressTotal) {
      const lines = (await overviewCard.innerText().catch(() => "")).split("\n");
      const idx = lines.findIndex((l) => l.includes("总览"));
      console.log(
        "[kpi] 总览 KPI:\n" +
          lines.slice(idx, idx + 18).join(" | "),
      );
    }
    await page.screenshot({
      path: "scripts/monthly-overview-admin.png",
      fullPage: true,
    });

    // ── 人员管理（状态列 + 离职/复职）──
    await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    const staffNav = page.getByRole("button", { name: /人员管理/ }).first();
    if (await staffNav.isVisible().catch(() => false)) {
      await staffNav.click();
      await page.waitForTimeout(1200);
    } else {
      console.log("[admin] 未找到侧栏「人员管理」入口");
    }

    const staffTable = page.locator("#staff-roster-table");
    let hasStaffTable = await staffTable.isVisible().catch(() => false);
    if (!hasStaffTable) {
      // 兜底：用「状态」表头定位
      hasStaffTable = await page
        .getByRole("columnheader", { name: "状态" })
        .first()
        .isVisible()
        .catch(() => false);
    }
    console.log(`[admin] 人员名册表可见=${hasStaffTable}`);

    const markBtn = page.getByRole("button", { name: "标记离职" }).first();
    const markVisible = await markBtn.isVisible().catch(() => false);
    console.log(`[admin] 状态列「标记离职」按钮可见=${markVisible}`);

    if (markVisible) {
      const row = markBtn.locator("xpath=ancestor::tr[1]");
      resignToggledName = (
        await row.locator("td").first().innerText().catch(() => "")
      )
        .split("\n")[0]
        .trim();
      await markBtn.click();
      await page.waitForTimeout(2200);
      const resignedBadgeVisible = await page
        .getByText("已离职", { exact: true })
        .first()
        .isVisible()
        .catch(() => false);
      const restoreBtn = page.getByRole("button", { name: "复职" }).first();
      console.log(
        `[admin] 临时标注离职=${resignToggledName || "?"} 已离职徽标可见=${resignedBadgeVisible} 复职按钮可见=${await restoreBtn.isVisible().catch(() => false)}`,
      );
      if (!resignedBadgeVisible) resignToggledName = "";
      await staffTable.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(400);
    }
    await page.screenshot({
      path: "scripts/staff-resign-admin.png",
      fullPage: true,
    });
  } finally {
    // 复原：把临时标注离职的人复职，避免污染本地数据
    if (resignToggledName) {
      const restore = page.getByRole("button", { name: "复职" }).first();
      if (await restore.isVisible().catch(() => false)) {
        await restore.click();
        await page.waitForTimeout(1800);
      }
      const stillResigned = await page
        .getByText("已离职")
        .first()
        .isVisible()
        .catch(() => false);
      console.log(`[admin] 复职复原完成，页面仍有「已离职」=${stillResigned}`);
    }
    await browser.close();
  }
}

void main();
