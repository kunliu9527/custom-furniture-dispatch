import type { ReactNode } from "react";

interface LookupSectionHeadingProps {
  title: string;
  suffix?: ReactNode;
}

/** 运营/门店看板查找分区标题（统一字号，无副标题提示） */
export function LookupSectionHeading({
  title,
  suffix,
}: LookupSectionHeadingProps) {
  return (
    <h2 className="text-sm font-semibold text-slate-900">
      {title}
      {suffix}
    </h2>
  );
}
