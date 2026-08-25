/**
 * 多公司流程浏览器验证（本地 dev server + Chrome）：
 * 1. 未登录首页有「注册」入口
 * 2. 注册新公司 → 自动登录 → 看板门店仅本公司自定义门店
 * 3. admin 登录（默认公司）→ 公司切换器可用，可切到新公司
 *
 * 用法：npx tsx scripts/verify-companies-flow.ts（需先 npm run dev）
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

  const suffix = Date.now().toString(36).slice(-5);
  const companyName = `验证公司${suffix}`;
  const accountName = `王五${suffix}`;
  const password = "verify123";
  const store1 = `验证一店${suffix}`;
  const store2 = `验证二店${suffix}`;

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });

  // 1) 未登录首页注册入口
  const headerReg = await page
    .getByRole("link", { name: "注册" })
    .first()
    .isVisible()
    .catch(() => false);
  const landingReg = await page
    .getByRole("link", { name: /注册新公司/ })
    .isVisible()
    .catch(() => false);
  report("首页注册入口（头部按钮 + 落地 CTA）", headerReg && landingReg, `header=${headerReg} landing=${landingReg}`);
  await page.screenshot({ path: "scripts/verify-companies-flow/guest-home.png" }).catch(() => {});

  // 2) 注册新公司并自动登录
  await page.goto(BASE + "/register", { waitUntil: "networkidle" });
  await page.fill("input[name=companyName]", companyName);
  await page.fill("input[name=accountName]", accountName);
  await page.fill("input[name=password]", password);
  await page.fill("input[name=store-0]", store1);
  await page.getByRole("button", { name: "+ 添加门店" }).click();
  await page.fill("input[name=store-1]", store2);
  await page.getByRole("button", { name: "注册并进入" }).click();
  await page.waitForURL(BASE + "/", { timeout: 20000 });
  await page.waitForTimeout(2500);
  const nameShown = await page.locator(`text=${accountName}`).first().isVisible().catch(() => false);
  const companyShown = await page.locator(`text=${companyName}`).first().isVisible().catch(() => false);
  report("注册后自动登录（显示账号与公司名）", nameShown && companyShown, `name=${nameShown} company=${companyShown}`);
  await page.screenshot({ path: "scripts/verify-companies-flow/registered-home.png" }).catch(() => {});

  // 3) 新公司看板门店仅本公司自定义门店
  await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const storeOptions = await page
    .locator("select[name=dispatchStore] option")
    .allTextContents()
    .catch((): string[] => []);
  const hasOwnStore = storeOptions.includes(store1) && storeOptions.includes(store2);
  const hasDefaultStore = storeOptions.some((s) => s.includes("东岸天冠") || s.includes("东岸万象"));
  report(
    "新公司派单门店仅本公司自定义门店",
    hasOwnStore && !hasDefaultStore,
    JSON.stringify(storeOptions),
  );
  await page.screenshot({ path: "scripts/verify-companies-flow/new-company-admin.png" }).catch(() => {});

  // 4) 退出 → admin 登录（公司下拉默认=当前公司）
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "退出" }).first().click();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "登录" }).first().click();
  const loginCompanySelect = page.locator("select[name=companyId]");
  const companySelectVisible = await loginCompanySelect.isVisible().catch(() => false);
  const companyOptions = companySelectVisible
    ? await loginCompanySelect.locator("option").allTextContents()
    : [];
  report(
    "登录弹窗含「公司」下拉",
    companySelectVisible && companyOptions.includes("万象天冠"),
    JSON.stringify(companyOptions),
  );
  await page.fill("input[name=username]", "admin");
  await page.fill("input[name=password]", "003900");
  await page.getByRole("button", { name: "确认登录" }).click();
  await page.waitForTimeout(2500);
  const adminShown = await page.locator("text=管理员").first().isVisible().catch(() => false);
  report("admin 登录", adminShown);

  // 5) admin 公司切换器
  const switcher = page.locator("select[aria-label='切换公司']");
  const switcherVisible = await switcher.isVisible().catch(() => false);
  const switchOptions = switcherVisible
    ? await switcher.locator("option").allTextContents()
    : [];
  report(
    "admin 公司切换器（含万象天冠与新公司）",
    switcherVisible &&
      switchOptions.includes("万象天冠") &&
      switchOptions.some((t) => t.includes(companyName)),
    JSON.stringify(switchOptions),
  );

  // 6) admin 切换公司：先切到新公司再切回万象天冠，验证数据随之切换
  const defaultCompanyId = "wanxiang-tianguan";
  const switchResults: string[] = [];
  if (switcherVisible) {
    // 6a) 切到新公司
    await switcher.selectOption({ label: companyName });
    await page.waitForTimeout(3000);
    const afterSwitchNew = await switcher.inputValue().catch(() => "");
    const newCompanyShown = await page
      .locator(`header p`, { hasText: companyName })
      .isVisible()
      .catch(() => false);
    switchResults.push(`切到新公司: value=${afterSwitchNew.slice(0, 12)}… shown=${newCompanyShown}`);
    await page.screenshot({ path: "scripts/verify-companies-flow/admin-switched-new.png" }).catch(() => {});

    // 6b) 切回万象天冠
    await switcher.selectOption(defaultCompanyId);
    await page.waitForTimeout(3000);
    const afterBack = await switcher.inputValue().catch(() => "");
    const defaultShown = await page
      .locator(`header p`, { hasText: "万象天冠" })
      .isVisible()
      .catch(() => false);
    switchResults.push(`切回万象天冠: value=${afterBack.slice(0, 12)}… shown=${defaultShown}`);
    const adminHeader = await page.locator("header").innerText().catch(() => "");
    report(
      "admin 切换公司（切到新公司再切回）",
      afterSwitchNew !== defaultCompanyId &&
        newCompanyShown &&
        afterBack === defaultCompanyId &&
        defaultShown,
      switchResults.join(" | ") + ` | header=${adminHeader.slice(0, 120).replace(/\n/g, "/")}`,
    );
    await page.screenshot({ path: "scripts/verify-companies-flow/admin-switched.png" }).catch(() => {});
  } else {
    report("admin 切换公司（切换器不可见）", false, "switcher not visible");
  }

  await browser.close();
  console.log(`\n===== ${failed.length === 0 ? "全部通过" : `${failed.length} 项失败：${failed.join("、")}`} =====`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
