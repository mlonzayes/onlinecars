import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

interface LegalShellProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

/**
 * Chrome + tipografía compartida para las páginas legales (/privacidad, /terminos).
 * Estila los elementos semánticos (h2, h3, p, ul, a, strong) desde el contenedor
 * con variantes descendientes de Tailwind, así las páginas escriben HTML limpio.
 */
export function LegalShell({ title, lastUpdated, children }: LegalShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1 px-4 pb-20 pt-28">
        <article className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{title}</h1>
          <p className="mt-2 text-sm text-gray-400">Última actualización: {lastUpdated}</p>

          <div
            className="
              mt-10 text-sm leading-relaxed text-gray-600
              [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2
              [&_h2]:mb-2 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900
              [&_h3]:mb-1 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-gray-800
              [&_li]:mt-1.5
              [&_p]:mt-3
              [&_strong]:font-semibold [&_strong]:text-gray-900
              [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5
            "
          >
            {children}
          </div>

          <p className="mt-12 border-t border-gray-100 pt-6 text-xs text-gray-400">
            Si tenés dudas sobre este documento, escribinos a{" "}
            <a href="mailto:soporte@motorflowapp.com">soporte@motorflowapp.com</a>.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
