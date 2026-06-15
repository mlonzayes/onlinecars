import Image from "next/image";
import Link from "next/link";
import { PiEnvelope, PiPhone } from "react-icons/pi";

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
          </div>

          {/* Producto */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Producto
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-gray-400">
              <li><Link href="/#como-funciona" className="transition hover:text-white">Cómo funciona</Link></li>
              <li><Link href="/#servicios" className="transition hover:text-white">Servicios</Link></li>
              <li><Link href="/precios" className="transition hover:text-white">Planes</Link></li>
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
                  href="tel:+541100000000"
                  className="inline-flex items-center gap-2 transition hover:text-white"
                >
                  <PiPhone className="h-4 w-4 shrink-0" />
                  +54 11 0000-0000
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
