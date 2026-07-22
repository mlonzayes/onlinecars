import { Loader2 } from "lucide-react";

// Fallback de Suspense que Next muestra al instante mientras carga la ruta
// (widget de Clerk + compilación on-demand en dev). Evita la pantalla congelada.
export default function SignUpLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Loader2 className="size-8 animate-spin text-blue-600" aria-label="Cargando" />
    </div>
  );
}
