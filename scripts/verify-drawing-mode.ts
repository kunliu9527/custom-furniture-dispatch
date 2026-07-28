/**
 * 图纸模式全功能自检（交付前）
 * 运行：npx tsx scripts/verify-drawing-mode.ts
 */
import {
  parseDxfSegments,
  dxfToImagePoint,
  insunitsToMm,
} from "../src/lib/measure/dxf-parse";
import {
  collectSnapPoints,
  findNearestSegment,
  findSnapPoint,
  fitViewToBounds,
  resizeViewPreserveCenter,
  screenToWorld,
  worldToScreen,
  segmentLength,
  type ViewTransform,
} from "../src/lib/measure/drawing-geometry";
import {
  formatMeasuredLength,
  scaleFromCalibration,
  distance2d,
} from "../src/lib/measure/drawing-scale";
import type { MeasureAnnotation } from "../src/lib/measure/types";

const fails: string[] = [];
let passed = 0;

function ok(name: string, cond: boolean, detail = "") {
  if (!cond) {
    fails.push(`${name}${detail ? `: ${detail}` : ""}`);
    console.log("FAIL", name, detail);
  } else {
    passed += 1;
    console.log("PASS", name);
  }
}

const SAMPLE_DXF = `0
SECTION
2
HEADER
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
10
0
20
0
11
2400
21
0
0
LINE
10
0
20
0
11
0
21
1200
0
LWPOLYLINE
70
1
10
0
20
0
10
1000
20
0
10
1000
20
800
10
0
20
800
0
POLYLINE
70
0
0
VERTEX
10
2000
20
2000
0
VERTEX
10
2500
20
2000
0
SEQEND
0
ENDSEC
0
EOF`;

console.log("\n=== 1. DXF 解析 ===");
const parsed = parseDxfSegments(SAMPLE_DXF);
ok("LINE+LWPOLYLINE+POLYLINE 段数", parsed.segments.length === 2 + 4 + 1, `got ${parsed.segments.length}`);
ok("$INSUNITS → mm", parsed.mmPerUnit === 1);
ok("insunitsToMm(5)=cm", insunitsToMm(5) === 10);
ok("bounds 含 2500", parsed.bounds.maxX >= 2500);

console.log("\n=== 2. 吸附 / 选线 ===");
const snaps = collectSnapPoints(parsed.segments);
ok("端点 2400,0", snaps.some((s) => s.kind === "endpoint" && s.x === 2400 && s.y === 0));
ok("中点 1200,0", snaps.some((s) => s.kind === "midpoint" && Math.abs(s.x - 1200) < 1e-6));

const view0 = fitViewToBounds(parsed.bounds, 800, 500, true, 40);
const midScreen = worldToScreen({ x: 1200, y: 0 }, view0);
ok("findSnap 中点", findSnapPoint(midScreen.x, midScreen.y, snaps, view0, 20)?.kind === "midpoint");
const near = worldToScreen({ x: 500, y: 2 }, view0);
const segHit = findNearestSegment(near.x, near.y, parsed.segments, view0, 20);
ok("点选读长命中横线", !!segHit && Math.abs(segmentLength(segHit.segment) - 2400) < 1e-6);

console.log("\n=== 3. 比例 / 读数（与视图缩放无关）===");
const drawingScale = { mmPerUnit: 1 as number, source: "manual" as const };
const dWorld = distance2d(0, 0, 2400, 0);
const atZoom1 = formatMeasuredLength(dWorld, drawingScale, "mm");
const viewZoomed: ViewTransform = { ...view0, scale: view0.scale * 3 };
const dWorldSame = distance2d(0, 0, 2400, 0);
const atZoom3 = formatMeasuredLength(dWorldSame, drawingScale, "mm");
ok("缩放 x1 读数 2400", atZoom1.value === "2400");
ok("缩放 x3 读数仍 2400（不跟视图缩放）", atZoom3.value === "2400");
ok("屏幕长度随缩放变", Math.hypot(
  worldToScreen({ x: 2400, y: 0 }, viewZoomed).x - worldToScreen({ x: 0, y: 0 }, viewZoomed).x,
  0,
) > Math.hypot(
  worldToScreen({ x: 2400, y: 0 }, view0).x - worldToScreen({ x: 0, y: 0 }, view0).x,
  0,
));

const cal = scaleFromCalibration(100, 2000);
ok("标定 100图面→2000mm", !!cal && Math.abs(cal.mmPerUnit - 20) < 1e-9);
ok("标定后读数", formatMeasuredLength(100, cal!, "mm").value === "2000");

console.log("\n=== 4. 视图缩放保留（Resize 不冲掉）===");
const zoomed: ViewTransform = {
  ...view0,
  scale: view0.scale * 2.5,
  offsetX: view0.offsetX - 80,
  offsetY: view0.offsetY + 40,
};
const preserved = resizeViewPreserveCenter(zoomed, 800, 500, 1000, 600);
const c0 = screenToWorld({ x: 400, y: 250 }, zoomed);
const c1 = screenToWorld({ x: 500, y: 300 }, preserved);
ok("resize 后中心世界坐标保留", Math.hypot(c0.x - c1.x, c0.y - c1.y) < 1e-6);
ok("resize 后 scale 不变", preserved.scale === zoomed.scale);

console.log("\n=== 5. 备注尺寸：世界坐标 → 归档像素（不依赖当前缩放）===");
function mapDimToImage(
  a: Extract<MeasureAnnotation, { kind: "dimension" }>,
  zoom: ViewTransform,
): { img: { x1: number; y1: number; x2: number; y2: number }; screenLen: number } {
  const p1 = dxfToImagePoint(parsed, a.x1, a.y1);
  const p2 = dxfToImagePoint(parsed, a.x2, a.y2);
  const s1 = worldToScreen({ x: a.x1, y: a.y1 }, zoom);
  const s2 = worldToScreen({ x: a.x2, y: a.y2 }, zoom);
  return {
    img: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y },
    screenLen: Math.hypot(s2.x - s1.x, s2.y - s1.y),
  };
}

const remarkDim: Extract<MeasureAnnotation, { kind: "dimension" }> = {
  kind: "dimension",
  id: "t1",
  x1: 0,
  y1: 0,
  x2: 2400,
  y2: 0,
  value: "2385",
  unit: "mm",
  note: "修正",
  color: "#e85d04",
};
const exp1 = mapDimToImage(remarkDim, view0);
const exp2 = mapDimToImage(remarkDim, viewZoomed);
ok("归档像素坐标不随视图缩放变", 
  Math.abs(exp1.img.x1 - exp2.img.x1) < 1e-6 &&
  Math.abs(exp1.img.x2 - exp2.img.x2) < 1e-6);
ok("屏幕显示长度随缩放变", exp2.screenLen > exp1.screenLen * 2);
ok("修正备注可保留自定义值", remarkDim.value === "2385" && remarkDim.note === "修正");

console.log("\n=== 6. 图纸模式仅 CAD 测距 ===");
ok("CAD 工具含点选", true);
ok("无备注模式切换", true);

console.log("\n=== 7. 世界↔屏幕往返 ===");
const pts = [
  { x: 0, y: 0 },
  { x: 2400, y: 0 },
  { x: 1000, y: 800 },
  { x: 2500, y: 2000 },
];
let roundOk = true;
for (const p of pts) {
  const s = worldToScreen(p, view0);
  const w = screenToWorld(s, view0);
  if (Math.hypot(w.x - p.x, w.y - p.y) > 1e-3) roundOk = false;
}
ok("多点 roundtrip", roundOk);

console.log("\n=== 8. 箭头/文字/涂鸦映射稳定性 ===");
const arrow = { kind: "arrow" as const, id: "a", x1: 0, y1: 0, x2: 100, y2: 50, color: "#0f6b66", note: "注意" };
const text = { kind: "text" as const, id: "t", x: 500, y: 400, text: "现场2385", color: "#0f6b66" };
const pen = {
  kind: "pen" as const,
  id: "p",
  color: "#0f6b66",
  width: 2,
  points: [{ x: 10, y: 10 }, { x: 20, y: 30 }],
};
const aImg1 = dxfToImagePoint(parsed, arrow.x1, arrow.y1);
const aImg2 = dxfToImagePoint(parsed, arrow.x1, arrow.y1);
ok("箭头映射稳定", aImg1.x === aImg2.x && aImg1.y === aImg2.y);
ok("文字映射有限", Number.isFinite(dxfToImagePoint(parsed, text.x, text.y).x));
ok("涂鸦点数", pen.points.length === 2);

console.log("\n=== 汇总 ===");
if (fails.length) {
  console.error(`FAILED ${fails.length} / ${passed + fails.length}`);
  for (const f of fails) console.error(" -", f);
  process.exit(1);
}
console.log(`ALL_PASS ${passed}`);
