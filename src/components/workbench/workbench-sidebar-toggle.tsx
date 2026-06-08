"use client";

interface WorkbenchSidebarToggleProps {
  collapsed: boolean;
  onToggle: () => void;
  /** 侧栏展开时贴在右缘；收起时贴在正文左缘 */
  variant: "collapse" | "expand";
}

export function WorkbenchSidebarToggle({
  collapsed,
  onToggle,
  variant,
}: WorkbenchSidebarToggleProps) {
  const isExpand = variant === "expand";
  const label = collapsed || isExpand ? "展开侧栏" : "收起侧栏";

  return (
    <button
      type="button"
      onClick={onToggle}
      title={label}
      aria-label={label}
      aria-expanded={!collapsed}
      className={`vi-workbench-sidebar-toggle ${
        isExpand ? "vi-workbench-sidebar-toggle-expand" : ""
      }`}
    >
      <span aria-hidden className="text-sm leading-none">
        {collapsed || isExpand ? "›" : "‹"}
      </span>
    </button>
  );
}
