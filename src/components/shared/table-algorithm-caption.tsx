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
        className="px-2.5 py-1 text-left text-[10px] font-normal leading-snug text-slate-500"
      >
        {children}
      </th>
    </tr>
  );
}
