import { FaqItem } from "./faq-item";
import { LandingContactForm } from "./contact-form";
import { isSelfServeEnabled } from "@/lib/seo";

export interface Faq {
  question: string;
  answer: string;
}

/**
 * FAQ + Contacto en UNA sección, a propósito.
 *
 * Antes eran dos bloques con un corte de color entre medio. La FAQ es manejo de
 * objeciones y el form es la conversión: tienen que leerse como un solo
 * movimiento, no como dos paradas. El form va sticky a la derecha para que
 * quede a mano en el momento exacto en que la objeción se resuelve.
 *
 * Orden de las preguntas: por poder de desbloqueo, no por orden de escritura.
 * Primero la plata, después la migración, después el riesgo.
 */
export function getFaqs(): Faq[] {
  return [
    {
      question: "¿Cobran comisiones por venta?",
      answer:
        "No. motorflow no cobra comisiones por venta. Solo pagás la suscripción mensual del plan elegido. Lo que vendés es 100% tuyo.",
    },
    {
      question: "¿Puedo migrar mi stock actual de MercadoLibre?",
      answer:
        "Sí. La integración con MercadoLibre te permite traer tus publicaciones existentes y mantenerlas sincronizadas con tu nuevo sitio. No perdés tu reputación ni tenés que elegir entre los dos.",
    },
    {
      question: "¿Qué pasa si no me sirve?",
      answer:
        "Cancelás cuando quieras, sin permanencia. Tu información la podés exportar en cualquier momento — son tus datos.",
    },
    {
      question: "¿Cuánto tarda el alta?",
      answer:
        "El mismo día. Creás tu cuenta, completás los datos del concesionario y en minutos tenés el sitio listo para cargar stock.",
    },
    {
      question: "¿Necesito conocimientos técnicos?",
      answer:
        "No. El alta y la carga de vehículos se hace desde un panel pensado para no-técnicos. Si querés un dominio propio, te ayudamos con la configuración.",
    },
    {
      // El flujo de alta cambia según esté abierto el self-serve o no. Una sola
      // fuente para no prometer un registro que hoy rebota al visitante.
      question: "¿Cómo contrato un plan?",
      answer: isSelfServeEnabled()
        ? "Creás tu cuenta desde el botón de arriba, elegís tu plan y empezás a cargar stock. Si preferís que te acompañemos, dejanos tu consulta y un asesor te contacta."
        : "Dejanos tu consulta en el formulario y un asesor se va a comunicar con vos para coordinar el alta de tu concesionario.",
    },
  ];
}

export function FaqContactSection() {
  const faqs = getFaqs();

  return (
    <section id="faq" className="bg-gray-50 px-4 py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Objeciones */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
            Preguntas frecuentes
          </p>
          <h2 className="mt-3 text-2xl font-normal tracking-tight text-gray-900 sm:text-3xl">
            Lo que más nos preguntan
          </h2>
          <div className="mt-8 flex flex-col gap-2.5">
            {faqs.map((f) => (
              <FaqItem key={f.question} question={f.question} answer={f.answer} />
            ))}
          </div>
        </div>

        {/* Conversión — sticky para que acompañe la lectura de la FAQ */}
        <div id="contacto" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-medium tracking-tight text-gray-900 sm:text-2xl">
              ¿Listo para dar el salto?
            </h2>
            <p className="mt-2 text-sm font-light leading-relaxed text-gray-600">
              Dejanos tus datos y nos comunicamos para poner tu concesionario
              online.
            </p>
            <div className="mt-6">
              <LandingContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
