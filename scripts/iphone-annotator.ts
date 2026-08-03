import { chromium, devices } from "playwright";

async function main() {
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
  await p.waitForTimeout(600);
  await p.getByRole("button", { name: /易测量/ }).click();
  await p.waitForTimeout(2000);

  // photo rows are buttons containing measure- in text
  const photoBtn = p.locator("button").filter({ hasText: /measure-/ }).first();
  console.log("photoBtn", await photoBtn.count());
  if (await photoBtn.count()) {
    await photoBtn.click();
    await p.waitForTimeout(2500);
  }

  await p.screenshot({
    path: "scripts/iphone-audit/12-annotator.png",
    fullPage: false,
  });

  const info = await p.evaluate(() => {
    const root = document.querySelector(".measure-root") as HTMLElement | null;
    const wrap = root?.querySelector(".canvas-wrap") as HTMLElement | null;
    const canvas = root?.querySelector("canvas") as HTMLCanvasElement | null;
    const toolbar = root?.querySelector(".toolbar") as HTMLElement | null;
    const fixed = document.querySelector(".fixed.inset-0") as HTMLElement | null;
    return {
      hasCanvas: !!canvas,
      vh: innerWidth + "x" + innerHeight,
      fixedH: fixed?.clientHeight,
      rootH: root?.clientHeight,
      rootSH: root?.scrollHeight,
      wrapH: wrap?.clientHeight,
      wrapMaxH: wrap ? getComputedStyle(wrap).maxHeight : null,
      canvasW: canvas?.width,
      canvasCss: canvas
        ? { w: canvas.clientWidth, h: canvas.clientHeight }
        : null,
      toolbarH: toolbar?.clientHeight,
      toolbarOverflow: toolbar
        ? toolbar.scrollWidth > toolbar.clientWidth + 4
        : null,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await b.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
