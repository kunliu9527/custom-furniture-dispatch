import { RegisterForm } from "@/components/register/register-form";
import { HomeHeader } from "@/components/home/home-header";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div
      className="relative flex min-h-dvh flex-col"
      style={{ background: "var(--bg-grouped-primary)" }}
    >
      <HomeHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="vi-surface rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-bold" style={{ color: "var(--label-primary)" }}>
            注册新公司
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--label-secondary)" }}
          >
            个人版 · 设计经理级权限，数据按公司独立
          </p>
          <div className="mt-5">
            <RegisterForm />
          </div>
          <p className="mt-5 text-center text-sm" style={{ color: "var(--label-secondary)" }}>
            已有账号？{" "}
            <Link href="/" className="font-medium underline">
              返回首页登录
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
