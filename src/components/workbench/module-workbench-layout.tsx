"use client";

import {
  EVAL_SIDEBAR_INNER_PAD,
  EVAL_WORKBENCH_COL_GAP,
  EVAL_WORKBENCH_CONTENT_OFFSET,
  EVAL_WORKBENCH_NAV_CARD,
  EVAL_WORKBENCH_PANE_SCROLL,
  EVAL_WORKBENCH_SHELL_H,
  EVAL_WORKBENCH_SIDEBAR_WIDTH,
} from "@/components/evaluation/sticky-section";
import { useLayoutEffect, useRef, type ReactNode } from "react";

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

/** 各业务板块共用：左侧导航 + 可选统计周期 + 固定高度正文滚动区 */
export function ModuleWorkbenchLayout({
  sidebar,
  periodBar,
  mobileTabs,
  children,
}: ModuleWorkbenchLayoutProps) {
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {mobileTabs ? <div className="mb-4 shrink-0 lg:hidden">{mobileTabs}</div> : null}

      <div
        className={`hidden min-h-0 flex-1 lg:flex ${EVAL_WORKBENCH_SHELL_H} ${EVAL_WORKBENCH_COL_GAP}`}
      >
        <aside
          className={`flex min-h-0 flex-col overflow-hidden ${EVAL_WORKBENCH_SIDEBAR_WIDTH}`}
        >
          <div
            className={`${EVAL_WORKBENCH_NAV_CARD} flex min-h-0 flex-1 flex-col overflow-hidden`}
          >
            <div className={`${EVAL_SIDEBAR_INNER_PAD} ${EVAL_WORKBENCH_PANE_SCROLL}`}>
              {sidebar}
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {periodBlock}
          <div className={`${EVAL_WORKBENCH_PANE_SCROLL} flex min-h-0 flex-1 flex-col gap-4 pr-0.5`}>
            {children}
          </div>
        </div>
      </div>

      <div className="space-y-4 lg:hidden">
        {periodBlock}
        <div className="space-y-4 pb-8">{children}</div>
      </div>
    </div>
  );
}
