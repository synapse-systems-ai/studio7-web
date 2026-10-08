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
  const dimension = promo ? Math.round(size * 1.45) : size;

  const promoImageClass =
    "h-auto w-auto max-w-[min(188px,48vw)] object-contain mix-blend-screen opacity-[0.98] [mask-image:radial-gradient(circle_at_center,#000_42%,transparent_68%)]";

  const image = promo ? (
    <span className={cn("inline-flex items-center justify-center", className)}>
      <Image
        src="/st7-logo.png"
        alt="Studio 7"
        width={dimension}
        height={dimension}
        priority={priority}
        className={promoImageClass}
      />
    </span>
  ) : (
    <Image
      src="/st7-logo.png"
      alt="Studio 7"
      width={dimension}
      height={dimension}
      priority={priority}
      className={cn("rounded-full shadow-xl ring-1 ring-white/15", className)}
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
