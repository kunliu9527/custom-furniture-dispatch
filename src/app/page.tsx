import { AuthorCredit } from "@/components/home/author-credit";
import { HomeBoardCards } from "@/components/home/home-board-cards";
import { HomeHeader } from "@/components/home/home-header";
import { HomeRedirect } from "@/components/home/home-redirect";

const WORKFLOW_STEPS = [
  "待量尺",
  "已量尺",
  "已出图",
  "已签约",
  "已下单",
  "已安装",
] as const;

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-col bg-gradient-to-b from-indigo-50/50 via-slate-50 to-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]"
        aria-hidden
      />
      <HomeHeader />
      <HomeRedirect />
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-14 sm:px-6 sm:py-16">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium tracking-wide text-indigo-700 ring-1 ring-indigo-600/10">
            蓬蓬· 派单原型
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            <span className="inline-block rounded-2xl bg-indigo-100 px-5 py-2.5 text-indigo-900 shadow-sm ring-1 ring-indigo-200/80">
              设计师超级定单系统
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
            数据演示门店派单、设计师跟单与经理统计，各页面数据实时同步（本地存储）。
          </p>
        </div>

        <HomeBoardCards />

        <div className="mt-10 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            状态流转
          </p>
          <ol className="mt-3 flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
            {WORKFLOW_STEPS.map((step, index) => (
              <li key={step} className="flex items-center gap-1 sm:gap-1.5">
                <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 shadow-sm ring-1 ring-slate-200/80">
                  {step}
                </span>
                {index < WORKFLOW_STEPS.length - 1 ? (
                  <span
                    className="text-slate-300 select-none"
                    aria-hidden
                  >
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <AuthorCredit />
    </div>
  );
}
