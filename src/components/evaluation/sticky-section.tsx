/** 工作台布局常量（各板块共用） */

/** 板块内可滚动区域（flex 子项填满剩余高度后纵向滚动；勿加 flex-col，避免子项被压缩裁切） */
export const EVAL_WORKBENCH_PANE_SCROLL =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]";

/** 工作台正文内层：撑满滚动区高度，便于 fill 型面板（订单查询/增补单/派单）内部滚动 */
export const EVAL_WORKBENCH_PANE_INNER =
  "flex min-h-full flex-col gap-4 pb-[var(--eval-scroll-bottom-pad)] pr-0.5";

/** 填满工作台剩余高度的面板（左右分栏、表单等）；移动端随页面滚动自然撑开 */
export const EVAL_WORKBENCH_FILL_PANE =
  "flex min-h-0 flex-1 flex-col overflow-hidden max-lg:flex-none max-lg:overflow-visible";

/** 工作台内左右分栏 grid：桌面端 flex 填满，移动端纵向堆叠 */
export const EVAL_WORKBENCH_SPLIT_GRID =
  "grid min-h-0 flex-1 gap-0 max-lg:flex-none max-lg:min-h-0 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]";

/** 分栏列表区：桌面端内部滚动，移动端随页面滚动 */
export const EVAL_WORKBENCH_SPLIT_LIST =
  "space-y-2 border-b border-slate-100 p-2 max-lg:overflow-visible lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:border-b-0 lg:border-r";

/** 分栏详情区：桌面端内部滚动，移动端随页面滚动 */
export const EVAL_WORKBENCH_SPLIT_DETAIL =
  "flex min-h-0 min-w-0 flex-col p-2 max-lg:overflow-visible sm:p-3 lg:overflow-y-auto lg:overscroll-contain";

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
