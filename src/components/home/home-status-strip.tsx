"use client";

import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import {
  buildHomeOverviewSections,
  kpiToneStyles,
  type HomeKpiItem,
  type HomeOverviewSection,
} from "@/lib/home-status-kpis";
import Link from "next/link";
import { useMemo } from "react";

function KpiCard({ item }: { item: HomeKpiItem }) {
  const tone = kpiToneStyles(item.tone);
  return (
    <Link
      href={item.href}
      className="vi-surface flex min-h-[112px] flex-col justify-between p-4 transition-[border-color,background-color,box-shadow] duration-[var(--duration-fast)] hover:border-[var(--separator-strong)] hover:bg-[var(--fill-quaternary)]"
    >
      <p
        className="text-[13px] font-medium"
        style={{ color: "var(--label-secondary)" }}
      >
        {item.label}
      </p>
      <p
        className="mt-2 tabular-nums text-[32px] font-semibold tracking-tight leading-none"
        style={{ color: tone.value }}
      >
        {item.count}
      </p>
      <p
        className="mt-3 text-[12px] font-semibold"
        style={{ color: "var(--system-blue)" }}
      >
        {item.actionLabel ?? "进入处理"} →
      </p>
    </Link>
  );
}

function OverviewSectionBlock({ section }: { section: HomeOverviewSection }) {
  return (
    <section aria-labelledby={`home-section-${section.id}`} className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id={`home-section-${section.id}`}
            className="text-[17px] font-semibold"
            style={{ color: "var(--label-primary)" }}
          >
            {section.title}
          </h2>
          <p
            className="mt-0.5 text-[13px]"
            style={{ color: "var(--label-tertiary)" }}
          >
            {section.description}
          </p>
        </div>
      </div>

      {section.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {section.items.map((item) => (
            <KpiCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div
          className="vi-surface px-4 py-8 text-center"
          style={{ borderStyle: "dashed" }}
        >
          <p
            className="text-[14px] font-medium"
            style={{ color: "var(--label-secondary)" }}
          >
            {section.emptyHint ?? "暂无数据"}
          </p>
        </div>
      )}
    </section>
  );
}

/** 首页可扩展概览：履约进程 + 销售（预留）等分区 */
export function HomeStatusStrip() {
  const { user } = useAuth();
  const { orders, isHydrated } = useOrders();

  const sections = useMemo(
    () => buildHomeOverviewSections(user, orders),
    [user, orders],
  );

  if (!user || !isHydrated || sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-6" aria-label="工作台概览">
      {sections.map((section) => (
        <OverviewSectionBlock key={section.id} section={section} />
      ))}
    </div>
  );
}
