import Link from "next/link";
import { CarFront, Home, ArrowLeft } from "lucide-react";

// Server Component: HTML estático puro, cero hidratación.
// Antes usaba buttonVariants() de shadcn pero esa función vive en un módulo
// "use client" y no se puede invocar desde el server. Solucionamos con
// clases Tailwind directas — para 2 botones de una 404 alcanza y sobra.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 shadow-sm">
        <CarFront className="h-12 w-12 text-blue-600" />
      </div>

      <h1 className="mb-2 text-6xl font-extrabold tracking-tight text-gray-900">
        404
      </h1>
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        ¡Ups! Nos quedamos sin nafta.
      </h2>

      <p className="mb-10 max-w-md text-lg text-gray-600">
        La página que estás buscando no existe, fue movida a otra ruta o
        escribiste mal la dirección.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/30 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
        >
          <Home className="h-4 w-4" />
          Volver al inicio
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Ir al Dashboard
        </Link>
      </div>
    </div>
  );
}
