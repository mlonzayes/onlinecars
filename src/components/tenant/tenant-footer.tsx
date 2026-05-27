import Link from "next/link";
import Image from "next/image";
import { Car, MapPin, Phone, Mail, MessageCircle } from "lucide-react";

interface TenantFooterProps {
  // Solo los campos que el footer realmente usa — evitamos arrastrar el objeto Prisma
  // completo (Date fields rompen el boundary server→client si en algún momento se vuelve client).
  name: string;
  logo?: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  basePath: string;
}

export function TenantFooter({
  name,
  logo,
  description,
  phone,
  email,
  whatsapp,
  address,
  city,
  province,
  basePath,
}: TenantFooterProps) {
  const year = new Date().getFullYear();
  const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : null;
  const locationParts = [address, city, province].filter(Boolean);

  return (
    <footer className="border-t border-slate-200 bg-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1 — Brand */}
          <div className="space-y-4 lg:col-span-2">
            {logo ? (
              <div className="relative h-12 w-full max-w-[200px]">
                <Image
                  src={logo}
                  alt={`Logo de ${name}`}
                  fill
                  className="object-contain object-left"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--tenant-primary)] text-white shadow-sm">
                  <Car className="h-5 w-5" />
                </div>
                <span className="text-lg font-semibold tracking-tight text-slate-900">
                  {name}
                </span>
              </div>
            )}
            {description && (
              <p className="max-w-md text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            )}
            {locationParts.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-slate-500">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{locationParts.join(", ")}</span>
              </div>
            )}
          </div>

          {/* Col 2 — Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Navegación
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={basePath}
                  className="text-sm text-slate-600 transition-colors hover:text-[var(--tenant-primary)]"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/catalogo`}
                  className="text-sm text-slate-600 transition-colors hover:text-[var(--tenant-primary)]"
                >
                  Catálogo
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/cotizar`}
                  className="text-sm text-slate-600 transition-colors hover:text-[var(--tenant-primary)]"
                >
                  Vender mi auto
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}#opiniones`}
                  className="text-sm text-slate-600 transition-colors hover:text-[var(--tenant-primary)]"
                >
                  Opiniones
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}#contacto`}
                  className="text-sm text-slate-600 transition-colors hover:text-[var(--tenant-primary)]"
                >
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 — Contacto */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Contacto
            </h3>
            <ul className="space-y-2.5">
              {phone && (
                <li>
                  <a
                    href={`tel:${phone}`}
                    className="flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-[var(--tenant-primary)]"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    {phone}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-[var(--tenant-primary)]"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    {email}
                  </a>
                </li>
              )}
              {whatsappUrl && (
                <li>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-emerald-600"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:gap-2">
          <p className="text-xs text-slate-500">
            © {year} {name}. Todos los derechos reservados.
          </p>
          <p className="text-xs text-slate-500">
            Potenciado por{" "}
            <a
              href="https://motorflowapp.com"
              className="font-medium text-[var(--tenant-primary)] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              motorflow
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
