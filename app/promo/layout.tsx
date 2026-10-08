import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio 7 - Guest list",
  description: "Sign up for Studio 7 events and parties.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: false },
};

export const instant = false;

/** Standalone promo landing - no site chrome. */
export default function PromoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="light fixed inset-0 h-dvh overflow-hidden overscroll-none bg-black text-black antialiased">
      {children}
    </div>
  );
}
