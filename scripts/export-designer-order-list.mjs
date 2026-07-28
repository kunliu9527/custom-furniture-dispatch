#!/usr/bin/env node
/**
 * 从 data/snapshot.json 导出「设计师详细订单情况」Excel（SpreadsheetML .xls）
 * 用法：node scripts/export-designer-order-list.mjs [snapshot路径]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const snapPath = process.argv[2] ?? path.join(process.cwd(), "data", "snapshot.json");
const snap = JSON.parse(readFileSync(snapPath, "utf8"));
const orders = snap.orders ?? [];
const supplements = snap.supplements ?? [];

const FLOW = [
  "未派单",
  "待量尺",
  "已量尺",
  "已出图",
  "待签约",
  "已签约",
  "已下单",
  "已安装",
  "已验收",
];

const STATUS_COLS = [...FLOW, "待退单", "已退单"];

function esc(v) {
  const s = v == null ? "" : String(v);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(n) {
  if (n == null || n === "" || !Number.isFinite(Number(n))) return "";
  return Number(n);
}

function fmtDt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("zh-CN", { hour12: false });
}

function spaces(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.join("、");
}

function customerName(o) {
  const name = (o.customerName ?? "").trim();
  const addr = (o.address ?? "").trim();
  if (!name || name === "—" || name === "-") return "";
  if (addr && name === addr) return "";
  return name;
}

function cell(v, type = "String") {
  if (v === "" || v == null) {
    return `<Cell><Data ss:Type="String"></Data></Cell>`;
  }
  if (type === "Number" && Number.isFinite(Number(v))) {
    return `<Cell><Data ss:Type="Number">${Number(v)}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`;
}

function row(cells) {
  return `<Row>${cells.join("")}</Row>`;
}

const detailHeaders = [
  "设计师",
  "状态",
  "客户姓名",
  "电话",
  "地址",
  "定制空间",
  "预算(元)",
  "定金(元)",
  "订单金额(元)",
  "售后金(元)",
  "派单门店",
  "派单人",
  "原设计师",
  "订单ID",
  "录单时间",
  "设计师接单时间",
  ...FLOW.map((s) => `进入「${s}」时间`),
  "流程累计天数",
  "问题标签",
  "安装员",
  "验收时间",
  "备注摘要",
];

function remarkSummary(o) {
  const remarks = o.workflowRemarks;
  if (Array.isArray(remarks) && remarks.length) {
    return remarks
      .slice(-3)
      .map((r) => `${r.stage ?? ""}:${String(r.text ?? "").slice(0, 40)}`)
      .join(" | ");
  }
  return o.workflowRemark ?? "";
}

function orderDetailCells(o) {
  const entered = o.statusEnteredAt ?? {};
  const installer =
    o.installation?.installerName ?? o.installation?.installer ?? "";
  const acceptedAt = o.acceptance?.acceptedAt ?? entered["已验收"] ?? "";
  return [
    cell(o.designer ?? "(未派设计师)"),
    cell(o.status),
    cell(customerName(o)),
    cell(o.phone),
    cell(o.address),
    cell(spaces(o.spaces)),
    cell(money(o.budget), "Number"),
    cell(money(o.deposit), "Number"),
    cell(money(o.orderAmount), "Number"),
    cell(money(o.afterSalesAmount), "Number"),
    cell(o.dispatchStore),
    cell(o.dispatcherName),
    cell(o.originalDesigner ?? ""),
    cell(o.id),
    cell(fmtDt(o.createdAt)),
    cell(fmtDt(o.designerAcceptedAt)),
    ...FLOW.map((s) => cell(fmtDt(entered[s]))),
    cell(
      o.totalElapsedDays != null && Number.isFinite(o.totalElapsedDays)
        ? o.totalElapsedDays
        : "",
      "Number",
    ),
    cell((o.issueTags ?? []).join("、")),
    cell(installer),
    cell(fmtDt(acceptedAt)),
    cell(remarkSummary(o)),
  ];
}

const sorted = [...orders].sort((a, b) => {
  const da = a.designer ?? "(未派设计师)";
  const db = b.designer ?? "(未派设计师)";
  const c = da.localeCompare(db, "zh-CN");
  if (c) return c;
  return String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? ""));
});

const summaryMap = new Map();
for (const o of orders) {
  const d = o.designer ?? "(未派设计师)";
  if (!summaryMap.has(d)) {
    summaryMap.set(d, {
      designer: d,
      total: 0,
      byStatus: Object.fromEntries(STATUS_COLS.map((s) => [s, 0])),
      budget: 0,
      orderAmount: 0,
      afterSales: 0,
    });
  }
  const r = summaryMap.get(d);
  r.total += 1;
  if (r.byStatus[o.status] != null) r.byStatus[o.status] += 1;
  r.budget += Number(o.budget) || 0;
  r.orderAmount += Number(o.orderAmount) || 0;
  r.afterSales += Number(o.afterSalesAmount) || 0;
}

const summaryDesigners = [...summaryMap.values()].sort((a, b) =>
  a.designer.localeCompare(b.designer, "zh-CN"),
);

const stamp = new Date();
const stampLabel = `${stamp.getFullYear()}${String(stamp.getMonth() + 1).padStart(2, "0")}${String(stamp.getDate()).padStart(2, "0")}`;

let sheetsXml = "";

{
  const summaryHeaders = [
    "设计师",
    "订单数",
    ...STATUS_COLS,
    "预算合计(元)",
    "已填订单金额合计(元)",
    "售后金合计(元)",
  ];
  const rows = [
    row(summaryHeaders.map((h) => cell(h))),
    ...summaryDesigners.map((r) =>
      row([
        cell(r.designer),
        cell(r.total, "Number"),
        ...STATUS_COLS.map((s) => cell(r.byStatus[s] || 0, "Number")),
        cell(r.budget, "Number"),
        cell(r.orderAmount, "Number"),
        cell(r.afterSales, "Number"),
      ]),
    ),
  ];
  sheetsXml += `
<Worksheet ss:Name="设计师汇总">
  <Table>${rows.join("\n")}</Table>
</Worksheet>`;
}

{
  const rows = [
    row(detailHeaders.map((h) => cell(h))),
    ...sorted.map((o) => row(orderDetailCells(o))),
  ];
  sheetsXml += `
<Worksheet ss:Name="全部订单明细">
  <Table>${rows.join("\n")}</Table>
</Worksheet>`;
}

for (const r of summaryDesigners) {
  const name = r.designer.slice(0, 28);
  const list = sorted.filter(
    (o) => (o.designer ?? "(未派设计师)") === r.designer,
  );
  const rows = [
    row(detailHeaders.map((h) => cell(h))),
    ...list.map((o) => row(orderDetailCells(o))),
  ];
  sheetsXml += `
<Worksheet ss:Name="${esc(name)}">
  <Table>${rows.join("\n")}</Table>
</Worksheet>`;
}

if (supplements.length) {
  const headers = [
    "设计师",
    "增补单ID",
    "关联主单ID",
    "客户姓名",
    "增补金额(元)",
    "状态",
    "创建时间",
  ];
  const list = [...supplements].sort((a, b) =>
    String(a.designer ?? "").localeCompare(String(b.designer ?? ""), "zh-CN"),
  );
  const rows = [
    row(headers.map((h) => cell(h))),
    ...list.map((s) =>
      row([
        cell(s.designer),
        cell(s.id),
        cell(s.parentOrderId),
        cell(s.customerName),
        cell(money(s.supplementAmount), "Number"),
        cell(s.status),
        cell(fmtDt(s.createdAt)),
      ]),
    ),
  ];
  sheetsXml += `
<Worksheet ss:Name="增补单">
  <Table>${rows.join("\n")}</Table>
</Worksheet>`;
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>设计师详细订单情况清单</Title>
  <Created>${stamp.toISOString()}</Created>
</DocumentProperties>
<Styles>
  <Style ss:ID="Default" ss:Name="Normal">
    <Alignment ss:Vertical="Center"/>
    <Font ss:FontName="微软雅黑" ss:Size="11"/>
  </Style>
</Styles>
${sheetsXml}
</Workbook>
`;

const outDir = path.join(process.cwd(), "exports");
mkdirSync(outDir, { recursive: true });
const outFile = path.join(
  outDir,
  `设计师订单明细清单-${stampLabel}-v${snap.version ?? "na"}.xls`,
);
writeFileSync(outFile, `\uFEFF${xml}`, "utf8");
console.log(outFile);
console.log(
  `orders=${orders.length} designers=${summaryDesigners.length} supplements=${supplements.length} version=${snap.version}`,
);
