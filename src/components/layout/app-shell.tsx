import { AppNav } from "@/components/layout/app-nav";
import { SyncFooterStatus } from "@/components/sync/sync-footer-status";
import { boardKeyFromHref, type BoardKey } from "@/lib/board-meta";
import type { NavHref } from "@/lib/nav-access";
import Link from "next/link";
import type { ReactNode } from "react";

interface AppShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  mainClassName?: string;
  /** 当前板块，用于按钮/表头与导航色一致 */
  board?: NavHref;
}

export function AppShell({
  title,
  description,
  children,
  actions,
  mainClassName = "mx-auto max-w-6xl px-4 py-8 sm:px-6",
  board,
}: AppShellProps) {
  const boardKey: BoardKey | undefined = board
    ? boardKeyFromHref(board)
    : undefined;

  return (
    <div
      className="vi-app-bg grid h-dvh grid-rows-[auto_1fr_auto] overflow-hidden"
      {...(boardKey ? { "data-board": boardKey } : {})}
    >
      {/* min-w-0：防止导航/筛选项把整页撑出视口后被 overflow-hidden 裁切且无法滑动 */}
      <header className="vi-glass-header min-w-0">
        <div className="vi-shell-inner mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-1.5 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              href="/"
              className="vi-logo-mark size-8 shrink-0 text-sm sm:size-9"
              aria-label="返回首页"
            >
              派
            </Link>
            <div className="min-w-0">
              <h1 className="vi-heading-section truncate text-[15px] sm:text-[17px]">
                {title}
              </h1>
              {description ? (
                <p
                  className="mt-0.5 truncate text-xs sm:text-[13px]"
                  style={{ color: "var(--label-secondary)" }}
                >
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:max-w-full sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <AppNav />
            {actions}
          </div>
        </div>
      </header>
      <main className={`min-h-0 min-w-0 overflow-hidden ${mainClassName}`}>
        {children}
      </main>
      <SyncFooterStatus className="min-w-0 shrink-0" />
    </div>
  );
}
