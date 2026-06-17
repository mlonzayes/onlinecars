import { SOCIAL_NETWORKS, SOCIAL_NETWORK_META } from "@/lib/constants";
import type { SocialLinks } from "@/types";
import { SOCIAL_ICON_BY_NETWORK } from "./social-icons";

interface SocialBarProps {
  socialLinks: SocialLinks | null;
  className?: string;
}

// Barra de íconos de redes sociales del concesionario (Instagram, Facebook,
// TikTok, X, Threads). Server component — sin interactividad. WhatsApp NO va acá:
// no es una red social, ya tiene el FAB flotante y el link en el footer. Si no
// hay ninguna red cargada, no renderiza nada.
export function SocialBar({ socialLinks, className }: SocialBarProps) {
  const activeNetworks = SOCIAL_NETWORKS.filter((n) => socialLinks?.[n]);

  if (activeNetworks.length === 0) return null;

  return (
    <ul className={`flex flex-wrap items-center gap-2.5 ${className ?? ""}`}>
      {activeNetworks.map((network) => {
        const Icon = SOCIAL_ICON_BY_NETWORK[network];
        return (
          <li key={network}>
            <SocialLink href={socialLinks![network]!} label={SOCIAL_NETWORK_META[network].label}>
              <Icon className="h-5 w-5" />
            </SocialLink>
          </li>
        );
      })}
    </ul>
  );
}

interface SocialLinkProps {
  href: string;
  label: string;
  children: React.ReactNode;
}

function SocialLink({ href, label, children }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--tenant-border)] bg-[var(--tenant-surface)] text-[var(--tenant-fg-muted)] transition-all hover:scale-105 hover:border-[var(--tenant-primary)] hover:text-[var(--tenant-primary)]"
    >
      {children}
    </a>
  );
}
