"use client";

import { IssueTagsEditor } from "@/components/shared/issue-tags-editor";
import type { OrderIssueTag } from "@/lib/types";

interface OrderIssueTagsCellProps {
  tags: OrderIssueTag[];
  readOnly?: boolean;
  onSave: (tags: OrderIssueTag[]) => void;
}

export function OrderIssueTagsCell({
  tags,
  readOnly = false,
  onSave,
}: OrderIssueTagsCellProps) {
  if (readOnly) {
    return (
      <span className="text-xs text-slate-600">
        {tags.length > 0 ? tags.join("、") : "—"}
      </span>
    );
  }

  return (
    <IssueTagsEditor
      value={tags}
      onChange={onSave}
      compact
    />
  );
}
