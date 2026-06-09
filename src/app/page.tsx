import { PiSparkle } from "react-icons/pi";
import { LandingContactForm } from "@/components/landing/contact-form";
import { Navbar } from "@/components/shared/navbar";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { TextReveal } from "@/components/landing/text-reveal";
import { FloatingOrbs } from "@/components/landing/floating-orbs";
import { ServicesSection } from "@/components/landing/services-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { BlogSection } from "@/components/landing/blog-section";
import { PricingCards } from "@/components/landing/pricing-cards";
import { FaqItem } from "@/components/landing/faq-item";
import { PartnersGrid, type Integration } from "@/components/landing/partners-grid";
import { PiStorefront, PiBank, PiWhatsappLogo } from "react-icons/pi";
import { HeroCar } from "@/components/landing/hero-car";
import { getRecentPosts } from "@/data/posts";
import { Footer } from "@/components/shared/footer";

// =====================================================================
// Hero
// =====================================================================
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white px-4 pt-4 pb-12 sm:pt-6 sm:pb-16 lg:pt-8 lg:pb-20">
      {/* Orbs animados de fondo (paleta azul/cian) — movimiento sinusoidal independiente */}
      <FloatingOrbs
        orbs={[
          { top: "5%", left: "8%", size: 380, color: "bg-blue-300/30", duration: 14 },
          { top: "55%", left: "70%", size: 280, color: "bg-cyan-300/25", duration: 18, delay: 1.5 },
          { top: "20%", left: "85%", size: 200, color: "bg-indigo-300/20", duration: 16, delay: 2.5 },
        ]}
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <ScrollReveal scale={0.85} y={0} duration={0.7} ease="back.out(1.6)">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
              <PiSparkle className="h-3 w-3" />
              Acceso anticipado — cupos limitados
            </span>
          </ScrollReveal>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
            <TextReveal stagger={0.06} delay={0.15}>
              Tu concesionario,
            </TextReveal>{" "}
            <TextReveal stagger={0.06} delay={0.4} className="text-blue-600">
              online.
            </TextReveal>
          </h1>

          <ScrollReveal y={20} blur={4} delay={0.6} duration={0.9}>
            <p className="mt-6 text-base leading-relaxed text-gray-500 sm:text-lg">
              motorflow te da tu propio sitio web profesional con catálogo de
              vehículos, gestión de stock y captación de leads.
            </p>
          </ScrollReveal>

          <ScrollReveal stagger staggerSelector="[data-check]" staggerGap={0.08} delay={0.8} className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-500">
            <span data-check className="flex items-center gap-1.5">
              <span className="font-bold text-green-500">✓</span> Sin comisiones
            </span>
            <span data-check className="flex items-center gap-1.5">
              <span className="font-bold text-green-500">✓</span> Tu marca, tu dominio
            </span>
            <span data-check className="flex items-center gap-1.5">
              <span className="font-bold text-green-500">✓</span> Listo en minutos
            </span>
          </ScrollReveal>

          <ScrollReveal y={15} delay={1} duration={0.6} ease="back.out(1.4)" className="mt-6 flex flex-wrap gap-2.5">
            <a
              href="#contacto"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/30 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/40"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">Contactanos</span>
            </a>
            <a
              href="#planes"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-900 transition-all hover:-translate-y-0.5 hover:border-gray-900 hover:shadow-sm"
            >
              Ver planes
            </a>
          </ScrollReveal>
        </div>

        <div className="relative">
          <HeroCar />
        </div>
      </div>
    </section>
  );
}

// =====================================================================
// Pricing
// =====================================================================
function PricingSection() {
  return (
    <section id="planes" className="relative overflow-hidden bg-white px-4 py-14 sm:py-16">
      <FloatingOrbs
        orbs={[
          { top: "10%", left: "10%", size: 300, color: "bg-blue-200/20", duration: 22 },
          { top: "60%", left: "80%", size: 280, color: "bg-cyan-200/20", duration: 18, delay: 1 },
        ]}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            <TextReveal stagger={0.05}>Planes simples</TextReveal>
          </h2>
          <ScrollReveal y={15} blur={3} delay={0.2}>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500 sm:text-base">
              Pagás por mes, sin comisiones por venta. Cancelás cuando quieras.
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal y={20} delay={0.15} duration={0.7} className="mt-10">
          <PricingCards />
        </ScrollReveal>

        <ScrollReveal y={10} delay={0.4}>
          <p className="mt-6 text-center text-[11px] text-gray-400">
            Precios referenciales. Pesos argentinos.
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
    question: "¿Cómo contrato un plan?",
    answer:
      "Dejanos tu consulta en el formulario de contacto y un asesor se va a comunicar con vos para coordinar el alta de tu concesionario.",
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
      "motorflow no cobra comisiones por venta. Solo pagás la suscripción mensual del plan elegido. Lo que vendés es 100% tuyo.",
  },
];

function FaqSection() {
  return (
    <section id="faq" className="relative overflow-hidden bg-gray-50 px-4 py-14 sm:py-16">
      <FloatingOrbs
        orbs={[
          { top: "20%", left: "5%", size: 240, color: "bg-blue-200/15", duration: 26 },
          { top: "70%", left: "85%", size: 200, color: "bg-indigo-200/15", duration: 22, delay: 1.5 },
        ]}
      />

      <div className="relative mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            <TextReveal stagger={0.04}>Preguntas frecuentes</TextReveal>
          </h2>
          <ScrollReveal y={15} blur={3} delay={0.2}>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              Lo que más nos preguntan antes de anotarse.
            </p>
          </ScrollReveal>
        </div>

        {/* FAQs con stagger desde lados alternados — no uniforme */}
        <div className="mt-8 flex flex-col gap-2.5">
          {FAQS.map((f, i) => (
            <ScrollReveal
              key={f.question}
              x={i % 2 === 0 ? -20 : 20}
              y={10}
              duration={0.6}
              delay={i * 0.05}
            >
              <FaqItem question={f.question} answer={f.answer} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// =====================================================================
// Partners / Logos
// =====================================================================
const INTEGRATIONS: Integration[] = [
  {
    title: "MercadoLibre",
    description:
      "Sincronizá tu stock con MercadoLibre desde un solo lugar. Publicá una vez, aparecé en los dos canales con datos siempre actualizados.",
    icon: PiStorefront,
    status: "available",
    logo: "/logo/meli.png",
    iconBg: "bg-[#FFE600]",
  },
  {
    title: "WhatsApp",
    description:
      "Recibí consultas por WhatsApp directamente desde tu sitio. Botón flotante en cada vehículo y atención sin fricción.",
    icon: PiWhatsappLogo,
    status: "available",
    iconBg: "bg-[#25D366]",
  },
  {
    title: "Bancos y financiación",
    description:
      "Cotizá planes de financiación con los principales bancos del país directamente desde la ficha del auto, sin llamados ni intermediarios.",
    icon: PiBank,
    status: "coming-soon",
  },
];

function PartnersSection() {
  return (
    <section className="relative overflow-hidden bg-white px-4 py-14 sm:py-16">
      <FloatingOrbs
        orbs={[
          { top: "10%", left: "70%", size: 280, color: "bg-yellow-200/25", duration: 20 },
          { top: "65%", left: "10%", size: 220, color: "bg-amber-200/20", duration: 24, delay: 2 },
        ]}
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            <TextReveal stagger={0.05}>Integraciones</TextReveal>
          </h2>
          <ScrollReveal y={15} blur={3} delay={0.2}>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500 sm:text-base">
              Trabajamos para conectar motorflow con las plataformas y bancos
              que ya usás todos los días.
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal y={20} scale={0.97} delay={0.3} className="mt-10">
          <PartnersGrid integrations={INTEGRATIONS} />
        </ScrollReveal>
      </div>
    </section>
  );
}

// =====================================================================
// Contacto / CTA final
// =====================================================================
function ContactSection() {
  return (
    <section
      id="contacto"
      className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-16 sm:py-20"
    >
      {/* Orbs animados — más grandes y vibrantes que en otras secciones */}
      <FloatingOrbs
        orbs={[
          { top: "-10%", left: "65%", size: 480, color: "bg-blue-400/30", duration: 22 },
          { top: "60%", left: "-10%", size: 380, color: "bg-blue-500/30", duration: 26, delay: 2 },
          { top: "30%", left: "30%", size: 240, color: "bg-cyan-400/15", duration: 18, delay: 1 },
        ]}
      />

      <div className="relative mx-auto max-w-xl text-center">
        <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
          <TextReveal stagger={0.06}>
            ¿Listo para dar el salto?
          </TextReveal>
        </h2>
        <ScrollReveal y={15} blur={4} delay={0.4}>
          <p className="mt-3 text-base text-blue-100">
            Completá el formulario para contratar un plan o sacarte cualquier duda.
          </p>
        </ScrollReveal>

        <ScrollReveal y={30} scale={0.92} blur={6} delay={0.6} duration={0.95} ease="back.out(1.3)" className="mt-8">
          <div className="rounded-xl bg-white p-5 text-left shadow-2xl shadow-blue-900/40 sm:p-6">
            <LandingContactForm />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}


// =====================================================================
// Page
// =====================================================================
export default function HomePage() {
  const recentPosts = getRecentPosts(3);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <PartnersSection />
      <PricingSection />
      <BlogSection posts={recentPosts} />
      <FaqSection />
      <ServicesSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
