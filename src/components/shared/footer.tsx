import Image from "next/image";
import Link from "next/link";
import { PiInstagramLogo } from "react-icons/pi";
import { SITE_PHONE, SITE_PHONE_DISPLAY } from "@/lib/seo";

const PRODUCT_LINKS = [
  { href: "/#producto", label: "El producto" },
  { href: "/#integraciones", label: "Integraciones" },
  { href: "/precios", label: "Planes" },
  { href: "/blog", label: "Blog" },
  { href: "/#faq", label: "Preguntas frecuentes" },
];

const LEGAL_LINKS = [
  { href: "/terminos", label: "Términos" },
  { href: "/privacidad", label: "Privacidad" },
];

const LINK = "font-light text-ink-soft transition hover:text-ink";
const HEADING = "text-xs font-medium uppercase tracking-[0.14em] text-ink";

/**
 * Footer de la web de marketing: claro, liviano y en una grilla que en mobile
 * queda en dos columnas (marca arriba a todo el ancho).
 */
export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-paper px-4 pb-8 pt-14 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-12">
          <div className="col-span-2 md:col-span-5">
            <Image src="/logo/motorflow_light.png" alt="motorflow" width={132} height={132} className="h-auto w-[132px]" />
            <p className="mt-4 max-w-xs text-sm font-light leading-relaxed text-ink-soft">
              El sitio web y el sistema de tu concesionaria, que manejás con la IA que uses.
            </p>
            {/* Redes de motorflow (la plataforma), no las del concesionario */}
            <a
              href="https://instagram.com/motorfl0w"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de motorflow"
              className="mt-5 inline-flex size-9 items-center justify-center rounded-full border border-ink/10 text-ink-soft transition hover:border-ink/30 hover:text-ink"
            >
              <PiInstagramLogo className="size-4" />
            </a>
          </div>

          <div className="md:col-span-3">
            <h3 className={HEADING}>Producto</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={LINK}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h3 className={HEADING}>Contacto</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href="mailto:ventas@motorflowapp.com" className={`${LINK} whitespace-nowrap text-[13px] sm:text-sm`}>
                  ventas@motorflowapp.com
                </a>
              </li>
              <li>
                <a href={`tel:${SITE_PHONE}`} className={LINK}>
                  {SITE_PHONE_DISPLAY}
                </a>
              </li>
              <li className="font-light text-ink-soft">Lun a Vie · 9 a 18 hs</li>
              <li>
                <Link href="/#contacto" className={LINK}>
                  Dejanos tu consulta
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink/10 pt-6 text-xs font-light text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} motorflow · Un producto de{" "}
            <a
              href="https://mwstudiodigital.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink transition hover:text-brand"
            >
              MW Studio Digital
            </a>
          </span>
          <span className="flex gap-5">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="transition hover:text-ink">
                {l.label}
              </Link>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
