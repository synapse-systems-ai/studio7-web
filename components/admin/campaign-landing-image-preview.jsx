'use client'

import Link from 'next/link'
import { STUDIO7_SITE_HERO_PHOTOS } from '@/lib/studio7-site-assets'
import { Studio7SiteHeroBackground } from '@/components/promo/studio7-site-hero-background'
import { cn } from '@/lib/utils'

export function CampaignLandingImagePreview({ previewImage, brandId, galleryHref }) {
  if (previewImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={previewImage} alt="" className="h-full w-full object-cover" />
    )
  }

  if (brandId === 'studio7') {
    return (
      <div className="relative h-full w-full">
        <Studio7SiteHeroBackground />
        <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/90">
            Rotating gallery background
          </p>
          {galleryHref ? (
            <Link href={galleryHref} className="mt-1 text-[11px] text-white/75 underline-offset-2 hover:underline">
              Edit in Background gallery
            </Link>
          ) : null}
        </div>
      </div>
    )
  }

  const fallback = STUDIO7_SITE_HERO_PHOTOS[0]?.src
  if (fallback) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={fallback} alt="" className={cn('h-full w-full object-cover opacity-80')} />
    )
  }

  return <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No preview</div>
}
