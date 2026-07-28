/** 将 PDF 首页渲染为 JPEG data URL（浏览器端） */
export async function rasterizePdfFirstPage(
  file: File,
  options?: { maxEdge?: number; quality?: number },
): Promise<string> {
  const maxEdge = options?.maxEdge ?? 2000;
  const quality = options?.quality ?? 0.9;
  const data = await file.arrayBuffer();

  const pdfjs = await import("pdfjs-dist");
  // 使用 CDN worker，避免 Next 打包 worker 路径问题
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(maxEdge / base.width, maxEdge / base.height, 2.5);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建画布");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  }).promise;

  return canvas.toDataURL("image/jpeg", quality);
}
