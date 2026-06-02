/** 截取可横向滚动的版面（含脚注），触发本地下载 PNG */
export async function captureAndDownloadBoardSnapshot(
  root: HTMLElement,
  label: string,
): Promise<void> {
  const scroll =
    root.querySelector<HTMLElement>("[data-board-snapshot-scroll]") ?? root;
  const table = root.querySelector("table");
  const target = table ?? scroll;

  const restores: Array<{
    el: HTMLElement;
    overflow: string;
    width: string;
    maxWidth: string;
    maxHeight: string;
  }> = [];

  for (const el of [scroll, root]) {
    restores.push({
      el,
      overflow: el.style.overflow,
      width: el.style.width,
      maxWidth: el.style.maxWidth,
      maxHeight: el.style.maxHeight,
    });
    el.style.overflow = "visible";
    el.style.maxHeight = "none";
    el.style.maxWidth = "none";
    el.style.width = `${Math.max(el.scrollWidth, target.scrollWidth)}px`;
  }

  await new Promise<void>((r) =>
    requestAnimationFrame(() => requestAnimationFrame(() => r())),
  );

  const width = Math.ceil(
    Math.max(target.scrollWidth, target.clientWidth, scroll.scrollWidth),
  );
  const height = Math.ceil(
    Math.max(target.scrollHeight, target.clientHeight, root.scrollHeight),
  );

  try {
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(target, {
      pixelRatio: Math.min(2, window.devicePixelRatio || 1),
      width,
      height,
      cacheBust: true,
      backgroundColor: "#ffffff",
    });
    const blob = await (await fetch(dataUrl)).blob();
    const safeName = label.replace(/[^\w\u4e00-\u9fff.-]+/g, "_") || "board";
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${safeName}-${stamp}.png`;
    link.click();
    URL.revokeObjectURL(link.href);
  } finally {
    for (const r of restores) {
      r.el.style.overflow = r.overflow;
      r.el.style.width = r.width;
      r.el.style.maxWidth = r.maxWidth;
      r.el.style.maxHeight = r.maxHeight;
    }
  }
}
