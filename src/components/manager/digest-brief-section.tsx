"use client";

import { ManagerDigestStats } from "@/components/manager/manager-digest-stats";

interface DigestBriefSectionProps {
  title: string;
  tone?: "blue" | "rose" | "neutral";
  hint?: string;
  stats?: { label: string; value: string; hint?: string }[];
  children?: React.ReactNode;
}

const sectionToneClass: Record<
  NonNullable<DigestBriefSectionProps["tone"]>,
  string
> = {
  blue: "vi-brief-section-indigo",
  rose: "vi-brief-section-rose",
  neutral: "vi-brief-section-neutral",
};

const titleClass: Record<
  NonNullable<DigestBriefSectionProps["tone"]>,
  string
> = {
  blue: "text-slate-900",
  rose: "text-rose-950",
  neutral: "text-slate-900",
};

export function DigestBriefSection({
  title,
  tone = "neutral",
  hint,
  stats,
  children,
}: DigestBriefSectionProps) {
  const statTone = tone === "rose" ? "rose" : "blue";

  return (
    <section className={`vi-brief-section ${sectionToneClass[tone]}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 pl-1">
        <h3 className={`vi-brief-section-title ${titleClass[tone]}`}>
          {title}
        </h3>
        {hint ? (
          <p className="text-[10px] font-medium text-slate-500">{hint}</p>
        ) : null}
      </div>
      {stats && stats.length > 0 ? (
        <ManagerDigestStats
          items={stats}
          tone={statTone}
          className="mt-2"
        />
      ) : null}
      {children}
    </section>
  );
}
