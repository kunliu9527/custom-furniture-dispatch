"use client";

import { useAuth } from "@/context/auth-context";
import { DEFAULT_COMPANY_NAME } from "@/lib/company";
import { useState } from "react";

/** 管理员专属：切换当前公司（admin 在各公司均为总权限，数据/人员/门店随之切换） */
export function CompanySwitcher() {
  const {
    companies,
    activeCompanyId,
    switchActiveCompany,
  } = useAuth();
  const [busy, setBusy] = useState(false);

  const options =
    companies.length > 0
      ? companies.map((c) => ({ value: c.id, label: c.name }))
      : [{ value: activeCompanyId, label: DEFAULT_COMPANY_NAME }];

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id || id === activeCompanyId) return;
    setBusy(true);
    try {
      const result = await switchActiveCompany(id);
      if (!result.ok) {
        window.alert(result.error ?? "切换公司失败");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <label
      className="flex items-center gap-1.5 text-xs"
      style={{ color: "var(--label-secondary)" }}
    >
      <span className="hidden lg:inline">当前公司</span>
      <select
        className="vi-field h-8 w-auto max-w-[9rem] px-2 text-xs"
        value={activeCompanyId}
        onChange={handleChange}
        disabled={busy || companies.length === 0}
        aria-label="切换公司"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
