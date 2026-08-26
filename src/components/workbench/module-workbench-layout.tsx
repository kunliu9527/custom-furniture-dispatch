"use client";

import {
  EVAL_SIDEBAR_INNER_PAD,
  EVAL_WORKBENCH_COL_GAP,
  EVAL_WORKBENCH_CONTENT_OFFSET,
  EVAL_WORKBENCH_NAV_CARD,
  EVAL_WORKBENCH_PANE_INNER,
  EVAL_WORKBENCH_PANE_SCROLL,
  EVAL_WORKBENCH_SIDEBAR_WIDTH,
} from "@/components/evaluation/sticky-section";
import { WorkbenchSidebarToggle } from "@/components/workbench/workbench-sidebar-toggle";
import {
  loadWorkbenchSidebarCollapsed,
  saveWorkbenchSidebarCollapsed,
} from "@/lib/workbench-sidebar-persistence";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface ModuleWorkbenchLayoutProps {
  sidebar: ReactNode;
  /** 省略时不显示统计周期栏（如门店录/派单） */
  periodBar?: ReactNode;
  mobileTabs?: ReactNode;
  children: ReactNode;
}

function syncSiteNavHeight() {
  const header = document.querySelector("header");
  if (!header) return;
  document.documentElement.style.setProperty(
    "--eval-site-nav-h",
    `${header.getBoundingClientRect().height}px`,
  );
}

function WorkbenchNavMeasure({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    syncSiteNavHeight();
    const header = document.querySelector("header");
    const headerRo = header ? new ResizeObserver(syncSiteNavHeight) : null;
    if (header && headerRo) headerRo.observe(header);

    const el = ref.current;
    const navRo = el
      ? new ResizeObserver(() => {
          document.documentElement.style.setProperty(
            "--eval-workbench-nav-h",
            `${el.getBoundingClientRect().height}px`,
          );
        })
      : null;
    if (el && navRo) {
      navRo.observe(el);
      document.documentElement.style.setProperty(
        "--eval-workbench-nav-h",
        `${el.getBoundingClientRect().height}px`,
      );
    }

    return () => {
      headerRo?.disconnect();
      navRo?.disconnect();
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

function NoPeriodNavHeight() {
  useLayoutEffect(() => {
    syncSiteNavHeight();
    document.documentElement.style.setProperty("--eval-workbench-nav-h", "0px");
    const header = document.querySelector("header");
    const headerRo = header ? new ResizeObserver(syncSiteNavHeight) : null;
    if (header && headerRo) headerRo.observe(header);
    return () => headerRo?.disconnect();
  }, []);
  return null;
}

/**
 * 各业务板块共用：左侧导航 + 可选统计周期 + 正文滚动区。
 * children 只挂载一份（避免桌面/手机双树导致重复 id、双表单状态）。
 */
export function ModuleWorkbenchLayout({
  sidebar,
  periodBar,
  mobileTabs,
  children,
}: ModuleWorkbenchLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarUiHydrated, setSidebarUiHydrated] = useState(false);

  useLayoutEffect(() => {
    setSidebarCollapsed(loadWorkbenchSidebarCollapsed());
    setSidebarUiHydrated(true);
  }, []);

  useEffect(() => {
    if (!sidebarUiHydrated) return;
    document.documentElement.toggleAttribute(
      "data-workbench-sidebar-collapsed",
      sidebarCollapsed,
    );
    return () => {
      document.documentElement.removeAttribute("data-workbench-sidebar-collapsed");
    };
  }, [sidebarCollapsed, sidebarUiHydrated]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      saveWorkbenchSidebarCollapsed(next);
      return next;
    });
  }, []);

  const periodBlock = periodBar ? (
    <div className={EVAL_WORKBENCH_CONTENT_OFFSET}>
      <div className={EVAL_WORKBENCH_NAV_CARD}>
        <WorkbenchNavMeasure>
          <div className={EVAL_SIDEBAR_INNER_PAD}>{periodBar}</div>
        </WorkbenchNavMeasure>
      </div>
    </div>
  ) : (
    <NoPeriodNavHeight />
  );

  const sidebarWidthClass = sidebarCollapsed
    ? "w-0"
    : EVAL_WORKBENCH_SIDEBAR_WIDTH;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className={`flex min-h-0 flex-1 ${
          sidebarCollapsed ? "gap-x-0" : EVAL_WORKBENCH_COL_GAP
        }`}
      >
        {/* 桌面侧栏；小屏隐藏，改用顶部 mobileTabs */}
        <div
          className={`relative hidden shrink-0 overflow-visible transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex lg:flex-col ${sidebarWidthClass}`}
        >
          <aside
            className={`flex min-h-0 flex-1 flex-col overflow-hidden transition-opacity duration-150 ease-out motion-reduce:transition-none ${
              sidebarCollapsed
                ? "pointer-events-none opacity-0"
                : "opacity-100"
            } ${sidebarCollapsed ? "w-0" : "w-full"}`}
            aria-hidden={sidebarCollapsed}
          >
            <div
              className={`${EVAL_WORKBENCH_NAV_CARD} flex min-h-0 flex-1 flex-col overflow-hidden`}
            >
              <div
                className={`${EVAL_SIDEBAR_INNER_PAD} ${EVAL_WORKBENCH_PANE_SCROLL}`}
              >
                {sidebar}
              </div>
            </div>
          </aside>
          {!sidebarCollapsed ? (
            <WorkbenchSidebarToggle
              collapsed={sidebarCollapsed}
              onToggle={toggleSidebar}
              variant="collapse"
            />
          ) : null}
        </div>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {sidebarUiHydrated && sidebarCollapsed ? (
            <div className="hidden lg:block">
              <WorkbenchSidebarToggle
                collapsed={sidebarCollapsed}
                onToggle={toggleSidebar}
                variant="expand"
              />
            </div>
          ) : null}

          {/* 滚动容器勿再加 flex-col，否则移动端子项被压扁裁切、手势滚不动 */}
          <div className={EVAL_WORKBENCH_PANE_SCROLL}>
            <div className={`${EVAL_WORKBENCH_PANE_INNER} pb-8 lg:pb-0`}>
              {mobileTabs ? (
                <div className="mb-3 shrink-0 lg:hidden">{mobileTabs}</div>
              ) : null}
              {periodBlock}
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
