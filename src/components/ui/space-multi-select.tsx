"use client";

import { CUSTOM_SPACES } from "@/lib/constants";
import type { CustomSpace } from "@/lib/types";

interface SpaceMultiSelectProps {
  label?: string;
  value: CustomSpace[];
  onChange: (spaces: CustomSpace[]) => void;
}

export function SpaceMultiSelect({
  label = "定制空间",
  value,
  onChange,
}: SpaceMultiSelectProps) {
  function toggle(space: CustomSpace) {
    if (value.includes(space)) {
      if (value.length === 1) return;
      onChange(value.filter((s) => s !== space));
      return;
    }
    onChange([...value, space]);
  }

  return (
    <fieldset className="sm:col-span-2">
      <legend className="text-sm font-medium text-slate-700">{label}</legend>
      <p className="mt-1 text-xs text-slate-500">可多选，至少保留一项</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {CUSTOM_SPACES.map((space) => {
          const checked = value.includes(space);
          return (
            <button
              key={space}
              type="button"
              onClick={() => toggle(space)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                checked
                  ? "border-blue-300 bg-blue-50 text-blue-800 ring-1 ring-blue-200"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {space}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
