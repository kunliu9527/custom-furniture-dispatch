import { chromium, devices } from "playwright";
import { mkdirSync } from "fs";

async function main() {
  mkdirSync("scripts/iphone-audit", { recursive: true });
  const b = await chromium.launch({ headless: true, channel: "chrome" });
  const c = await b.newContext({ ...devices["iPhone 13"] });
  const p = await c.newPage();
  await p.goto("http://localhost:3000/");
  await p.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await p.reload({ waitUntil: "networkidle" });
  await p.getByRole("button", { name: "登录" }).first().click();
  await p.fill("input[name=username]", "汤雷");
  await p.fill("input[name=password]", "1");
  await p.getByRole("button", { name: "确认登录" }).click();
  await p.waitForTimeout(1000);
  await p.goto("http://localhost:3000/designer", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await p.getByRole("button", { name: /^已量尺/ }).first().click();
  await p.waitForTimeout(500);
  await p.getByRole("button", { name: /易测量/ }).click();
  await p.waitForTimeout(1500);

  const overlay = await p.evaluate(() => {
    const el = document.querySelector(".fixed.inset-0.z-\\[200\\], .fixed.inset-0") as HTMLElement | null;
    const allFixed = Array.from(document.querySelectorAll(".fixed")).map((n) => ({
      z: getComputedStyle(n).zIndex,
      parent: n.parentElement?.tagName,
      inBody: n.parentElement === document.body,
      h: (n as HTMLElement).clientHeight,
      w: (n as HTMLElement).clientWidth,
    }));
    const navVisible = !!document.querySelector(".vi-nav-segment");
    const navRect = document.querySelector(".vi-nav-segment")?.getBoundingClientRect();
    return {
      vh: innerHeight,
      vw: innerWidth,
      allFixed,
      navVisible,
      navTop: navRect?.top,
    };
  });
  console.log(JSON.stringify(overlay, null, 2));

  // Inject a fake editing state isn't easy; screenshot picker fullscreen
  await p.screenshot({
    path: "scripts/iphone-audit/20-measure-portal.png",
    fullPage: false,
  });

  // Check picker covers full height
  const cover = overlay.allFixed.find((f) => f.inBody && Number(f.z) >= 200);
  if (!cover || cover.h < overlay.vh - 20) {
    console.error("ASSERT_FAIL portal not full viewport");
    process.exit(1);
  }
  console.log("ASSERT_OK");
  await b.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
