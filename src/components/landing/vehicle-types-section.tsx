import Image from "next/image";
import { FadeIn } from "./fade-in";

// Renders de estudio (fondo gris claro) — una carrocería por tarjeta. Refuerzan
// que la plataforma sirve para TODO tipo de stock, no solo autos.
const TYPES = [
  { src: "/premium_images/P10_suv_gris_oscuro.png", label: "SUVs" },
  { src: "/premium_images/P10_sedan_azul.png", label: "Sedanes" },
  { src: "/premium_images/P10_pickup_negra.png", label: "Pickups" },
  { src: "/premium_images/P10_hatchback_rojo.png", label: "Hatchbacks" },
  { src: "/premium_images/P10_van_blanca.png", label: "Utilitarios" },
];

export function VehicleTypesSection() {
  return (
    <section className="bg-gray-50 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
            Para todo tu stock
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-gray-900 sm:text-3xl">
            Cualquier tipo de vehículo, en tu catálogo
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm font-light text-gray-500">
            Autos, SUVs, pickups y utilitarios. Cargás todo tu inventario y lo
            mostrás profesional, con fichas completas y fotos ordenadas.
          </p>
        </FadeIn>

        <FadeIn
          stagger
          className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
        >
          {TYPES.map(({ src, label }) => (
            <div
              key={label}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50"
            >
              <div className="relative aspect-[4/3] bg-gray-100">
                <Image
                  src={src}
                  alt={`Vehículo tipo ${label}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="px-4 py-3 text-center">
                <span className="text-sm font-semibold text-gray-800">{label}</span>
              </div>
            </div>
          ))}
        </FadeIn>
      </div>
    </section>
  );
}
