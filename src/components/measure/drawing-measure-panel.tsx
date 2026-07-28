"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  distance2d,
  formatMeasuredLength,
  scaleFromCalibration,
  type DrawingScale,
} from "@/lib/measure/drawing-scale";
import {
  collectSnapPoints,
  findNearestSegment,
  findSnapPoint,
  fitViewToBounds,
  resizeViewPreserveCenter,
  screenToWorld,
  worldToScreen,
  type SnapHit,
  type ViewTransform,
} from "@/lib/measure/drawing-geometry";
import {
  dxfToImagePoint,
  parseDxfSegments,
  rasterizeDxfSegments,
  type DxfParseResult,
} from "@/lib/measure/dxf-parse";
import { rasterizePdfFirstPage } from "@/lib/measure/pdf-rasterize";
import { compressImage, readFileAsDataUrl } from "@/lib/measure/compress";
import {
  annotationLabel,
  measureUid,
  type MeasureAnnotation,
  type MeasureUnit,
} from "@/lib/measure/types";
import {
  drawAnnotation,
  renderAnnotatedImage,
} from "@/lib/measure/canvas-draw";
import "../measure/measure-annotator.css";

/** 图纸模式：仅 CAD 测距（点选 / 两点 / 标定） */

type DrawingTool = "pick" | "measure" | "calibrate" | "pan";
type SourceKind = "dxf" | "raster";

const TOOLS: { id: DrawingTool; label: string }[] = [
  { id: "pick", label: "点选读长" },
  { id: "measure", label: "两点测距" },
  { id: "calibrate", label: "标定比例" },
  { id: "pan", label: "平移" },
];

interface DrawingMeasurePanelProps {
  disabled?: boolean;
  onSaveToArchive: (payload: {
    imageDataUrl: string;
    name: string;
    room: string;
    annotations: MeasureAnnotation[];
  }) => Promise<void> | void;
}

export function DrawingMeasurePanel({
  disabled,
  onSaveToArchive,
}: DrawingMeasurePanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [sourceKind, setSourceKind] = useState<SourceKind | null>(null);
  const [dxf, setDxf] = useState<DxfParseResult | null>(null);
  const [rasterUrl, setRasterUrl] = useState<string | null>(null);
  const rasterImgRef = useRef<HTMLImageElement | null>(null);
  const [rasterReady, setRasterReady] = useState(false);

  const [view, setView] = useState<ViewTransform | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  const [scale, setScale] = useState<DrawingScale>({
    mmPerUnit: 1,
    source: "manual",
  });
  const [mmPerUnitInput, setMmPerUnitInput] = useState("1");
  const [unit, setUnit] = useState<MeasureUnit>("mm");
  const [tool, setTool] = useState<DrawingTool>("pick");
  const [draftStart, setDraftStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [hoverWorld, setHoverWorld] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [snapHint, setSnapHint] = useState<SnapHit | null>(null);
  const [hoverSegIndex, setHoverSegIndex] = useState<number | null>(null);
  const [annotations, setAnnotations] = useState<MeasureAnnotation[]>([]);
  const [calibrateRealMm, setCalibrateRealMm] = useState("1000");
  const [saveBusy, setSaveBusy] = useState(false);
  const [hint, setHint] = useState(
    "导入 DXF 后可点选读长或两点测距；PDF/线稿请先标定",
  );

  const panRef = useRef<{
    active: boolean;
    lastX: number;
    lastY: number;
  }>({ active: false, lastX: 0, lastY: 0 });

  const snaps =
    sourceKind === "dxf" && dxf ? collectSnapPoints(dxf.segments) : [];

  const fitToView = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const w = Math.max(320, wrap.clientWidth);
    const h = Math.max(280, Math.min(520, Math.round(wrap.clientWidth * 0.62)));
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    if (sourceKind === "dxf" && dxf) {
      setView(fitViewToBounds(dxf.bounds, w, h, true, 36));
      return;
    }
    const img = rasterImgRef.current;
    if (sourceKind === "raster" && img) {
      setView(
        fitViewToBounds(
          {
            minX: 0,
            minY: 0,
            maxX: img.naturalWidth,
            maxY: img.naturalHeight,
          },
          w,
          h,
          false,
          24,
        ),
      );
    }
  }, [dxf, sourceKind]);

  const syncCanvasSize = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas || !sourceKind) return;
    const w = Math.max(320, wrap.clientWidth);
    const h = Math.max(280, Math.min(520, Math.round(wrap.clientWidth * 0.62)));
    const oldW = canvas.width;
    const oldH = canvas.height;
    if (oldW === w && oldH === h) return;

    const prev = viewRef.current;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    if (prev && oldW > 0 && oldH > 0) {
      setView(resizeViewPreserveCenter(prev, oldW, oldH, w, h));
      return;
    }
    if (sourceKind === "dxf" && dxf) {
      setView(fitViewToBounds(dxf.bounds, w, h, true, 36));
    } else if (sourceKind === "raster" && rasterImgRef.current) {
      const img = rasterImgRef.current;
      setView(
        fitViewToBounds(
          {
            minX: 0,
            minY: 0,
            maxX: img.naturalWidth,
            maxY: img.naturalHeight,
          },
          w,
          h,
          false,
          24,
        ),
      );
    }
  }, [dxf, sourceKind]);

  useEffect(() => {
    if (!rasterUrl) {
      rasterImgRef.current = null;
      setRasterReady(false);
      return;
    }
    setRasterReady(false);
    const img = new Image();
    img.onload = () => {
      rasterImgRef.current = img;
      setRasterReady(true);
    };
    img.onerror = () => {
      setError("图纸加载失败");
      setRasterReady(false);
    };
    img.src = rasterUrl;
  }, [rasterUrl]);

  useEffect(() => {
    if (sourceKind === "dxf" && dxf) fitToView();
    if (sourceKind === "raster" && rasterReady) fitToView();
  }, [sourceKind, dxf, rasterReady, fitToView]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => syncCanvasSize());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [syncCanvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const v = view;
    if (!canvas || !v || !sourceKind) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f7f5f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (sourceKind === "dxf" && dxf) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 0; i < dxf.segments.length; i += 1) {
        const s = dxf.segments[i];
        const a = worldToScreen({ x: s.x1, y: s.y1 }, v);
        const b = worldToScreen({ x: s.x2, y: s.y2 }, v);
        const hot = hoverSegIndex === i;
        ctx.strokeStyle = hot ? "#0f6b66" : "#1c1917";
        ctx.lineWidth = hot
          ? 2.8
          : Math.max(1, Math.min(2.2, v.scale * 0.015));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    } else if (sourceKind === "raster" && rasterImgRef.current) {
      const img = rasterImgRef.current;
      const tl = worldToScreen({ x: 0, y: 0 }, v);
      const br = worldToScreen(
        { x: img.naturalWidth, y: img.naturalHeight },
        v,
      );
      ctx.drawImage(img, tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    }

    for (const anno of annotations) {
      drawAnnotation(ctx, toScreenAnnotation(anno, v), 1, 1, false, false);
    }

    if (draftStart && hoverWorld) {
      const a = worldToScreen(draftStart, v);
      const b = worldToScreen(hoverWorld, v);
      ctx.save();
      ctx.strokeStyle = "#0f6b66";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
      const dist = distance2d(
        draftStart.x,
        draftStart.y,
        hoverWorld.x,
        hoverWorld.y,
      );
      const measured = formatMeasuredLength(dist, scale, unit);
      const label = `${measured.value}${measured.unit}`;
      ctx.font = "600 14px PingFang SC, Segoe UI, sans-serif";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.92)";
      ctx.fillStyle = "#0f6b66";
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2 - 10;
      ctx.strokeText(label, mx, my);
      ctx.fillText(label, mx, my);
      ctx.restore();
    }

    if (snapHint && (tool === "measure" || tool === "calibrate")) {
      const sp = worldToScreen(snapHint, v);
      ctx.save();
      ctx.strokeStyle = "#c2410c";
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 1.5;
      const r = 7;
      if (snapHint.kind === "endpoint") {
        ctx.beginPath();
        ctx.rect(sp.x - r, sp.y - r, r * 2, r * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y - r);
        ctx.lineTo(sp.x + r, sp.y);
        ctx.lineTo(sp.x, sp.y + r);
        ctx.lineTo(sp.x - r, sp.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [
    view,
    sourceKind,
    dxf,
    annotations,
    draftStart,
    hoverWorld,
    snapHint,
    hoverSegIndex,
    scale,
    unit,
    tool,
    rasterReady,
  ]);

  function canvasLocal(e: { clientX: number; clientY: number }) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function resolveWorld(
    screen: { x: number; y: number },
    withSnap: boolean,
  ): { world: { x: number; y: number }; snap: SnapHit | null } {
    const v = viewRef.current;
    if (!v) return { world: { x: 0, y: 0 }, snap: null };
    if (withSnap && sourceKind === "dxf" && snaps.length) {
      const hit = findSnapPoint(screen.x, screen.y, snaps, v, 16);
      if (hit) return { world: { x: hit.x, y: hit.y }, snap: hit };
    }
    return { world: screenToWorld(screen, v), snap: null };
  }

  function selectTool(next: DrawingTool) {
    setTool(next);
    setDraftStart(null);
    setHoverWorld(null);
    setSnapHint(null);
    setHoverSegIndex(null);
    const hints: Record<DrawingTool, string> = {
      pick: "点选读长：靠近线段单击，自动写入尺寸",
      measure: "两点测距：自动吸附端点/中点（DXF）",
      calibrate: "标定：点已知长度两端，再确认毫米数",
      pan: "平移：拖动画布；也可按住 Shift。滚轮缩放",
    };
    setHint(hints[next]);
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError("");
    setAnnotations([]);
    setDraftStart(null);
    setHoverWorld(null);
    setSnapHint(null);
    setHoverSegIndex(null);
    setDxf(null);
    setRasterUrl(null);
    setSourceKind(null);
    setView(null);
    try {
      const lower = file.name.toLowerCase();
      setFileName(file.name.replace(/\.[^.]+$/, "") || "图纸");
      if (lower.endsWith(".dxf")) {
        const text = await file.text();
        const parsed = parseDxfSegments(text);
        if (parsed.segments.length === 0) {
          throw new Error(
            "未解析到直线（LINE/LWPOLYLINE/POLYLINE）。请确认是 ASCII DXF。",
          );
        }
        setDxf(parsed);
        setSourceKind("dxf");
        const mm = parsed.mmPerUnit ?? 1;
        setScale({ mmPerUnit: mm, source: "manual" });
        setMmPerUnitInput(String(mm));
        setTool("pick");
        setHint(
          parsed.mmPerUnit != null
            ? `已导入 DXF（${parsed.segments.length} 段）。1 单位 = ${mm} mm。可点选读长或两点测距。`
            : `已导入 DXF（${parsed.segments.length} 段）。默认 1=1mm。可点选读长或两点测距。`,
        );
      } else if (lower.endsWith(".pdf")) {
        const dataUrl = await rasterizePdfFirstPage(file);
        setRasterUrl(dataUrl);
        setSourceKind("raster");
        setScale({ mmPerUnit: 1, source: "manual" });
        setMmPerUnitInput("1");
        setTool("calibrate");
        setHint("已导入 PDF。请先标定比例，再两点测距。");
      } else if (/\.(png|jpe?g|webp)$/i.test(lower)) {
        const raw = await readFileAsDataUrl(file);
        const dataUrl = await compressImage(raw, 2200, 0.9);
        setRasterUrl(dataUrl);
        setSourceKind("raster");
        setScale({ mmPerUnit: 1, source: "manual" });
        setMmPerUnitInput("1");
        setTool("calibrate");
        setHint("已导入线稿。请先标定比例，再两点测距。");
      } else {
        throw new Error("请上传 DXF、PDF 或 PNG/JPG 线稿图");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "导入失败");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function applyManualScale() {
    const n = Number(mmPerUnitInput);
    if (!Number.isFinite(n) || n <= 0) {
      setError("比例须为正数（图面 1 单位 = 多少毫米）");
      return;
    }
    setScale({ mmPerUnit: n, source: "manual" });
    setError("");
    setHint(`比例已设：图面 1 单位 = ${n} mm`);
  }

  function addCadDimension(x1: number, y1: number, x2: number, y2: number) {
    const dist = distance2d(x1, y1, x2, y2);
    if (dist < 1e-6) return;
    const measured = formatMeasuredLength(dist, scale, unit);
    setAnnotations((prev) => [
      ...prev,
      {
        kind: "dimension",
        id: measureUid(),
        x1,
        y1,
        x2,
        y2,
        value: measured.value,
        unit: measured.unit,
        note: "CAD",
        color: "#0f6b66",
      },
    ]);
    setHint(`已测 ${measured.value}${measured.unit}，可继续测距或保存到归档`);
  }

  function onPointerDown(e: ReactPointerEvent) {
    if (!viewRef.current || !sourceKind) return;
    const screen = canvasLocal(e);
    if (!screen) return;

    if (tool === "pan" || e.button === 1 || e.shiftKey) {
      panRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      return;
    }

    if (tool === "pick") {
      if (sourceKind !== "dxf" || !dxf) {
        setError("点选读长仅支持 DXF；PDF/图片请用两点测距");
        return;
      }
      const hit = findNearestSegment(
        screen.x,
        screen.y,
        dxf.segments,
        viewRef.current,
        14,
      );
      if (!hit) {
        setHint("未点到线段，请靠近墙线/轮廓线再点");
        return;
      }
      const s = hit.segment;
      addCadDimension(s.x1, s.y1, s.x2, s.y2);
      return;
    }

    if (tool === "measure" || tool === "calibrate") {
      const { world, snap } = resolveWorld(screen, true);
      setSnapHint(snap);
      if (!draftStart) {
        setDraftStart(world);
        setHoverWorld(world);
        setHint(
          tool === "calibrate"
            ? "再点终点，然后确认标定毫米数"
            : snap
              ? `已吸附${snap.kind === "endpoint" ? "端点" : "中点"}，再点终点`
              : "再点终点完成测距",
        );
        return;
      }

      const dist = distance2d(draftStart.x, draftStart.y, world.x, world.y);
      if (dist < 1e-6) {
        setDraftStart(null);
        setHoverWorld(null);
        return;
      }

      if (tool === "calibrate") {
        const real = Number(calibrateRealMm);
        const next = scaleFromCalibration(dist, real);
        if (!next) {
          setError("请填写有效的实际长度（毫米）");
          return;
        }
        setScale(next);
        setMmPerUnitInput(String(Number(next.mmPerUnit.toPrecision(6))));
        setDraftStart(null);
        setHoverWorld(null);
        setSnapHint(null);
        setTool(sourceKind === "dxf" ? "pick" : "measure");
        setHint(
          `标定完成：图面 ${dist.toFixed(2)} → ${real} mm（1≈${next.mmPerUnit.toFixed(4)} mm）`,
        );
        setError("");
        return;
      }

      addCadDimension(draftStart.x, draftStart.y, world.x, world.y);
      setDraftStart(null);
      setHoverWorld(null);
      setSnapHint(null);
    }
  }

  function onPointerMove(e: ReactPointerEvent) {
    const v = viewRef.current;
    if (!v) return;

    if (panRef.current.active) {
      const dx = e.clientX - panRef.current.lastX;
      const dy = e.clientY - panRef.current.lastY;
      panRef.current.lastX = e.clientX;
      panRef.current.lastY = e.clientY;
      setView((prev) =>
        prev
          ? { ...prev, offsetX: prev.offsetX + dx, offsetY: prev.offsetY + dy }
          : prev,
      );
      return;
    }

    const screen = canvasLocal(e);
    if (!screen) return;

    if (tool === "pick" && sourceKind === "dxf" && dxf) {
      const hit = findNearestSegment(
        screen.x,
        screen.y,
        dxf.segments,
        v,
        14,
      );
      setHoverSegIndex(hit?.index ?? null);
      return;
    }

    if (tool === "measure" || tool === "calibrate") {
      const { world, snap } = resolveWorld(screen, true);
      setSnapHint(snap);
      if (draftStart) setHoverWorld(world);
    }
  }

  function onPointerUp(e: ReactPointerEvent) {
    if (panRef.current.active) {
      panRef.current.active = false;
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onNativeWheel = (ev: WheelEvent) => {
      const v = viewRef.current;
      if (!v) return;
      ev.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const screen = {
        x: ((ev.clientX - rect.left) / rect.width) * canvas.width,
        y: ((ev.clientY - rect.top) / rect.height) * canvas.height,
      };
      const factor = ev.deltaY > 0 ? 0.9 : 1.1;
      const nextScale = Math.min(80, Math.max(0.02, v.scale * factor));
      const world = screenToWorld(screen, v);
      setView({
        ...v,
        scale: nextScale,
        offsetX: screen.x - world.x * nextScale,
        offsetY: v.flipY
          ? screen.y + world.y * nextScale
          : screen.y - world.y * nextScale,
      });
    };
    canvas.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onNativeWheel);
  }, [sourceKind]);

  async function handleSaveArchive() {
    if (annotations.length === 0) {
      setError("请先完成至少一次测距再保存");
      return;
    }
    setSaveBusy(true);
    setError("");
    try {
      let baseImage: string;
      let exportAnnos: MeasureAnnotation[];

      if (sourceKind === "dxf" && dxf) {
        baseImage = rasterizeDxfSegments(dxf);
        exportAnnos = annotations.map((a) => mapWorldAnnoToDxfImage(a, dxf));
      } else if (rasterUrl) {
        baseImage = rasterUrl;
        exportAnnos = annotations;
      } else {
        throw new Error("没有可保存的图纸");
      }

      const withAnno = await renderAnnotatedImage(baseImage, exportAnnos);
      await onSaveToArchive({
        imageDataUrl: withAnno,
        name: fileName || "图纸量尺",
        room: "图纸",
        annotations: exportAnnos,
      });
      setHint("已保存到测量结果归档");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaveBusy(false);
    }
  }

  const loaded = Boolean(sourceKind && view);

  return (
    <div className="measure-root space-y-3 rounded-xl border border-teal-100 bg-[#fffdfb] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-teal-900">图纸模式</p>
          <p className="text-xs text-stone-500">
            DXF 点选读长 / 两点测距；PDF、线稿先标定再测
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".dxf,.pdf,image/png,image/jpeg,image/webp,.png,.jpg,.jpeg"
            className="sr-only"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={disabled || busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? "导入中…" : "导入图纸"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!loaded}
            onClick={fitToView}
          >
            适应窗口
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={
              disabled || saveBusy || !loaded || annotations.length === 0
            }
            onClick={() => void handleSaveArchive()}
          >
            {saveBusy ? "保存中…" : "保存到归档"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-stone-500">图面 1 单位 = 毫米</span>
          <input
            className="w-28 rounded-lg border border-stone-200 px-2 py-1.5"
            value={mmPerUnitInput}
            onChange={(e) => setMmPerUnitInput(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!loaded}
          onClick={applyManualScale}
        >
          应用比例
        </button>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-stone-500">标定已知长度 (mm)</span>
          <input
            className="w-28 rounded-lg border border-stone-200 px-2 py-1.5"
            value={calibrateRealMm}
            onChange={(e) => setCalibrateRealMm(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <div className="tool-group">
          {(["mm", "cm", "m"] as MeasureUnit[]).map((u) => (
            <button
              key={u}
              type="button"
              className={`chip ${unit === u ? "active" : ""}`}
              onClick={() => setUnit(u)}
            >
              {u}
            </button>
          ))}
        </div>
        <div className="tool-group">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${tool === t.id ? "active" : ""}`}
              disabled={!loaded || (t.id === "pick" && sourceKind !== "dxf")}
              onClick={() => selectTool(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <p className="hint m-0">{hint}</p>
      {error ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      ) : null}

      <div
        className="canvas-wrap relative overflow-hidden rounded-lg border border-stone-200 bg-[#f7f5f0]"
        ref={wrapRef}
      >
        {!loaded ? (
          <p className="px-4 py-10 text-center text-sm text-stone-500">
            支持 ASCII DXF（推荐）、PDF 首页、PNG/JPG 线稿。
            <br />
            点选线段或两点测距，读出 CAD 尺寸后保存到归档。
          </p>
        ) : null}
        <canvas
          ref={canvasRef}
          className="measure-canvas block max-w-full touch-none"
          style={{
            cursor:
              tool === "pan" ? "grab" : loaded ? "crosshair" : "default",
            display: loaded ? "block" : "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
      </div>

      {annotations.length > 0 ? (
        <ul className="space-y-1 text-sm text-stone-700">
          {annotations.map((a, i) => (
            <li key={a.id} className="flex items-center justify-between gap-2">
              <span>
                #{i + 1} {annotationLabel(a)}
              </span>
              <button
                type="button"
                className="text-xs text-red-700 hover:underline"
                onClick={() =>
                  setAnnotations((prev) => prev.filter((x) => x.id !== a.id))
                }
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function toScreenAnnotation(
  a: MeasureAnnotation,
  view: ViewTransform,
): MeasureAnnotation {
  switch (a.kind) {
    case "dimension":
    case "arrow": {
      const p1 = worldToScreen({ x: a.x1, y: a.y1 }, view);
      const p2 = worldToScreen({ x: a.x2, y: a.y2 }, view);
      return { ...a, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    }
    case "text": {
      const p = worldToScreen({ x: a.x, y: a.y }, view);
      return { ...a, x: p.x, y: p.y };
    }
    case "pen":
      return {
        ...a,
        width: a.width * view.scale,
        points: a.points.map((pt) => worldToScreen(pt, view)),
      };
  }
}

function mapWorldAnnoToDxfImage(
  a: MeasureAnnotation,
  dxf: DxfParseResult,
): MeasureAnnotation {
  switch (a.kind) {
    case "dimension":
    case "arrow": {
      const p1 = dxfToImagePoint(dxf, a.x1, a.y1);
      const p2 = dxfToImagePoint(dxf, a.x2, a.y2);
      return { ...a, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    }
    case "text": {
      const p = dxfToImagePoint(dxf, a.x, a.y);
      return { ...a, x: p.x, y: p.y };
    }
    case "pen": {
      const { bounds } = dxf;
      const w = Math.max(1, bounds.maxX - bounds.minX);
      const h = Math.max(1, bounds.maxY - bounds.minY);
      const s = Math.min(2000 / w, 2000 / h);
      return {
        ...a,
        width: Math.max(2, a.width * s),
        points: a.points.map((pt) => dxfToImagePoint(dxf, pt.x, pt.y)),
      };
    }
  }
}
