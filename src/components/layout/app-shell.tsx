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
      <header className="vi-glass-header">
        <div className="vi-shell-inner mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="vi-logo-mark size-9 shrink-0 text-sm"
              aria-label="返回首页"
            >
              派
            </Link>
            <div className="min-w-0">
              <h1 className="vi-heading-section truncate text-base sm:text-[17px]">
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
          <div className="flex flex-wrap items-center gap-2">
            <AppNav />
            {actions}
          </div>
        </div>
      </header>
      <main className={`min-h-0 overflow-hidden ${mainClassName}`}>
        {children}
      </main>
      <SyncFooterStatus className="shrink-0" />
    </div>
  );
}
