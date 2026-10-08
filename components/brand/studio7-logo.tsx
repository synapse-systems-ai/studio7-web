import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Studio7LogoProps = {
  size?: number;
  className?: string;
  href?: string;
  priority?: boolean;
  /** Promo landings: larger mark, no circular frame */
  variant?: "default" | "promo";
};

export function Studio7Logo({
  size = 96,
  className,
  href,
  priority = false,
  variant = "default",
}: Studio7LogoProps) {
  const promo = variant === "promo";
  const dimension = promo ? Math.round(size * 1.35) : size;

  const image = (
    <Image
      src="/st7-logo.png"
      alt="Studio 7"
      width={dimension}
      height={dimension}
      priority={priority}
      className={cn(
        promo ? "h-auto w-auto max-w-[min(168px,44vw)] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]" : "rounded-full shadow-xl ring-1 ring-white/15",
        className,
      )}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 transition-opacity hover:opacity-90">
        {image}
      </Link>
    );
  }

  return image;
}
