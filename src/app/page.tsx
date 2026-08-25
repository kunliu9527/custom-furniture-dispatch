import { AuthorCredit } from "@/components/home/author-credit";
import { SyncFooterStatus } from "@/components/sync/sync-footer-status";
import { HomeAssistantPanel } from "@/components/home/home-assistant-panel";
import { HomeCompanyRegistrations } from "@/components/home/home-company-registrations";
import { HomeGuestLanding } from "@/components/home/home-guest-landing";
import { HomeHeader } from "@/components/home/home-header";
import { HomeHero } from "@/components/home/home-hero";
import { HomeStatusStrip } from "@/components/home/home-status-strip";

export default function Home() {
  return (
    <div
      className="relative flex min-h-dvh flex-col"
      style={{ background: "var(--bg-grouped-primary)" }}
    >
      <HomeHeader />
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 pt-5 pb-14 sm:gap-6 sm:px-6 sm:pt-7 sm:pb-16">
        <HomeGuestLanding />
        <HomeHero />
        <HomeAssistantPanel />
        <HomeStatusStrip />
        <HomeCompanyRegistrations />
      </div>
      <SyncFooterStatus />
      <AuthorCredit />
    </div>
  );
}
