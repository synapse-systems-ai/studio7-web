"use client";

import { useEffect, useState } from "react";
import { STUDIO7_SITE_HERO_PHOTOS } from "@/lib/studio7-site-assets";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 6000;

type HeroPhoto = { src: string; alt: string };

/** Full-bleed rotating hero photos (admin gallery or bundled defaults). */
export function Studio7SiteHeroBackground({ className }: { className?: string }) {
  const [photos, setPhotos] = useState<HeroPhoto[]>(() =>
    STUDIO7_SITE_HERO_PHOTOS.map((p) => ({ src: p.src, alt: p.alt })),
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/promo/hero-slides")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled || !json.slides?.length) return;
        setPhotos(json.slides);
        setIndex(0);
      })
      .catch(() => {
        // keep bundled defaults
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (photos.length < 2) return undefined;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [photos.length]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-black", className)}>
      {photos.map((photo, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${photo.src}-${i}`}
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
