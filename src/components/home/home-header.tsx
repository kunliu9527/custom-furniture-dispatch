"use client";

import { LoginPanel } from "@/components/auth/login-panel";
import Link from "next/link";

export function HomeHeader() {
  return (
    <header className="relative z-10 border-b border-slate-200/70 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-semibold text-slate-900 transition hover:opacity-90"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200/80">
            派
          </span>
          <span className="hidden rounded-lg bg-indigo-100 px-2.5 py-1 text-indigo-900 ring-1 ring-indigo-200/80 sm:inline">
            设计师超级定单系统
          </span>
          <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-indigo-900 ring-1 ring-indigo-200/80 sm:hidden">
            超级定单
          </span>
        </Link>
        <LoginPanel variant="home" />
      </div>
    </header>
  );
}
