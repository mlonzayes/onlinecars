import Image from "next/image";
import Link from "next/link";
import { PiEnvelope, PiPhone, PiInstagramLogo } from "react-icons/pi";
import { SITE_PHONE, SITE_PHONE_DISPLAY } from "@/lib/seo";

export function Footer() {
  return (
    <footer className="bg-gray-900 px-4 pt-12 pb-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand + tagline */}
          <div className="lg:col-span-1">
            <Image
              src="/logo/motorflow_dark.png"
              alt="motorflow"
              width={150}
              height={40}
              className="h-auto w-auto"
            />
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              La plataforma para concesionarios que quieren vender online sin
              depender de portales ni comisiones.
            </p>
            {/* Redes de motorflow (la plataforma) — no confundir con las redes del concesionario */}
            <a
              href="https://instagram.com/motorfl0w"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de motorflow"
              title="Seguinos en Instagram"
              className="mt-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 text-gray-400 transition hover:border-white hover:text-white"
            >
              <PiInstagramLogo className="h-5 w-5" />
            </a>
          </div>

          {/* Producto */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Producto
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-gray-400">
              {/* #como-funciona y #servicios apuntaban a secciones que ya no se
                  renderizan en la home. Los servicios y el roadmap viven ahora
                  en /precios. */}
              <li><Link href="/#producto" className="transition hover:text-white">El producto</Link></li>
              <li><Link href="/precios" className="transition hover:text-white">Planes y servicios</Link></li>
              <li><Link href="/blog" className="transition hover:text-white">Blog</Link></li>
              <li><Link href="/#faq" className="transition hover:text-white">FAQ</Link></li>
              <li><Link href="/#contacto" className="transition hover:text-white">Contacto</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Contacto
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-gray-400">
              <li>
                <a
                  href="mailto:ventas@motorflowapp.com"
                  className="inline-flex items-center gap-2 transition hover:text-white"
                >
                  <PiEnvelope className="h-4 w-4 shrink-0" />
                  ventas@motorflowapp.com
                </a>
              </li>
              <li>
                <a
                  href={`tel:${SITE_PHONE}`}
                  className="inline-flex items-center gap-2 transition hover:text-white"
                >
                  <PiPhone className="h-4 w-4 shrink-0" />
                  {SITE_PHONE_DISPLAY}
                </a>
              </li>
              <li className="text-xs text-gray-400">
                Lun a Vie · 9 a 18 hs (ART)
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Empresa
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-gray-400">
              <li>
                <a
                  href="https://mwstudiodigital.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-white"
                >
                  MW Studio Digital
                </a>
              </li>
              <li><Link href="/terminos" className="transition hover:text-white">Términos</Link></li>
              <li><Link href="/privacidad" className="transition hover:text-white">Privacidad</Link></li>
            </ul>
          </div>
        </div>

        {/* Línea inferior */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-800 pt-6 text-xs text-gray-400 sm:flex-row">
          <span>© {new Date().getFullYear()} motorflow. Todos los derechos reservados.</span>
          <span>
            Un producto de{" "}
            <a
              href="https://mwstudiodigital.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gray-300 transition hover:text-white"
            >
              MW Studio Digital
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
