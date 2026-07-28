"use client";

import { ISSUE_TAG_OPTIONS } from "@/lib/issue-tags";
import type { OrderIssueTag } from "@/lib/types";

interface IssueTagsEditorProps {
  value: OrderIssueTag[];
  onChange: (tags: OrderIssueTag[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function IssueTagsEditor({
  value,
  onChange,
  disabled = false,
  compact = false,
}: IssueTagsEditorProps) {
  function toggle(tag: OrderIssueTag) {
    if (disabled) return;
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  }

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? "" : "gap-1.5"}`}>
      {ISSUE_TAG_OPTIONS.map((opt) => {
        const active = value.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(opt.id)}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
              active
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
