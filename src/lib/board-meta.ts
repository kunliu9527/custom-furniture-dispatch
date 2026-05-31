import type { NavHref } from "@/lib/nav-access";

export type BoardMeta = {
  title: string;
  description: string;
  /** Tailwind gradient stops for accent bar, e.g. from-indigo-500 to-violet-600 */
  accentGradient: string;
  /** Active top-nav pill modifier (see globals.css) */
  navActiveClass: string;
};

export const BOARD_META: Record<NavHref, BoardMeta> = {
  "/admin": {
    title: "新客户开发",
    description: "新建派单、新建客户与未派单指派",
    accentGradient: "from-indigo-500 to-violet-600",
    navActiveClass: "vi-nav-pill-active-indigo",
  },
  "/designer": {
    title: "设计师工作台",
    description: "跟单、备注与状态更新",
    accentGradient: "from-emerald-500 to-teal-600",
    navActiveClass: "vi-nav-pill-active-emerald",
  },
  "/manager": {
    title: "项目进程管理",
    description: "门店汇总、设计师业绩与节点预警",
    accentGradient: "from-amber-500 to-orange-600",
    navActiveClass: "vi-nav-pill-active-amber",
  },
  "/delivery": {
    title: "验收与交付",
    description: "已下单、安装与客户扫码验收评价",
    accentGradient: "from-cyan-500 to-sky-600",
    navActiveClass: "vi-nav-pill-active-cyan",
  },
  "/evaluation": {
    title: "综合系统看板",
    description: "派单、设计师与门店排名",
    accentGradient: "from-rose-500 to-pink-600",
    navActiveClass: "vi-nav-pill-active-rose",
  },
};
