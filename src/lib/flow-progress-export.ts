import {
  FLOW_STAGE_DISPLAY,
  FLOW_STAGE_ORDER,
  type FlowStageCell,
} from "./flow-progress-utils";
import { formatOrderDateDay } from "./order-utils";
import { getOrderAnomalyMarkers } from "./order-anomaly";
import { rowToCsvLine } from "./csv-utils";
import type { DesignerHomeStoreIndex } from "./designer-staff-store";
import type { FlowOrderStatus, Order } from "./types";

export interface FlowProgressExportRow {
  order: Order;
  cells: FlowStageCell[];
}

/** 与 STATUS_BAR_FILL 同色系的十六进制值(canvas 快照自绘用) */
const STAGE_HEX: Record<FlowOrderStatus, string> = {
  未派单: "#a1a1aa",
  待量尺: "#fbbf24",
  已量尺: "#38bdf8",
  已出图: "#60a5fa",
  待签约: "#fb923c",
  已签约: "#34d399",
  已下单: "#f97316",
  已安装: "#94a3b8",
  已验收: "#2dd4bf",
};

/** 导出 CSV 明细:当前筛选结果逐单 + 各环节达成日期(Excel 可直接打开) */
export function buildFlowProgressCsv(
  rows: FlowProgressExportRow[],
  designerHomeStoreIndex?: DesignerHomeStoreIndex,
): string {
  const head = [
    "项目名称",
    "客户姓名",
    "联系电话",
    "门店",
    "派单人",
    "设计师",
    "状态",
    "录单日期",
    ...FLOW_STAGE_ORDER.map((status) => FLOW_STAGE_DISPLAY[status]),
    "异常",
  ];
  const lines = [rowToCsvLine(head)];
  for (const row of rows) {
    const order = row.order;
    const anomalies = getOrderAnomalyMarkers(order, {
      highlightCrossStore: true,
      designerHomeStoreIndex,
    })
      .map((marker) => marker.label)
      .join("、");
    const dates = row.cells.map((cell) =>
      cell.doneIso ? formatOrderDateDay(cell.doneIso) : "",
    );
    lines.push(
      rowToCsvLine([
        order.address || "",
        order.customerName,
        order.phone || "",
        order.dispatchStore,
        order.dispatcherName || "",
        order.designer ?? "",
        order.status,
        formatOrderDateDay(order.createdAt),
        ...dates,
        anomalies,
      ]),
    );
  }
  return lines.join("\n");
}

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 截断中文文本到近似宽度(px) */
function clipText(ctx: CanvasRenderingContext2D, text: string, maxPx: number): string {
  if (ctx.measureText(text).width <= maxPx) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxPx) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

/**
 * 快照:把当前可见矩阵自绘为 PNG 下载(纯 Canvas,无第三方依赖)。
 * 行数过多时截断(浏览器画布尺寸限制),截断会体现在脚注。
 */
export function exportFlowProgressSnapshotPng(options: {
  rows: FlowProgressExportRow[];
  /** 当前处于各状态的在途单数(表头列计数) */
  liveCounts: ReadonlyMap<string, number>;
}): { exported: number; total: number } {
  const { rows, liveCounts } = options;
  const maxRows = 900;
  const shown = rows.slice(0, maxRows);

  const LABEL_W = 184;
  const COL_W = 92;
  const ROW_H = 30;
  const HEAD_H = 36;
  const PAD = 14;
  const FOOT_H = 26;

  const stageWidth = COL_W * FLOW_STAGE_ORDER.length;
  const width = PAD * 2 + LABEL_W + stageWidth;
  const height =
    PAD * 2 + HEAD_H + ROW_H * shown.length + FOOT_H;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { exported: 0, total: rows.length };

  // 背景与网格
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#e4e4e7";
  ctx.lineWidth = 1;

  const left = PAD;
  const top = PAD;
  const labelX = left;
  const firstColX = left + LABEL_W;

  // 表头
  ctx.fillStyle = "#f4f4f5";
  ctx.fillRect(labelX, top, LABEL_W + stageWidth, HEAD_H);
  ctx.fillStyle = "#374151";
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("项目名称", labelX + 10, top + HEAD_H / 2);
  FLOW_STAGE_ORDER.forEach((status, index) => {
    const x = firstColX + index * COL_W;
    const count = liveCounts.get(status) ?? 0;
    const color = STAGE_HEX[status];
    // 色点
    ctx.beginPath();
    ctx.arc(x + 12, top + HEAD_H / 2 - 6, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = "#374151";
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(FLOW_STAGE_DISPLAY[status], x + 22, top + HEAD_H / 2 - 6);
    ctx.fillStyle = "#6b7280";
    ctx.font = "500 10px system-ui, sans-serif";
    ctx.fillText(String(count), x + 22, top + HEAD_H / 2 + 7);
    ctx.strokeStyle = "#e4e4e7";
    ctx.strokeRect(x, top, COL_W, HEAD_H);
  });

  // 行
  shown.forEach((row, rowIndex) => {
    const y = top + HEAD_H + rowIndex * ROW_H;
    const order = row.order;
    ctx.fillStyle = rowIndex % 2 === 1 ? "#fafafa" : "#ffffff";
    ctx.fillRect(labelX, y, LABEL_W + stageWidth, ROW_H);

    // 左列:地址 + 客户/状态
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#111827";
    ctx.font = "500 11.5px system-ui, sans-serif";
    ctx.fillText(
      clipText(ctx, order.address || "—", LABEL_W - 18),
      labelX + 9,
      y + 10.5,
    );
    ctx.fillStyle = "#6b7280";
    ctx.font = "400 9.5px system-ui, sans-serif";
    ctx.fillText(
      clipText(
        ctx,
        `${order.customerName} · ${order.status}`,
        LABEL_W - 18,
      ),
      labelX + 9,
      y + 22.5,
    );

    // 各环节格
    row.cells.forEach((cell, colIndex) => {
      const x = firstColX + colIndex * COL_W;
      if (cell.doneIso) {
        ctx.fillStyle = hexToRgba(STAGE_HEX[cell.status], 0.38);
        ctx.fillRect(x, y, COL_W, ROW_H);
        ctx.fillStyle = "#1f2937";
        ctx.font = "500 10px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          formatOrderDateDay(cell.doneIso),
          x + COL_W / 2,
          y + ROW_H / 2,
        );
      }
      ctx.strokeStyle = "#e4e4e7";
      ctx.strokeRect(x, y, COL_W, ROW_H);
    });
    ctx.strokeStyle = "#e4e4e7";
    ctx.strokeRect(labelX, y, LABEL_W, ROW_H);
  });

  // 脚注
  ctx.fillStyle = "#9ca3af";
  ctx.font = "400 10px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    `流程推进图 · 共 ${shown.length} 单${
      rows.length > shown.length ? `(超出部分未截入,共 ${rows.length} 单)` : ""
    } · 导出于 ${new Date().toLocaleString("zh-CN")}`,
    labelX,
    top + HEAD_H + ROW_H * shown.length + 14,
  );

  const link = document.createElement("a");
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `流程推进图-快照-${new Date()
      .toISOString()
      .slice(0, 16)
      .replace("T", "-")
      .replace(":", "")}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");

  return { exported: shown.length, total: rows.length };
}
