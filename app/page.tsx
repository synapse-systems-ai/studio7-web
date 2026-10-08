import Link from "next/link";
import { Studio7FallbackHero } from "@/components/promo/studio7-fallback-hero";
import { listLiveStudio7Campaigns } from "@/lib/studio7-live-campaigns";

export const instant = false;

export default async function Home() {
  const campaigns = await listLiveStudio7Campaigns();

  return (
    <div className="fixed inset-0 h-dvh w-full overflow-hidden text-white">
      <Studio7FallbackHero />
      <div className="relative z-10 flex h-full w-full items-center justify-center overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white/10 px-5 py-7 text-center shadow-2xl backdrop-blur-md sm:bg-white/92 sm:text-black">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-200 sm:text-violet-700">
            Studio 7
          </p>
          <h1 className="mt-3 text-xl font-bold leading-tight sm:text-2xl">Event guest list &amp; promos</h1>
          <p className="mt-3 text-sm text-zinc-200 sm:text-gray-600">
            Open the link or QR for your event — this page is not the signup form.
          </p>

          <p className="mt-6">
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-violet-200 underline-offset-2 hover:underline sm:text-violet-800"
            >
              Team admin sign in
            </Link>
          </p>

          {campaigns.length > 0 && (
            <div className="mt-6 text-left">
              <p className="text-center text-[11px] font-medium uppercase tracking-wide text-zinc-300 sm:text-gray-500">
                Live campaigns
              </p>
              <ul className="mt-3 space-y-2">
                {campaigns.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/promo/${c.slug}`}
                      className="block rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm transition hover:bg-black/30 sm:border-gray-200 sm:bg-white sm:hover:bg-gray-50"
                    >
                      <span className="font-medium">{c.headline || c.name || c.slug}</span>
                      <span className="mt-0.5 block text-xs text-zinc-400 sm:text-gray-500">/promo/{c.slug}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
