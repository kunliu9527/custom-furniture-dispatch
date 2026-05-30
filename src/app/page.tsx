import { AuthorCredit } from "@/components/home/author-credit";
import { HomeBoardCards } from "@/components/home/home-board-cards";
import { HomeHeader } from "@/components/home/home-header";
import { HomeHero } from "@/components/home/home-hero";
import { HomeRedirect } from "@/components/home/home-redirect";

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-col bg-gradient-to-b from-indigo-50/50 via-slate-50 to-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]"
        aria-hidden
      />
      <HomeHeader />
      <HomeRedirect />
      <div className="relative mx-auto flex w-full max-w-4xl flex-col px-4 pt-6 pb-14 sm:px-6 sm:pt-8 sm:pb-16">
        <HomeHero />
        <HomeBoardCards />
      </div>
      <AuthorCredit />
    </div>
  );
}
