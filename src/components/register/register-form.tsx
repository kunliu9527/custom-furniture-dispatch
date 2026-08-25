"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { registerCompany } from "@/lib/companies-api";
import { isValidCnMobile } from "@/lib/phone";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

/**
 * 注册新公司（个人版）：
 * 创建独立公司数据快照，注册者即该公司唯一人员 —— 设计经理（accessLevel=design_manager，总部，全公司范围）；
 * 门店为注册者自定义（公司）门店。
 */
export function RegisterForm() {
  const router = useRouter();
  const { refreshCompanies, selectLoginCompany, login, isHydrated, user } =
    useAuth();
  const [companyName, setCompanyName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [stores, setStores] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    return (
      <div className="text-center">
        <p
          className="text-sm"
          style={{ color: "var(--label-secondary)" }}
        >
          您已登录，可直接使用工作台。
        </p>
        <Button
          type="button"
          className="mt-4"
          onClick={() => router.push("/")}
        >
          返回首页
        </Button>
      </div>
    );
  }

  if (!isHydrated) {
    return (
      <p className="text-center text-sm" style={{ color: "var(--label-tertiary)" }}>
        加载中…
      </p>
    );
  }

  function updateStore(index: number, value: string) {
    setStores((prev) => prev.map((s, i) => (i === index ? value : s)));
    setError("");
  }

  function addStore() {
    setStores((prev) => [...prev, ""]);
  }

  function removeStore(index: number) {
    setStores((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedStores = stores.map((s) => s.trim()).filter(Boolean);
    const trimmedName = companyName.trim();
    const trimmedAccount = accountName.trim();

    if (!trimmedName) {
      setError("请填写公司名称");
      return;
    }
    if (!trimmedAccount) {
      setError("请填写账号（姓名）");
      return;
    }
    if (!isValidCnMobile(phone)) {
      setError("请输入有效的 11 位手机号码");
      return;
    }
    if (!password.trim()) {
      setError("请填写密码");
      return;
    }
    if (trimmedStores.length === 0) {
      setError("请至少添加一个门店");
      return;
    }
    if (trimmedAccount === "admin") {
      setError("账号名称不可为 admin");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const result = await registerCompany({
        name: trimmedName,
        stores: trimmedStores,
        registrant: {
          name: trimmedAccount,
          password: password.trim(),
          phone: phone.trim(),
        },
      });
      await refreshCompanies();
      const switched = await selectLoginCompany(result.company.id);
      if (!switched.ok) {
        setError(`注册成功，但进入公司失败：${switched.error ?? ""}，请返回首页登录`);
        return;
      }
      const loggedIn = login(trimmedAccount, password.trim());
      if (!loggedIn.ok) {
        setError("注册成功，但自动登录失败，请返回首页手动登录");
        return;
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-[13px] leading-relaxed" style={{ color: "var(--label-secondary)" }}>
        注册后创建贵公司独立的数据空间（数据按公司隔离）；注册者默认获得
        <strong className="font-semibold" style={{ color: "var(--label-primary)" }}>
          个人版 · 设计经理
        </strong>
        权限，可自定义门店并管理本公司订单。公司内添加人员由系统管理员统一管理。
      </p>

      <Input
        label="公司名称"
        name="companyName"
        required
        placeholder="如：某某家居"
        value={companyName}
        onChange={(e) => {
          setCompanyName(e.target.value);
          setError("");
        }}
      />
      <Input
        label="账号（姓名）"
        name="accountName"
        required
        placeholder="请输入姓名作为登录账号"
        value={accountName}
        onChange={(e) => {
          setAccountName(e.target.value);
          setError("");
        }}
      />
      <Input
        label="手机号码（必填，用于管理员联系）"
        name="phone"
        type="tel"
        autoComplete="tel"
        inputMode="numeric"
        maxLength={11}
        required
        placeholder="11 位手机号"
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value.replace(/\D/g, ""));
          setError("");
        }}
      />
      <Input
        label="密码"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        placeholder="请设置登录密码"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError("");
        }}
      />

      <div>
        <span className="vi-field-label">公司门店（可添加多个）</span>
        <div className="mt-1.5 space-y-2">
          {stores.map((store, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                label=""
                name={`store-${index}`}
                placeholder={`门店 ${index + 1}，如：${companyName.trim() || "门店"}一店`}
                value={store}
                onChange={(e) => updateStore(index, e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 shrink-0 px-2 text-xs"
                disabled={stores.length <= 1}
                onClick={() => removeStore(index)}
              >
                删除
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-2 px-3 text-xs"
          onClick={addStore}
        >
          + 添加门店
        </Button>
      </div>

      {error ? (
        <p className="text-sm" style={{ color: "var(--system-red)" }}>
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "注册中…" : "注册并进入"}
      </Button>
    </form>
  );
}
