"use client";

import { useState } from "react";
import Link from "next/link";
import { PiList, PiX, PiEnvelope, PiSquaresFour, PiSignIn } from "react-icons/pi";

interface MobileMenuProps {
  isLoginEnabled: boolean;
  isSignedIn: boolean;
}

export function MobileMenu({ isLoginEnabled, isSignedIn }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="p-2 text-gray-600 hover:text-gray-900"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <PiX className="size-6" /> : <PiList className="size-6" />}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-14 w-full bg-white border-b border-gray-200 px-4 py-4 shadow-lg z-50">
          <nav className="flex flex-col gap-4">
            <a
              href="#servicios"
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
              onClick={() => setIsOpen(false)}
            >
              Servicios
            </a>
            <a
              href="#planes"
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
              onClick={() => setIsOpen(false)}
            >
              Planes
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
              onClick={() => setIsOpen(false)}
            >
              FAQ
            </a>
            <Link
              href="/blog"
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
              onClick={() => setIsOpen(false)}
            >
              Blog
            </Link>
            
            <div className="h-px w-full bg-gray-100 my-2" />
            
            <a
              href="#contacto"
              className="inline-flex justify-center items-center gap-1.5 rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-200"
              onClick={() => setIsOpen(false)}
            >
              <PiEnvelope className="size-4" />
              <span>Contacto</span>
            </a>

            {isLoginEnabled && (
              isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex justify-center items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  onClick={() => setIsOpen(false)}
                >
                  <PiSquaresFour className="size-4" />
                  <span>Ir al panel</span>
                </Link>
              ) : (
                <Link
                  href="/sign-in"
                  className="inline-flex justify-center items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  <PiSignIn className="size-4" />
                  <span>Iniciar sesión</span>
                </Link>
              )
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
