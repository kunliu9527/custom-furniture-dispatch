import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

async function loginAs(page: import("playwright").Page, username: string, password: string) {
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
  await page.waitForTimeout(1000);
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
  const cases: Array<[string, string, string]> = [
    ["admin", "admin", "003900"],
    ["liukun", "刘坤", "2"],
  ];

  for (const [tag, username, password] of cases) {
    await loginAs(page, username, password);
    await page.goto(BASE + "/manager", { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const hasBrief = await page
      .getByText(/设计简报/)
      .first()
      .isVisible()
      .catch(() => false);
    console.log(`[${tag}] /manager 设计简报可见=${hasBrief}`);
    if (hasBrief) {
      const block = page.locator("section", { hasText: /设计简报/ }).last();
      const text = (await block.innerText()).split("\n").slice(0, 24).join("\n");
      console.log(text);
    }
    await page.screenshot({ path: `scripts/brief-${tag}.png`, fullPage: true });
  }

  await browser.close();
}

void main();
