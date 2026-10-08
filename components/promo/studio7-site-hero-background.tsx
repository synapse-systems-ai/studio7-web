"use client";

import { useEffect, useState } from "react";
import { STUDIO7_SITE_HERO_PHOTOS } from "@/lib/studio7-site-assets";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 6000;

/** Full-bleed rotating hero photos (same set as studio7rsa.com). */
export function Studio7SiteHeroBackground({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % STUDIO7_SITE_HERO_PHOTOS.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-black", className)}>
      {STUDIO7_SITE_HERO_PHOTOS.map((photo, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={photo.src}
          src={photo.src}
          alt=""
          aria-hidden={i !== index}
          draggable={false}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-[1.4s] ease-in-out",
            i === index ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-black/15 sm:from-black/55 sm:via-black/35 sm:to-black/20" />
    </div>
  );
}
