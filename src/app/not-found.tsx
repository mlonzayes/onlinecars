import Link from "next/link";
import { Fuel, Home } from "lucide-react";

// Server Component: HTML estático puro, cero hidratación.
// Antes usaba buttonVariants() de shadcn pero esa función vive en un módulo
// "use client" y no se puede invocar desde el server. Solucionamos con
// clases Tailwind directas — para un botón de una 404 alcanza y sobra.
//
// El ícono es un surtidor en ámbar, no un auto: el copy habla de quedarse sin
// nafta y el ámbar es el color de la luz de reserva del tablero. Ícono y texto
// tienen que contar la misma historia.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Luz de reserva encendida: anillo fino + halo, sin drop shadow. */}
      <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/30">
        <div
          className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl"
          aria-hidden="true"
        />
        <Fuel className="relative h-11 w-11 text-amber-500" strokeWidth={1.5} />
      </div>

      <h1 className="mb-2 text-6xl font-extrabold tracking-tight text-foreground">
        404
      </h1>
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        ¡Ups! Nos quedamos sin nafta.
      </h2>

      <p className="mb-10 max-w-md text-lg text-muted-foreground">
        La página que estás buscando no existe, fue movida a otra ruta o
        escribiste mal la dirección.
      </p>

      <Link
        href="/"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/30 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
      >
        <Home className="h-4 w-4" />
        Volver al inicio
      </Link>
    </div>
  );
}
