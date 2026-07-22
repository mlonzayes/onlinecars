import { resolveTemplate } from "@/lib/tenant-templates";
import { getPlanLimits } from "@/lib/plans";
import { TenantHeader } from "./tenant-header";
import { TenantFooter } from "./tenant-footer";
import { TenantAnnouncementBar } from "./tenant-announcement-bar";
import { WhatsAppFab } from "./whatsapp-fab";
import type { Dealership } from "@prisma/client";
import type { DealershipTheme, SocialLinks } from "@/types";

interface TenantChromeProps {
  dealership: Dealership;
  basePath: string;
  children: React.ReactNode;
}

/**
 * Chrome del sitio público del tenant: aplica los tokens del template (colores,
 * fuente) y renderiza header + footer + FAB de WhatsApp alrededor del contenido.
 * Lo usan tanto el layout del tenant como la página de vista previa del panel.
 */
export function TenantChrome({ dealership, basePath, children }: TenantChromeProps) {
  const theme = dealership.theme as DealershipTheme | null;
  const primaryColor = theme?.colorPrimary ?? "#2563eb";
  const primaryDark = adjustBrightness(primaryColor, -20);
  const template = resolveTemplate(dealership.templateId);

  // La barra de anuncio se muestra solo si el template la soporta Y el dealer
  // cargó un mensaje. Cuando está, empuja el header y el contenido hacia abajo.
  const announcement = dealership.announcement?.trim();
  const showBanner = Boolean(template.hasAnnouncementBar && announcement);
  const solidHeader = Boolean(template.solidHeader);

  return (
    <div
      data-template={template.id}
      data-tone={template.tone}
      className={`tenant-scope flex min-h-screen flex-col bg-[var(--tenant-bg)] text-[var(--tenant-fg)] ${template.font.variable}`}
      style={
        {
          "--tenant-primary": primaryColor,
          "--tenant-primary-dark": primaryDark,
          ...template.tokens,
        } as React.CSSProperties
      }
    >
      {showBanner && <TenantAnnouncementBar text={announcement!} />}
      <TenantHeader
        name={dealership.name}
        logo={dealership.logo}
        basePath={basePath}
        withBanner={showBanner}
        solid={solidHeader}
      />
      {/* pt-24 reserva espacio para el navbar flotante; +2.5rem si hay barra. */}
      <main className={showBanner ? "flex-1 pt-[8.5rem]" : "flex-1 pt-24"}>{children}</main>
      <TenantFooter
        name={dealership.name}
        logo={dealership.logo}
        description={dealership.description}
        phone={dealership.phone}
        email={dealership.email}
        whatsapp={dealership.whatsapp}
        address={dealership.address}
        city={dealership.city}
        province={dealership.province}
        socialLinks={(dealership.socialLinks as SocialLinks | null) ?? null}
        basePath={basePath}
        showPoweredBy={getPlanLimits(dealership).showPoweredBy}
      />
      {/* FAB de WhatsApp: número cargado + toggle activo + plan que lo permite. */}
      {dealership.whatsapp &&
        dealership.whatsappFabEnabled &&
        getPlanLimits(dealership).allowWhatsappFab && (
          <WhatsAppFab whatsapp={dealership.whatsapp} message={dealership.whatsappMessage} />
        )}
    </div>
  );
}

/**
 * Ajusta el brillo de un color hex. amount positivo = más claro, negativo = más oscuro.
 */
function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
