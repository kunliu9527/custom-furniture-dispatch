"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { formatManagedStoresLabel } from "@/lib/assigned-stores";
import { ACCESS_LEVEL_LABELS } from "@/lib/staff-access";
import { getDefaultPathForRole } from "@/lib/role-routes";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface LoginPanelProps {
  variant?: "home" | "inline";
  redirectOnLogin?: boolean;
}

export function LoginPanel({
  variant = "home",
  redirectOnLogin = true,
}: LoginPanelProps) {
  const router = useRouter();
  const { user, isHydrated, login, logout, changeOwnPassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function handleLogout() {
    logout();
    router.push("/");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = login(username.trim(), password);
    if (!result.ok) {
      setError(result.error ?? "登录失败");
      return;
    }
    setError("");
    setOpen(false);
    setUsername("");
    setPassword("");

    if (redirectOnLogin) {
      router.push(getDefaultPathForRole(result.role, result.accessLevel));
    }
  }

  function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("两次输入的新密码不一致");
      setPasswordMessage("");
      return;
    }
    const result = changeOwnPassword(currentPassword, newPassword);
    if (!result.ok) {
      setPasswordError(result.error ?? "修改失败");
      setPasswordMessage("");
      return;
    }
    setPasswordError("");
    setPasswordMessage("密码已更新，下次登录请使用新密码");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordOpen(false);
    window.setTimeout(() => setPasswordMessage(""), 4000);
  }

  if (!isHydrated) {
    return (
      <span className="text-sm text-slate-400">
        {variant === "home" ? "加载…" : ""}
      </span>
    );
  }

  if (user) {
    return (
      <div
        className={
          variant === "home"
            ? "relative flex items-center gap-3"
            : "relative flex flex-wrap items-center gap-2"
        }
      >
        <div className="text-right text-sm">
          <p className="font-medium text-slate-900">{user.displayName}</p>
          <p className="text-xs text-slate-500">
            {ACCESS_LEVEL_LABELS[user.accessLevel]}
            {user.assignedStores?.length
              ? ` · ${formatManagedStoresLabel(user.assignedStores)}`
              : user.homeStore
                ? ` · ${user.homeStore}`
                : ""}
          </p>
          {passwordMessage ? (
            <p className="mt-1 text-xs text-emerald-600">{passwordMessage}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          className="text-xs"
          onClick={() => setPasswordOpen((v) => !v)}
        >
          改密
        </Button>
        <Button type="button" variant="secondary" onClick={handleLogout}>
          退出
        </Button>
        {passwordOpen ? (
          <form
            onSubmit={handleChangePassword}
            className={`absolute z-50 mt-2 rounded-xl border border-slate-200 bg-white p-4 shadow-lg ${
              variant === "home" ? "right-0 top-full w-72" : "right-0 top-full w-64"
            }`}
          >
            <p className="text-sm font-semibold text-slate-900">修改密码</p>
            <div className="mt-3 space-y-3">
              <Input
                label="当前密码"
                name="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setPasswordError("");
                }}
              />
              <Input
                label="新密码"
                name="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError("");
                }}
              />
              <Input
                label="确认新密码"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError("");
                }}
              />
            </div>
            {passwordError ? (
              <p className="mt-2 text-sm text-red-600">{passwordError}</p>
            ) : null}
            <div className="mt-4 flex gap-2">
              <Button type="submit" className="flex-1">
                保存
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPasswordOpen(false)}
              >
                取消
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button type="button" onClick={() => setOpen((v) => !v)}>
        登录
      </Button>
      {open ? (
        <form
          onSubmit={handleSubmit}
          className={`absolute z-50 mt-2 rounded-xl border border-slate-200 bg-white p-4 shadow-lg ${
            variant === "home" ? "right-0 w-72" : "right-0 w-64"
          }`}
        >
          <p className="text-sm font-semibold text-slate-900">账号登录</p>
          <p className="mt-1 text-xs text-slate-500">请输入账号与密码</p>
          <div className="mt-3 space-y-3">
            <Input
              label="账号"
              name="username"
              required
              placeholder="请输入账号"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
            />
            <Input
              label="密码"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="请输入密码"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
            />
          </div>
          {error ? (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <Button type="submit" className="flex-1">
              确认登录
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
