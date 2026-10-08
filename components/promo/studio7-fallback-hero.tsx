/** Shared full-screen fallback when no campaign image (home + promo loading). */
export function Studio7FallbackHero() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-violet-950 to-black">
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/10 sm:from-black/50 sm:via-black/35 sm:to-black/25" />
    </div>
  );
}
