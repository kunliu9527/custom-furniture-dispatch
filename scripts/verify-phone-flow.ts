/**
 * 注册手机号 + admin 通知 浏览器验证（本地 dev server + Chrome）：
 * 1. 手机号格式错误 → 前端拦截
 * 2. 合法手机号注册成功并自动登录
 * 3. admin 首页出现「新公司注册提醒」（公司名 + 手机号）
 * 4. 标记已读 → 该条消失并持久化
 *
 * 用法：npx tsx scripts/verify-phone-flow.ts（需先 npm run dev）
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
  const companyName = `手机验证${suffix}`;
  const phone = `138${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });

  // 1) 手机号格式错误 → 前端拦截
  await page.goto(BASE + "/register", { waitUntil: "networkidle" });
  await page.fill("input[name=companyName]", companyName);
  await page.fill("input[name=accountName]", "周五");
  await page.fill("input[name=phone]", "123");
  await page.fill("input[name=password]", "pw123456");
  await page.fill("input[name=store-0]", "验证一店");
  await page.getByRole("button", { name: "注册并进入" }).click();
  await page.waitForTimeout(800);
  const clientErr = await page
    .locator("text=请输入有效的 11 位手机号码")
    .isVisible()
    .catch(() => false);
  const stayedOnRegister = page.url().includes("/register");
  report("手机号格式错误前端拦截（提示且不跳转）", clientErr && stayedOnRegister);

  // 2) 合法手机号注册成功并自动登录
  await page.fill("input[name=phone]", phone);
  await page.getByRole("button", { name: "注册并进入" }).click();
  await page.waitForURL(BASE + "/", { timeout: 20000 });
  await page.waitForTimeout(2500);
  const loggedIn = await page
    .locator("text=周五")
    .first()
    .isVisible()
    .catch(() => false);
  report("合法手机号注册成功并自动登录", loggedIn);

  // 3) admin 登录 → 首页出现「新公司注册提醒」（公司名 + 手机号）
  await page.getByRole("button", { name: "退出" }).first().click();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "登录" }).first().click();
  await page.fill("input[name=username]", "admin");
  await page.fill("input[name=password]", "003900");
  await page.getByRole("button", { name: "确认登录" }).click();
  await page.waitForTimeout(2500);
  const regBlock = await page
    .getByRole("heading", { name: "新公司注册提醒" })
    .isVisible()
    .catch(() => false);
  const li = page.locator("li", { hasText: companyName }).first();
  const liVisible = await li.isVisible().catch(() => false);
  const phoneShown = liVisible
    ? await li.locator(`text=${phone}`).first().isVisible().catch(() => false)
    : false;
  report(
    "admin 首页「新公司注册提醒」（公司名+手机号）",
    regBlock && liVisible && phoneShown,
  );

  // 4) 标记已读 → 该条消失并持久化
  await li.locator("button", { hasText: "标记已读" }).click();
  await page.waitForTimeout(800);
  const gone = !(await page
    .locator("li", { hasText: companyName })
    .first()
    .isVisible()
    .catch(() => false));
  const persisted = await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        k.startsWith("custom-furniture-dispatch-company-reg-dismissed")
      ) {
        return true;
      }
    }
    return false;
  });
  report("标记已读后该条消失并持久化", gone && persisted);

  await browser.close();
  console.log(
    `\n===== ${failed.length === 0 ? "全部通过" : `${failed.length} 项失败：${failed.join("、")}`} =====`,
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
