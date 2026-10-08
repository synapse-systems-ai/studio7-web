import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Studio7LogoProps = {
  size?: number;
  className?: string;
  href?: string;
  priority?: boolean;
};

export function Studio7Logo({ size = 96, className, href, priority = false }: Studio7LogoProps) {
  const image = (
    <Image
      src="/st7-logo.png"
      alt="Studio 7"
      width={size}
      height={size}
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
