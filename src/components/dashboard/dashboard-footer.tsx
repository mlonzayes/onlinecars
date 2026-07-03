import Link from "next/link";
import { LifeBuoy, Mail, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/tenant/social-icons";
import { SITE_PHONE, SITE_PHONE_DISPLAY, SITE_WHATSAPP_URL } from "@/lib/seo";

export function DashboardFooter() {
  return (
    <>
      <footer className="border-t bg-muted/20 px-6 py-4">
        <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} motorflow. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <a
              href="mailto:soporte@motorflowapp.com"
              className="flex items-center gap-1.5 transition hover:text-foreground"
            >
              <Mail className="size-3.5" />
              soporte@motorflowapp.com
            </a>
            <a
              href={`tel:${SITE_PHONE}`}
              className="flex items-center gap-1.5 transition hover:text-foreground"
            >
              <Phone className="size-3.5" />
              {SITE_PHONE_DISPLAY}
            </a>
            <a
              href={SITE_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition hover:text-[#25D366]"
            >
              <WhatsAppIcon className="size-3.5" />
              WhatsApp
            </a>
          </div>
        </div>
      </footer>

      <Link
        href="mailto:soporte@motorflowapp.com"
        title="Contactar soporte"
        aria-label="Contactar soporte"
        className="fixed bottom-6 right-6 z-50 flex size-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:scale-105 hover:bg-blue-700"
      >
        <LifeBuoy className="size-6" />
      </Link>
    </>
  );
}
