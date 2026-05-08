import {
  Boxes,
  Globe2,
  Plug,
  Calculator,
  Landmark,
  Sparkles,
  Zap,
  Sparkle,
} from "lucide-react";
import { WaitlistForm } from "@/components/shared/waitlist-form";
import { Navbar } from "@/components/shared/navbar";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { ServiceCard, type ServiceCardProps } from "@/components/landing/service-card";
import { PricingCard, type PricingCardProps } from "@/components/landing/pricing-card";
import { FaqItem } from "@/components/landing/faq-item";
import { PartnersGrid, type Partner } from "@/components/landing/partners-grid";

// =====================================================================
// Hero
// =====================================================================
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-20 px-4">
      {/* Glow decorativo de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <ScrollReveal stagger staggerSelector="[data-hero-item]" staggerGap={0.12}>
          <span
            data-hero-item
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700"
          >
            <Sparkle className="h-3 w-3" />
            Acceso anticipado — cupos limitados
          </span>
          <h1
            data-hero-item
            className="mt-6 text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl"
          >
            Tu concesionario en internet,{" "}
            <span className="text-blue-600">sin depender de nadie.</span>
          </h1>
          <p data-hero-item className="mt-5 text-lg leading-relaxed text-gray-500">
            OnlineCars te da tu propio sitio web profesional con catálogo de
            vehículos, gestión de stock y captación de leads. Sin MercadoLibre,
            sin comisiones, sin intermediarios.
          </p>
          <div
            data-hero-item
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400"
          >
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-green-500">✓</span> Sin comisiones
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-green-500">✓</span> Tu marca, tu dominio
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-green-500">✓</span> Listo en minutos
            </span>
          </div>
          <div data-hero-item className="mt-8 flex flex-wrap gap-3">
            <a
              href="#pre-registro"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700"
            >
              Anotarme al pre-registro
            </a>
            <a
              href="#planes"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-6 py-3 text-sm font-bold text-gray-900 transition hover:border-gray-900"
            >
              Ver planes
            </a>
          </div>
        </ScrollReveal>

        <ScrollReveal y={20} delay={0.2}>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Anotate y accedé primero</h2>
            <p className="mt-2 text-sm text-gray-500">
              Ingresá tus datos y te contactamos cuando abramos el acceso.
            </p>
            <div className="mt-6">
              <WaitlistForm />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// =====================================================================
// Servicios
// =====================================================================
const SERVICES: ServiceCardProps[] = [
  {
    icon: Boxes,
    title: "Gestión de inventario",
    description:
      "Cargá, editá y publicá tu stock en minutos. Estados, fotos, datos legales y reordenamiento sin hojas de cálculo.",
  },
  {
    icon: Globe2,
    title: "Página web propia",
    description:
      "Tu catálogo en un dominio personalizado, con tu branding y theme. Profesional desde el día uno.",
  },
  {
    icon: Plug,
    title: "Integraciones",
    description:
      "Conectá MercadoLibre y otros canales. Publicá una vez, aparecé en todos lados. (Ver sección abajo).",
    highlighted: true,
  },
  {
    icon: Calculator,
    title: "Tasación de vehículos",
    description:
      "Asistente de tasación para acelerar la cotización de usados que recibís en parte de pago.",
    comingSoon: true,
  },
  {
    icon: Landmark,
    title: "Bancos y financiación",
    description:
      "Cotizá planes de financiación con bancos integrados directamente desde la ficha del auto.",
    comingSoon: true,
  },
  {
    icon: Sparkles,
    title: "Soluciones a medida",
    description:
      "Para concesionarios grandes con flujos propios: integraciones custom, importadores, reportes.",
    comingSoon: true,
  },
  {
    icon: Zap,
    title: "Automatizaciones",
    description:
      "Mensajes automáticos al lead, recordatorios de seguimiento, envío de documentación, alertas.",
    comingSoon: true,
  },
];

function ServicesSection() {
  return (
    <section id="servicios" className="bg-gray-50 py-20 px-4">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Todo lo que necesitás</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-500">
              OnlineCars cubre el flujo completo del concesionario, desde
              publicar el auto hasta cerrar la venta.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger staggerGap={0.08} className="mt-12">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <ServiceCard key={s.title} {...s} />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// =====================================================================
// Pricing
// =====================================================================
const PLANS: PricingCardProps[] = [
  {
    name: "Base",
    priceArs: 39990,
    description: "Para arrancar con presencia online.",
    features: [
      "Hasta 30 vehículos publicados",
      "Sitio web propio con tu marca",
      "Captación de leads con seguimiento",
      "1 usuario administrador",
      "Soporte por email",
    ],
  },
  {
    name: "Media",
    priceArs: 89990,
    description: "Para concesionarios en crecimiento.",
    highlighted: true,
    features: [
      "Hasta 100 vehículos publicados",
      "Hasta 3 usuarios",
      "Subdominio personalizado",
      "Estadísticas básicas",
      "Soporte prioritario",
    ],
  },
  {
    name: "Premium",
    priceArs: 149990,
    description: "Para operación media y alta.",
    features: [
      "Vehículos ilimitados",
      "Hasta 10 usuarios",
      "Dominio propio (yourdealer.com)",
      "Integración MercadoLibre",
      "Estadísticas avanzadas + reportes",
    ],
  },
  {
    name: "Enterprise",
    priceArs: null,
    description: "Soluciones a medida.",
    features: [
      "Usuarios ilimitados",
      "Integraciones custom",
      "Account manager dedicado",
      "Importadores y APIs propios",
      "SLA garantizado",
    ],
  },
];

function PricingSection() {
  return (
    <section id="planes" className="bg-white py-24 px-4">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Planes simples</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-500">
              Pagás por mes, sin comisiones por venta. Cancelás cuando quieras.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger staggerGap={0.1} className="mt-14">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((p) => (
              <PricingCard key={p.name} {...p} />
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <p className="mt-8 text-center text-xs text-gray-400">
            Precios indicativos en pesos argentinos. Sujetos a confirmación al lanzamiento.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

// =====================================================================
// FAQ
// =====================================================================
const FAQS: { question: string; answer: React.ReactNode }[] = [
  {
    question: "¿Cuándo lanzan?",
    answer:
      "Estamos en la última recta del MVP. Esperamos abrir el acceso a los primeros pre-registrados en pocas semanas. Los anotados reciben aviso por email apenas habilitemos cuentas.",
  },
  {
    question: "¿Necesito conocimientos técnicos?",
    answer:
      "No. El alta del concesionario y la carga de vehículos se hace desde un panel pensado para no-técnicos. Si querés un dominio propio, te ayudamos con la configuración.",
  },
  {
    question: "¿Puedo migrar mi stock actual de MercadoLibre?",
    answer:
      "Sí. La integración con MercadoLibre te permite traer tus publicaciones existentes y mantenerlas sincronizadas con tu nuevo sitio. (Funcionalidad en desarrollo, disponible al lanzamiento.)",
  },
  {
    question: "¿Qué pasa si no me sirve?",
    answer:
      "Cancelás cuando quieras, sin permanencia. Tu información (clientes, leads, fotos) la podés exportar en cualquier momento — son tus datos.",
  },
  {
    question: "¿Qué pasa con las comisiones por venta?",
    answer:
      "OnlineCars no cobra comisiones por venta. Solo pagás la suscripción mensual del plan elegido. Lo que vendés es 100% tuyo.",
  },
];

function FaqSection() {
  return (
    <section id="faq" className="bg-gray-50 py-24 px-4">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Preguntas frecuentes</h2>
            <p className="mt-3 text-gray-500">
              Lo que más nos preguntan antes de anotarse.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger staggerGap={0.08} className="mt-10">
          <div className="flex flex-col gap-3">
            {FAQS.map((f) => (
              <FaqItem key={f.question} question={f.question} answer={f.answer} />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// =====================================================================
// Partners / Logos
// =====================================================================
const PARTNERS: Partner[] = [
  { name: "MercadoLibre", primary: true, comingSoon: true },
  { name: "Banco Galicia", comingSoon: true },
  { name: "Santander", comingSoon: true },
  { name: "BBVA", comingSoon: true },
  { name: "Banco Macro", comingSoon: true },
  { name: "Banco Nación", comingSoon: true },
];

function PartnersSection() {
  return (
    <section className="bg-white py-24 px-4">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Integraciones</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-500">
              Trabajamos para conectar OnlineCars con las plataformas y bancos
              que ya usás todos los días.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal className="mt-12">
          <PartnersGrid partners={PARTNERS} />
        </ScrollReveal>
      </div>
    </section>
  );
}

// =====================================================================
// Pre-registro / CTA final
// =====================================================================
function PreRegistroSection() {
  return (
    <section
      id="pre-registro"
      className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 py-24 px-4"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-blue-500/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <ScrollReveal>
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Lanzamos pronto. No te quedés afuera.
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Los primeros concesionarios en anotarse tienen acceso prioritario y
            condiciones especiales de lanzamiento.
          </p>
        </ScrollReveal>

        <ScrollReveal y={20} className="mt-10">
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <WaitlistForm />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// =====================================================================
// Footer
// =====================================================================
function Footer() {
  return (
    <footer className="bg-gray-900 py-10 px-4">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-gray-400 sm:flex-row">
        <span className="text-base font-semibold text-white">OnlineCars</span>
        <div className="flex items-center gap-6">
          <a href="#servicios" className="hover:text-white">Servicios</a>
          <a href="#planes" className="hover:text-white">Planes</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </div>
        <span className="text-xs">© {new Date().getFullYear()} OnlineCars</span>
      </div>
    </footer>
  );
}

// =====================================================================
// Page
// =====================================================================
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <PartnersSection />
      <PricingSection />
      <FaqSection />
      <PreRegistroSection />
      <Footer />
    </div>
  );
}
