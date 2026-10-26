import Link from "next/link";
import { PiArrowRight } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PrimaryCtaProps {
  href: string;
  children: React.ReactNode;
  size?: "md" | "lg";
  className?: string;
}

/**
 * Botón primario de la web de marketing: el Button de shadcn renderizado como
 * Link (mismo patrón que las pages del dashboard), en el azul de la marca.
 */
export function PrimaryCta({ href, children, size = "md", className }: PrimaryCtaProps) {
  return (
    <Button
      nativeButton={false}
      render={<Link href={href} />}
      className={cn(
        "bg-brand text-white shadow-sm shadow-brand/25 hover:bg-brand-deep [a]:hover:bg-brand-deep",
        size === "lg" ? "h-12 gap-2 px-6 text-base" : "h-10 gap-2 px-5 text-sm",
        className
      )}
    >
      {children}
      <PiArrowRight data-icon="inline-end" aria-hidden />
    </Button>
  );
}
