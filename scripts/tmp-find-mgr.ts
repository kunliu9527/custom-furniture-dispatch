import { chromium } from "playwright";

async function main() {
  const b = await chromium.launch({ headless: true, channel: "chrome" });
  const p = await b.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await p.goto("http://localhost:3000/");
  const info = await p.evaluate(async () => {
    const r = await fetch("/api/sync");
    const j = await r.json();
    const cfg = j.staffConfig || {};
    return {
      customStaff: cfg.customStaff,
      accessOverrides: cfg.accessOverrides,
      // try login as 刘坤 after hydrating client auth from local
    };
  });
  console.log(JSON.stringify(info, null, 2));

  // Try login 刘坤 / 1
  await p.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await p.reload({ waitUntil: "networkidle" });
  await p.getByRole("button", { name: "登录" }).first().click();
  await p.fill("input[name=username]", "刘坤");
  await p.fill("input[name=password]", "1");
  await p.getByRole("button", { name: "确认登录" }).click();
  await p.waitForTimeout(1500);
  console.log("after 刘坤 login url", p.url());
  console.log(
    "body snippet",
    (await p.locator("body").innerText()).slice(0, 400),
  );

  // If failed try admin then check staff UI names - or promote via overrides in evaluate
  await b.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
