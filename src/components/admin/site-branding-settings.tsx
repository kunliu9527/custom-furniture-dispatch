"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import {
  DEFAULT_SITE_BRANDING,
  DEFAULT_STANDARD_CONTRACT_TEXT,
} from "@/lib/site-branding";
import { canManageStaff } from "@/lib/permissions";
import { FormEvent, useEffect, useState } from "react";

export function SiteBrandingSettings() {
  const { user, siteBranding, updateSiteBranding } = useAuth();
  const [badgeLabel, setBadgeLabel] = useState(siteBranding.badgeLabel);
  const [headlineTitle, setHeadlineTitle] = useState(siteBranding.headlineTitle);
  const [standardContractText, setStandardContractText] = useState(
    siteBranding.standardContractText,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBadgeLabel(siteBranding.badgeLabel);
    setHeadlineTitle(siteBranding.headlineTitle);
    setStandardContractText(siteBranding.standardContractText);
  }, [siteBranding]);

  if (!canManageStaff(user)) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
        仅管理员可修改公司名与首页标题
      </div>
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const result = updateSiteBranding({
      badgeLabel: badgeLabel.trim(),
      headlineTitle: headlineTitle.trim(),
      standardContractText: standardContractText.trim(),
    });
    if (!result.ok) {
      setError(result.error ?? "保存失败");
      return;
    }
    setMessage("已保存，首页与顶栏标题将同步更新");
    window.setTimeout(() => setMessage(null), 3000);
  }

  function handleReset() {
    setBadgeLabel(DEFAULT_SITE_BRANDING.badgeLabel);
    setHeadlineTitle(DEFAULT_SITE_BRANDING.headlineTitle);
    setStandardContractText(DEFAULT_SITE_BRANDING.standardContractText);
    setMessage(null);
    setError(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm"
    >
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-900">公司名修改</h2>
        <p className="mt-1 text-xs text-slate-500">
          修改首页徽章文案、主标题与电子签约标准合同正文；保存后各电脑通过云端同步一致（已开启云端同步时）。
        </p>
      </div>

      <div className="grid max-w-xl gap-4">
        <Input
          label="首页徽章文案"
          name="badgeLabel"
          required
          maxLength={40}
          value={badgeLabel}
          onChange={(e) => setBadgeLabel(e.target.value)}
          placeholder={DEFAULT_SITE_BRANDING.badgeLabel}
        />
        <Input
          label="首页主标题（含顶栏名称）"
          name="headlineTitle"
          required
          maxLength={40}
          value={headlineTitle}
          onChange={(e) => setHeadlineTitle(e.target.value)}
          placeholder={DEFAULT_SITE_BRANDING.headlineTitle}
        />
        <Textarea
          label="电子签约标准合同正文"
          name="standardContractText"
          required
          rows={4}
          value={standardContractText}
          onChange={(e) => setStandardContractText(e.target.value)}
          placeholder={DEFAULT_STANDARD_CONTRACT_TEXT}
        />
      </div>

      <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          预览
        </p>
        <div className="mt-3 text-center">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-600/10">
            {badgeLabel.trim() || DEFAULT_SITE_BRANDING.badgeLabel}
          </span>
          <p className="mt-4 text-lg font-bold text-indigo-900">
            <span className="inline-block rounded-2xl bg-indigo-100 px-4 py-2 ring-1 ring-indigo-200/80">
              {headlineTitle.trim() || DEFAULT_SITE_BRANDING.headlineTitle}
            </span>
          </p>
        </div>
        <p className="mt-4 text-xs text-slate-500">签约页标准条款预览：</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
          {standardContractText.trim() || DEFAULT_STANDARD_CONTRACT_TEXT}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="submit">保存</Button>
        <Button type="button" variant="secondary" onClick={handleReset}>
          恢复默认
        </Button>
        {message ? (
          <span className="text-sm text-emerald-600">{message}</span>
        ) : null}
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
      </div>
    </form>
  );
}
