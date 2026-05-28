import type { OrderIssueTag } from "./types";

export const ISSUE_TAG_OPTIONS: {
  id: OrderIssueTag;
  label: string;
}[] = [
  { id: "效果图未过", label: "效果图未过" },
  { id: "工艺错误", label: "工艺错误" },
  { id: "沟通问题", label: "沟通问题" },
  { id: "客户变卦", label: "客户变卦" },
  { id: "派单信息不全", label: "派单信息不全" },
  { id: "效率过慢", label: "效率过慢" },
  { id: "其他", label: "其他" },
];

const VALID = new Set(ISSUE_TAG_OPTIONS.map((o) => o.id));

export function normalizeIssueTags(raw: unknown): OrderIssueTag[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<OrderIssueTag>();
  for (const item of raw) {
    if (typeof item === "string" && VALID.has(item as OrderIssueTag)) {
      seen.add(item as OrderIssueTag);
    }
  }
  return [...seen];
}

export function formatIssueTags(tags: OrderIssueTag[] | undefined): string {
  if (!tags?.length) return "—";
  return tags.join("、");
}
