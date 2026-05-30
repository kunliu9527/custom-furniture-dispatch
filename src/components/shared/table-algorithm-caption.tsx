import type { ReactNode } from "react";

interface TableAlgorithmCaptionProps {
  children: ReactNode;
  className?: string;
}

/** 表格 thead 内算法说明行 */
export function TableAlgorithmCaption({
  children,
  className = "",
}: TableAlgorithmCaptionProps) {
  return (
    <tr className={`bg-slate-50/95 ${className}`}>
      <th
        colSpan={100}
        className="px-3 py-2 text-left text-[11px] font-normal leading-relaxed text-slate-500"
      >
        {children}
      </th>
    </tr>
  );
}
