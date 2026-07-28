import type { NavHref } from "@/lib/nav-access";

export type BoardKey =
  | "admin"
  | "designer"
  | "manager"
  | "delivery"
  | "evaluation";

export type BoardMeta = {
  key: BoardKey;
  title: string;
  description: string;
};

export const BOARD_META: Record<NavHref, BoardMeta> = {
  "/admin": {
    key: "admin",
    title: "新客户开发",
    description: "新建派单、新建客户与未派单指派",
  },
  "/designer": {
    key: "designer",
    title: "设计师工作台",
    description: "跟单、备注与状态更新",
  },
  "/manager": {
    key: "manager",
    title: "项目进程管理",
    description: "门店汇总、设计师业绩与节点预警",
  },
  "/delivery": {
    key: "delivery",
    title: "验收与交付",
    description: "已下单、安装与客户扫码验收评价",
  },
  "/evaluation": {
    key: "evaluation",
    title: "综合系统看板",
    description: "派单、设计师与门店排名",
  },
};

export function boardKeyFromHref(href: NavHref): BoardKey {
  return BOARD_META[href].key;
}
