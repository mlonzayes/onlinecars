import { WaitlistForm } from "@/components/shared/waitlist-form";
import { Navbar } from "@/components/shared/navbar";

function HeroSection() {
  return (
    <section className="bg-white pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wide">
            Acceso anticipado — cupos limitados
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
            Tu concesionario en internet,{" "}
            <span className="text-blue-600">sin depender de nadie.</span>
          </h1>
          <p className="text-lg text-gray-500 mb-8 leading-relaxed">
            OnlineCars te da tu propio sitio web profesional con catálogo de
            vehículos, gestión de stock y captación de leads. Sin MercadoLibre,
            sin comisiones, sin intermediarios.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="text-green-500 font-bold">✓</span> Sin comisiones
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-green-500 font-bold">✓</span> Tu marca, tu dominio
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-green-500 font-bold">✓</span> Listo en minutos
            </span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Anotate y accedé primero
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Ingresá tus datos y te contactamos cuando abramos el acceso.
          </p>
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}

const PAIN_POINTS = [
  {
    icon: "📦",
    title: "Dependés de los portales",
    description: "MercadoLibre y OLX se llevan tu comisión y son dueños de tus clientes. Cuando se van, perdés todo el historial.",
  },
  {
    icon: "🌐",
    title: "No tenés presencia web propia",
    description: "Sin sitio propio, no existís en Google. Tus competidores con web propia se llevan a los compradores que buscan online.",
  },
  {
    icon: "📉",
    title: "Perdés leads todos los días",
    description: "¿Cuántas consultas por WhatsApp se pierden sin seguimiento? Sin sistema, cada lead sin respuesta es plata que se fue.",
  },
] as const;

function ProblemsSection() {
  return (
    <section className="bg-gray-50 py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            ¿Te suena familiar?
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Estos son los problemas que tiene la mayoría de los concesionarios
            medianos y chicos en Argentina hoy.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PAIN_POINTS.map((point) => (
            <div
              key={point.title}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
            >
              <div className="text-3xl mb-4">{point.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{point.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: "🚗",
    title: "Catálogo propio",
    description:
      "Publicá tus vehículos con fotos, precios y todos los detalles. Tu catálogo, en tu dominio, con tu marca.",
  },
  {
    icon: "📊",
    title: "Gestión de stock",
    description:
      "Marcá vehículos como disponibles, reservados o vendidos desde un panel simple. Sin hojas de cálculo.",
  },
  {
    icon: "💬",
    title: "Captación de leads",
    description:
      "Cada consulta queda registrada con el vehículo de interés, datos del comprador y estado del seguimiento.",
  },
  {
    icon: "⚙️",
    title: "Panel de administración",
    description:
      "Controlá todo desde un solo lugar: inventario, consultas, configuración del sitio y estadísticas básicas.",
  },
] as const;

function FeaturesSection() {
  return (
    <section className="bg-white py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            Todo lo que necesitás, nada de lo que no.
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            OnlineCars está diseñado específicamente para concesionarios. Sin
            funciones de más, sin curva de aprendizaje.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition"
            >
              <div className="text-2xl shrink-0">{feature.icon}</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="bg-blue-600 py-20 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-white mb-4">
          Lanzamos pronto. No te quedés afuera.
        </h2>
        <p className="text-blue-100 mb-10 text-lg">
          Los primeros concesionarios en anotarse tienen acceso prioritario y
          condiciones especiales de lanzamiento.
        </p>
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <span className="font-semibold text-white text-base">OnlineCars</span>
        <span>© {new Date().getFullYear()} OnlineCars. Todos los derechos reservados.</span>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <HeroSection />
      <ProblemsSection />
      <FeaturesSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
