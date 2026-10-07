import { PiSparkle, PiUser, PiLink } from "react-icons/pi";

/**
 * Ilustración de la sección de IA: una consulta de un comprador a un asistente
 * y la respuesta citando el sitio del concesionario.
 *
 * Es un ejemplo y lo dice (`Ejemplo ilustrativo`): no inventamos una
 * concesionaria real ni prometemos que el asistente siempre te recomiende.
 * Sin logos de terceros a propósito: son marcas registradas.
 */
export function AiChatMock() {
  return (
    <figure className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl shadow-blue-100/60 sm:p-6">
      <div className="flex justify-end">
        <p className="flex max-w-[85%] items-start gap-2 rounded-2xl rounded-tr-sm bg-gray-100 px-4 py-2.5 text-sm text-gray-800">
          <PiUser aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
          Busco un Toyota Corolla usado, 2020 o más nuevo, cerca de Rosario.
        </p>
      </div>

      <div className="mt-4 flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
          <PiSparkle aria-hidden className="h-4 w-4 text-white" />
        </span>
        <div className="space-y-3 text-sm font-light leading-relaxed text-gray-700">
          <p>
            Encontré un <span className="font-medium text-gray-900">Toyota Corolla XEi 2021</span>{" "}
            con 48.000 km publicado por una concesionaria de la zona, con precio
            y fotos en su sitio.
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50/70 px-2.5 py-1 font-mono text-xs text-blue-700">
            <PiLink aria-hidden className="h-3.5 w-3.5" />
            tuconcesionaria.motorflowapp.com
          </p>
        </div>
      </div>

      <figcaption className="mt-5 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
        Ejemplo ilustrativo
      </figcaption>
    </figure>
  );
}
