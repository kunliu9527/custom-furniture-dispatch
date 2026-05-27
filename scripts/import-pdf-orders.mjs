import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const STORE_MAP = {
  万象东岸店: "东岸万象",
  天冠东岸店: "东岸天冠",
  天冠高桥店: "高桥天冠",
  天冠郁金香店: "郁金香天冠",
  万象郁金香店: "郁金香万象",
};

const STORE_KEYS = Object.keys(STORE_MAP);

const DESIGNERS = [
  "唐姣君",
  "钱海霞",
  "李炜浪",
  "伏迪胜",
  "欧伟明",
  "肖亮斌",
  "何美玲",
  "练汪理",
  "刘鑫",
  "刘芸",
  "罗晨",
  "汤勇",
  "周坤",
  "汤雷",
];

const STATUS_PATTERNS = [
  { raw: "已下单正安装", norm: "已下单" },
  { raw: "已下单已下单", norm: "已下单" },
  { raw: "待退单", norm: "待退单" },
  { raw: "已退单", norm: "已退单" },
  { raw: "已量尺", norm: "已量尺" },
  { raw: "已出图", norm: "已出图" },
  { raw: "已签约", norm: "已签约" },
  { raw: "已下单", norm: "已下单" },
  { raw: "已安装", norm: "已安装" },
  { raw: "待量尺", norm: "待量尺" },
];

const HEADER_MARKERS = [
  "地址",
  "所属机构",
  "设计师",
  "派单人",
  "订单设",
  "备注派单",
  "售后金",
  "计状态",
];

function isHeaderLine(line) {
  const t = line.trim();
  if (!t) return true;
  if (HEADER_MARKERS.some((m) => t.includes(m))) return true;
  if (/^店姓名/.test(t)) return true;
  return false;
}

function cleanAddress(address) {
  let a = address.replace(/\s+/g, "");
  a = a.replace(/^(店姓名|姓名|计状态|备注派单金额|售后金)+/, "");
  const idx = a.search(
    /[\u4e00-\u9fa5\d][\u4e00-\u9fa5\d·.（）()-]*(?:府|城|苑|园|湾|台|里|村|路|街|号|栋|单元|小区|国际|中心|广场|大厦|悦城|雅宾利)/,
  );
  if (idx > 0 && idx <= 24) a = a.slice(idx);
  return a;
}

function hasStore(text) {
  return STORE_KEYS.some((k) => text.includes(k));
}

function isRecordComplete(text) {
  if (!hasStore(text)) return false;
  const normalized = text.replace(/\s+/g, " ").trim();
  return /(\d{3,})(?:\s+\d{1,3})?\s*$/.test(normalized);
}

function looksLikeOrderLine(line) {
  return hasStore(line) && /\d{3,}/.test(line) && !isHeaderLine(line);
}

function collectRecords(raw) {
  const lines = raw.split(/\r?\n/);
  const records = [];
  let buffer = "";
  let started = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || isHeaderLine(trimmed)) continue;

    if (!started) {
      if (!looksLikeOrderLine(trimmed) && !hasStore(trimmed)) continue;
      started = true;
    }

    buffer = buffer ? `${buffer} ${trimmed}` : trimmed;

    if (isRecordComplete(buffer)) {
      records.push(buffer.replace(/\s+/g, " ").trim());
      buffer = "";
    }
  }

  if (buffer && hasStore(buffer) && isRecordComplete(buffer)) {
    records.push(buffer.replace(/\s+/g, " ").trim());
  }

  return records;
}

function findStoreInRecord(text) {
  let earliest = null;
  for (const storeKey of STORE_KEYS) {
    const idx = text.indexOf(storeKey);
    if (idx !== -1 && (earliest === null || idx < earliest.idx)) {
      earliest = { idx, storeKey, len: storeKey.length };
    }
  }
  return earliest;
}

function parseDesigner(rest) {
  for (const name of DESIGNERS) {
    if (rest.startsWith(name)) {
      return { designer: name, after: rest.slice(name.length) };
    }
  }
  return null;
}

function parseStatus(rest) {
  let earliest = null;
  for (const { raw, norm } of STATUS_PATTERNS) {
    const idx = rest.indexOf(raw);
    if (idx !== -1 && (earliest === null || idx < earliest.idx)) {
      earliest = { idx, raw, norm };
    }
  }
  return earliest;
}

function parseAmounts(tail) {
  const normalized = tail.replace(/\s+/g, " ").trim();
  const match = normalized.match(/(\d{3,})(?:\s+(\d{1,3}))?\s*$/);
  if (!match) return { dispatchAmount: 0, afterSales: null, remark: normalized };

  const dispatchAmount = Number(match[1]);
  const afterSales =
    match[2] !== undefined &&
    Number(match[2]) < 1000 &&
    Number(match[2]) < dispatchAmount / 5
      ? Number(match[2])
      : null;

  const remark = normalized.slice(0, match.index).trim();
  return { dispatchAmount, afterSales, remark };
}

function normalizeRecord(text) {
  let t = text.replace(/\s+/g, " ").trim();
  t = t.replace(/(\d{3,})\s+(\d{1,3})\s*$/g, "$1|$2");
  return t.replace(/\s/g, "").replace(/\|/g, " ");
}

function parseRecord(text) {
  text = normalizeRecord(text);
  const storeHit = findStoreInRecord(text);
  if (!storeHit) return null;

  const address = cleanAddress(text.slice(0, storeHit.idx));
  const rest = text.slice(storeHit.idx + storeHit.len);

  const designerParsed = parseDesigner(rest);
  if (!designerParsed) return null;

  const statusParsed = parseStatus(designerParsed.after);
  if (!statusParsed) return null;

  const dispatcher = designerParsed.after
    .slice(0, statusParsed.idx)
    .match(/^[\u4e00-\u9fa5]{2,4}/)?.[0] ?? "—";

  const tail = designerParsed.after.slice(statusParsed.idx + statusParsed.raw.length);
  const { dispatchAmount, afterSales, remark } = parseAmounts(tail);

  if (!address || dispatchAmount <= 0) return null;

  const status = statusParsed.norm;
  const isOrderedOrInstalled = status === "已下单" || status === "已安装";

  let deposit = 1000;
  if (status === "已量尺" && (remark.includes("前置") || address.includes("前置"))) {
    deposit = 0;
  }

  return {
    address,
    dispatchStore: STORE_MAP[storeHit.storeKey],
    designer: designerParsed.designer,
    dispatcherName: dispatcher,
    status,
    remark,
    budget: dispatchAmount,
    deposit,
    orderAmount: isOrderedOrInstalled ? dispatchAmount : null,
    afterSalesAmount: afterSales,
    isSupplement: /增补/.test(address + remark + text),
  };
}

function main() {
  const raw = fs.readFileSync(path.join(root, "pdf-extract.txt"), "utf8");
  const records = collectRecords(raw);
  const failed = [];
  const parsed = records
    .map((text) => {
      const row = parseRecord(text);
      if (!row) failed.push(text.slice(0, 80));
      return row;
    })
    .filter(Boolean);
  if (failed.length > 0) {
    console.log("Failed parse count:", failed.length);
    console.log("Failed samples:", failed.slice(0, 5));
  }

  const orders = [];
  const supplements = [];
  let orderIndex = 0;

  const mainRecords = parsed.filter((r) => !r.isSupplement);
  const supplementRecords = parsed.filter((r) => r.isSupplement);

  for (const r of mainRecords) {
    orderIndex += 1;
    const id = `ord-${String(orderIndex).padStart(4, "0")}`;
    orders.push({
      id,
      customerName: r.address.slice(0, 24),
      phone: "—",
      address: r.address,
      spaces: ["全屋"],
      budget: r.budget,
      dispatchStore: r.dispatchStore,
      deposit: r.deposit,
      orderAmount: r.orderAmount,
      afterSalesAmount: r.afterSalesAmount,
      dispatcherName: r.dispatcherName,
      originalDesigner: r.designer,
      designer: r.designer,
      transferRecords: [],
      status: r.status,
      workflowRemark: null,
      workflowRemarks: r.remark
        ? [
            {
              stage: r.status,
              text: r.remark,
              at: new Date(2026, 0, 1 + (orderIndex % 28)).toISOString(),
            },
          ]
        : [],
      createdAt: new Date(2026, 0, 1 + (orderIndex % 28)).toISOString(),
    });
  }

  for (const r of supplementRecords) {
    const parent = orders.find(
      (o) =>
        o.designer === r.designer &&
        (o.address.includes(r.address.replace(/（客户增补）.*/, "")) ||
          r.address.includes(o.address.slice(0, 8))),
    );
    supplements.push({
      id: `sup-${String(supplements.length + 1).padStart(4, "0")}`,
      parentOrderId: parent?.id ?? orders[0]?.id ?? "ord-0001",
      customerName: r.address,
      designer: r.designer,
      supplementAmount: r.budget,
      status: "已下单",
      createdAt: new Date(2026, 1, 1 + supplements.length).toISOString(),
    });
  }

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  console.log("Raw record lines:", records.length);
  console.log("Parsed orders:", orders.length);
  console.log("Parsed supplements:", supplements.length);
  console.log("Status counts:", statusCounts);

  const samples = {
    guochenfu: orders.find((o) => o.address.includes("国辰府23栋2单元205")),
    luochenInstall: orders.find((o) => o.address.includes("三王丽都东座910")),
    liweilangMeasure: orders.find((o) =>
      o.address.includes("长沙北中心保利时代"),
    ),
  };
  console.log("Samples:", JSON.stringify(samples, null, 2));

  const ordersTs = `import type { Order } from "./types";

/** 来自 2026直营门店设计订单状态.pdf 导入 */
export const INITIAL_ORDERS: Order[] = ${JSON.stringify(orders, null, 2)};
`;

  fs.writeFileSync(path.join(root, "src/lib/mock-data.ts"), ordersTs, "utf8");
  fs.writeFileSync(
    path.join(root, "src/lib/initial-data.ts"),
    `import { INITIAL_ORDERS } from "./mock-data";
import type { AppPersistedData, SupplementOrder } from "./types";

export const INITIAL_SUPPLEMENTS: SupplementOrder[] = ${JSON.stringify(supplements, null, 2)};

export const INITIAL_DATA: AppPersistedData = {
  orders: INITIAL_ORDERS,
  supplements: INITIAL_SUPPLEMENTS,
};
`,
    "utf8",
  );

  fs.writeFileSync(
    path.join(root, "import-summary.json"),
    JSON.stringify({ orders: orders.length, supplements: supplements.length, statusCounts, samples }, null, 2),
    "utf8",
  );
}

main();
