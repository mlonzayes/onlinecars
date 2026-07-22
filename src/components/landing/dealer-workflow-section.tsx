import Image from "next/image";
import { FadeIn } from "./fade-in";

// Banda editorial: el arco completo del trabajo del concesionario con motorflow,
// contado con fotos reales (fotografiar → gestionar → cerrar). Refuerza que
// detrás de la plataforma hay personas y una operatoria concreta.
const STEPS = [
  {
    src: "/premium_images/person_photographing_car.png",
    step: "01",
    title: "Fotografiás tu stock",
    description: "Subís fotos claras de cada vehículo y armás fichas que venden.",
  },
  {
    src: "/premium_images/hero_person_using_app.png",
    step: "02",
    title: "Gestionás todo online",
    description: "Stock, leads y ventas en un solo panel, desde donde estés.",
  },
  {
    src: "/premium_images/person_closing_deal.png",
    step: "03",
    title: "Cerrás la venta",
    description: "Las consultas llegan directo a vos y hacés el seguimiento hasta el cierre.",
  },
];

export function DealerWorkflowSection() {
  return (
    <section className="bg-white px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
            Tu día a día
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-gray-900 sm:text-3xl">
            De la foto al cierre, en un solo lugar
          </h2>
        </FadeIn>

        <FadeIn stagger className="mt-12 grid gap-5 sm:grid-cols-3">
          {STEPS.map(({ src, step, title, description }) => (
            <article
              key={step}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-100/50"
            >
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image
                  src={src}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-blue-700">
                  {step}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <p className="mt-1.5 text-sm font-light leading-relaxed text-gray-500">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </FadeIn>
      </div>
    </section>
  );
}
