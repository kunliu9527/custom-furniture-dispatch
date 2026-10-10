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

/** 校验「本期已下单量」已改为节点口径：本月 / 上月 两个周期各读一次 */
async function main() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1300 } });

  await loginAs(page, "admin", "003900");
  await page.goto(BASE + "/evaluation", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const reportsNav = page.getByRole("button", { name: /全局报告/ }).first();
  if (await reportsNav.isVisible().catch(() => false)) {
    await reportsNav.click();
    await page.waitForTimeout(800);
  }
  const monthlyTab = page.getByRole("tab", { name: /本月/ }).first();
  if (await monthlyTab.isVisible().catch(() => false)) {
    await monthlyTab.click();
    await page.waitForTimeout(1600);
  }

  const readKpi = async (label: string) => {
    const card = page.locator("div", { hasText: new RegExp(`^${label}$`) }).last();
    void card;
    const cell = page
      .locator("div")
      .filter({ has: page.getByText(label, { exact: true }) })
      .last();
    const text = await cell.innerText().catch(() => "");
    const lines = text.split("\n").filter(Boolean);
    const idx = lines.findIndex((l) => l.trim() === label);
    const value = idx >= 0 ? lines[idx + 1] : "";
    console.log(`[kpi] ${label} = ${value}`);
    return value;
  };

  for (const preset of ["本月", "上月"]) {
    const chip = page.getByRole("button", { name: preset, exact: true }).first();
    if (!(await chip.isVisible().catch(() => false))) {
      console.log(`[kpi] 未找到周期按钮 ${preset}`);
      continue;
    }
    await chip.click();
    await page.waitForTimeout(1800);
    const period = await page
      .getByText(/统计周期：/)
      .first()
      .innerText()
      .catch(() => "");
    console.log(`\n──── ${preset} · ${period.split("\n")[0]} ────`);
    await readKpi("本期已下单量");
    await readKpi("本期安装");
    await readKpi("本期验收");
    await page.screenshot({
      path: `scripts/monthly-kpi-${preset === "本月" ? "this" : "prev"}.png`,
      fullPage: true,
    });
  }

  // 全部汇总简报：累计已下单不应因老单缺节点而凭空少掉
  const allTab = page.getByRole("tab", { name: /汇总简报/ }).first();
  if (await allTab.isVisible().catch(() => false)) {
    await allTab.click();
    await page.waitForTimeout(1800);
    console.log("\n──── 汇总简报（全部） ────");
    await readKpi("累计已下单量");
    await readKpi("累计退单量");
    await page.screenshot({ path: "scripts/monthly-kpi-all.png", fullPage: true });
  } else {
    console.log("\n[kpi] 未找到「汇总简报」tab");
  }

  await browser.close();
}

void main();
