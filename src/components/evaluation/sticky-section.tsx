/** 工作台布局常量（各板块共用） */

/** @deprecated 使用 flex-1 min-h-0；保留导出以免旧引用报错 */
export const EVAL_WORKBENCH_SHELL_H = "min-h-0 flex-1";

/** 板块内可滚动区域（flex 子项填满剩余高度后纵向滚动） */
export const EVAL_WORKBENCH_PANE_SCROLL =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]";

/** 工作台列间距 */
export const EVAL_WORKBENCH_COL_GAP = "gap-x-[var(--eval-workbench-col-gap)]";

/** 工作台侧栏宽度 */
export const EVAL_WORKBENCH_SIDEBAR_WIDTH =
  "w-[var(--eval-sidebar-w)] shrink-0 xl:w-[var(--eval-sidebar-w-xl)]";

/** 导航层内白卡片（侧栏 / 统计周期共用） */
export const EVAL_WORKBENCH_NAV_CARD = "vi-workbench-card";

/** 综合看板页 main：在 AppShell 内 flex 占满剩余高度，禁止整页滚动 */
export const EVAL_PAGE_MAIN_CLASS =
  "mx-auto flex w-full max-w-6xl flex-1 min-h-0 flex-col overflow-hidden px-4 pt-[var(--eval-workbench-nav-gap)] sm:px-6";

/** 侧栏内边距 */
export const EVAL_SIDEBAR_INNER_PAD = "p-2.5";

/** 统计周期栏与正文间距 */
export const EVAL_WORKBENCH_CONTENT_OFFSET = "mb-3 shrink-0";
