import { prisma } from "../src/lib/prisma";
import type { Prisma } from "@prisma/client";

// Seed de 20 vehículos del mercado argentino para testear paginación, búsqueda
// y catálogo público. Idempotente: usa createMany con skipDuplicates por la
// unique constraint implícita en cuids; en realidad no hay unique en vehicles
// pero usamos title+brand+model como pseudo-key del seed para evitar duplicados
// si se corre dos veces (lo manejamos chequeando antes).
//
// Toma el primer dealership encontrado.

interface SeedVehicle {
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  kilometers: number;
  fuelType: "nafta" | "diesel" | "gnc" | "electrico" | "hibrido";
  transmission: "manual" | "automatica";
  bodyType: "suv" | "sedan" | "hatchback" | "coupe" | "pickup" | "minivan" | "convertible";
  color: string;
  doors: number;
  engine: string;
  condition: "new" | "used";
  status: "available" | "reserved" | "sold";
  featured: boolean;
  publish: boolean;
  licensePlate?: string;
  vin?: string;
  description?: string;
}

const VEHICLES: SeedVehicle[] = [
  // 10 usados — patente argentina + VIN inventado, kilometraje real
  { title: "Volkswagen Gol Trend 1.6 Comfortline", brand: "Volkswagen", model: "Gol Trend", year: 2018, price: 13_500_000, kilometers: 75000, fuelType: "nafta", transmission: "manual", bodyType: "hatchback", color: "Blanco", doors: 5, engine: "1.6L", condition: "used", status: "available", featured: true, publish: true, licensePlate: "AC123BD", vin: "9BWAA45U7JT123456", description: "Único dueño, service oficial al día. Equipamiento full." },
  { title: "Toyota Corolla XEI 2.0 CVT", brand: "Toyota", model: "Corolla", year: 2020, price: 22_900_000, kilometers: 52000, fuelType: "nafta", transmission: "automatica", bodyType: "sedan", color: "Gris plata", doors: 4, engine: "2.0L", condition: "used", status: "available", featured: true, publish: true, licensePlate: "AD456EF", vin: "9BRBL1HE5L0234567", description: "Caja CVT impecable. Service Toyota. Pantalla táctil + cámara de retroceso." },
  { title: "Ford Focus SE 1.6 5P", brand: "Ford", model: "Focus", year: 2017, price: 11_200_000, kilometers: 95000, fuelType: "nafta", transmission: "manual", bodyType: "hatchback", color: "Azul", doors: 5, engine: "1.6L", condition: "used", status: "available", featured: false, publish: true, licensePlate: "AB789GH", vin: "9BFZH54L2HB345678" },
  { title: "Chevrolet Onix LT 1.4 Joy", brand: "Chevrolet", model: "Onix", year: 2021, price: 16_400_000, kilometers: 35000, fuelType: "nafta", transmission: "manual", bodyType: "hatchback", color: "Rojo", doors: 5, engine: "1.4L", condition: "used", status: "available", featured: false, publish: true, licensePlate: "AE012JK", vin: "8AGXR4810MR456789", description: "Excelente estado, tomamos usado." },
  { title: "Renault Duster Privilege 2.0 4x2", brand: "Renault", model: "Duster", year: 2019, price: 18_700_000, kilometers: 70000, fuelType: "nafta", transmission: "manual", bodyType: "suv", color: "Gris oscuro", doors: 5, engine: "2.0L", condition: "used", status: "available", featured: false, publish: true, licensePlate: "AC345LM", vin: "93Y4SRDA4KJ567890" },
  { title: "Fiat Cronos Drive 1.3 GSE", brand: "Fiat", model: "Cronos", year: 2022, price: 15_500_000, kilometers: 28000, fuelType: "nafta", transmission: "manual", bodyType: "sedan", color: "Blanco", doors: 4, engine: "1.3L", condition: "used", status: "reserved", featured: false, publish: true, licensePlate: "AF678NO", vin: "8AP359C1XNJ678901" },
  { title: "Toyota Hilux SR 2.4 4x4 D/C", brand: "Toyota", model: "Hilux", year: 2018, price: 35_000_000, kilometers: 130000, fuelType: "diesel", transmission: "manual", bodyType: "pickup", color: "Negro", doors: 4, engine: "2.4L TDI", condition: "used", status: "available", featured: true, publish: true, licensePlate: "AB901PQ", vin: "8AJBR3CD7JX789012", description: "Doble cabina. Cubre carga. Lista para trabajar." },
  { title: "Peugeot 208 Allure 1.6 5P", brand: "Peugeot", model: "208", year: 2020, price: 14_300_000, kilometers: 60000, fuelType: "nafta", transmission: "manual", bodyType: "hatchback", color: "Gris", doors: 5, engine: "1.6L", condition: "used", status: "available", featured: false, publish: true, licensePlate: "AD234RS", vin: "8AD5HMF8XLG890123" },
  { title: "Volkswagen Amarok Highline 2.0 BiTDi 4x4 AT", brand: "Volkswagen", model: "Amarok", year: 2019, price: 42_500_000, kilometers: 110000, fuelType: "diesel", transmission: "automatica", bodyType: "pickup", color: "Plata", doors: 4, engine: "2.0L BiTDi", condition: "used", status: "available", featured: false, publish: true, licensePlate: "AC567TU", vin: "8AWZB54T8KH901234", description: "Caja automática 8 vel. Cuero. Service oficial." },
  { title: "Ford EcoSport SE 1.5 5P", brand: "Ford", model: "EcoSport", year: 2017, price: 12_800_000, kilometers: 85000, fuelType: "nafta", transmission: "manual", bodyType: "suv", color: "Beige", doors: 5, engine: "1.5L", condition: "used", status: "available", featured: false, publish: true, licensePlate: "AE890VW", vin: "9BFBSAGD7HB012345" },

  // 10 nuevos — sin patente todavía
  { title: "Toyota Yaris XLS 1.5 CVT", brand: "Toyota", model: "Yaris", year: 2025, price: 24_500_000, kilometers: 0, fuelType: "nafta", transmission: "automatica", bodyType: "hatchback", color: "Blanco perlado", doors: 5, engine: "1.5L", condition: "new", status: "available", featured: true, publish: true, vin: "9BRBA3HE0SP123456", description: "0 km. Patentamiento bonificado. Toda la garantía Toyota." },
  { title: "Volkswagen Polo Highline 200 TSI", brand: "Volkswagen", model: "Polo", year: 2025, price: 23_900_000, kilometers: 0, fuelType: "nafta", transmission: "automatica", bodyType: "hatchback", color: "Rojo tornado", doors: 5, engine: "1.0L TSI", condition: "new", status: "available", featured: false, publish: true, vin: "9BWAB45U6SP234567" },
  { title: "Chevrolet Cruze LTZ Premier", brand: "Chevrolet", model: "Cruze", year: 2024, price: 32_700_000, kilometers: 0, fuelType: "nafta", transmission: "automatica", bodyType: "sedan", color: "Gris grafito", doors: 4, engine: "1.4L Turbo", condition: "new", status: "available", featured: false, publish: true, vin: "8AGXR4815RR345678", description: "Tope de gama. Cuero. Sunroof. Sistema infotainment." },
  { title: "Renault Sandero Stepway Zen 1.6", brand: "Renault", model: "Sandero Stepway", year: 2025, price: 20_400_000, kilometers: 0, fuelType: "nafta", transmission: "manual", bodyType: "hatchback", color: "Naranja", doors: 5, engine: "1.6L 16V", condition: "new", status: "available", featured: false, publish: true, vin: "93Y5SRDA6SJ456789" },
  { title: "Toyota Corolla Cross XLI 2.0 CVT", brand: "Toyota", model: "Corolla Cross", year: 2025, price: 38_200_000, kilometers: 0, fuelType: "nafta", transmission: "automatica", bodyType: "suv", color: "Blanco", doors: 5, engine: "2.0L", condition: "new", status: "available", featured: true, publish: true, vin: "9BRBS3HE5SP567890" },
  { title: "Ford Ranger XLS 2.0 4x4 AT", brand: "Ford", model: "Ranger", year: 2025, price: 64_900_000, kilometers: 0, fuelType: "diesel", transmission: "automatica", bodyType: "pickup", color: "Azul fortaleza", doors: 4, engine: "2.0L Turbo Diesel", condition: "new", status: "available", featured: true, publish: true, vin: "9BFBSAGD3SB678901", description: "0 km. Patentamiento incluido. Garantía 3 años o 100.000 km." },
  { title: "Fiat Toro Volcano 2.0 TDI 4x4 AT9", brand: "Fiat", model: "Toro", year: 2024, price: 48_300_000, kilometers: 0, fuelType: "diesel", transmission: "automatica", bodyType: "pickup", color: "Gris vesubio", doors: 4, engine: "2.0L Multijet", condition: "new", status: "available", featured: false, publish: false, vin: "8AP259C4XRJ789012", description: "0 km. Caja automática 9 velocidades. Tope de gama." },
  { title: "Peugeot 2008 Allure 1.6 PureTech AT6", brand: "Peugeot", model: "2008", year: 2025, price: 36_500_000, kilometers: 0, fuelType: "nafta", transmission: "automatica", bodyType: "suv", color: "Negro perla", doors: 5, engine: "1.6L PureTech", condition: "new", status: "available", featured: false, publish: true, vin: "8AD5KMF9XSG890123" },
  { title: "Volkswagen T-Cross Comfortline 200 TSI", brand: "Volkswagen", model: "T-Cross", year: 2025, price: 33_800_000, kilometers: 0, fuelType: "nafta", transmission: "automatica", bodyType: "suv", color: "Gris platino", doors: 5, engine: "1.0L TSI", condition: "new", status: "available", featured: false, publish: true, vin: "9BWAC85U2SP901234" },
  { title: "Honda WR-V EXL CVT", brand: "Honda", model: "WR-V", year: 2024, price: 31_200_000, kilometers: 0, fuelType: "nafta", transmission: "automatica", bodyType: "suv", color: "Plata lunar", doors: 5, engine: "1.5L", condition: "new", status: "available", featured: false, publish: false, vin: "93HRV1M50RS012345" },
];

async function main() {
  const dealership = await prisma.dealership.findFirst({
    select: { id: true, name: true, slug: true },
  });

  if (!dealership) {
    console.error("✗ No se encontró ningún dealership. Creá uno desde /onboarding primero.");
    process.exit(1);
  }

  console.log(`→ Sembrando vehículos en: ${dealership.name} (slug: ${dealership.slug})`);

  // Chequeamos si ya hay un seed previo (matching por title+year+dealership)
  // y omitimos los duplicados manualmente — Vehicle no tiene unique compuesto.
  const existingTitles = new Set(
    (
      await prisma.vehicle.findMany({
        where: {
          dealershipId: dealership.id,
          title: { in: VEHICLES.map((v) => v.title) },
        },
        select: { title: true },
      })
    ).map((v) => v.title)
  );

  const data: Prisma.VehicleCreateManyInput[] = VEHICLES
    .filter((v) => !existingTitles.has(v.title))
    .map((v) => ({
      dealershipId: dealership.id,
      title: v.title,
      brand: v.brand,
      model: v.model,
      year: v.year,
      price: v.price,
      currency: "ARS",
      kilometers: v.kilometers,
      fuelType: v.fuelType,
      transmission: v.transmission,
      bodyType: v.bodyType,
      color: v.color,
      doors: v.doors,
      engine: v.engine,
      condition: v.condition,
      status: v.status,
      featured: v.featured,
      // Los publicados se ven en el sitio del tenant; los no publicados quedan
      // como borradores en el dashboard.
      publishedAt: v.publish ? new Date() : null,
      licensePlate: v.licensePlate,
      vin: v.vin,
      description: v.description,
    }));

  if (data.length === 0) {
    console.log("✓ Todos los vehículos del seed ya existen — nada nuevo que crear.");
    return;
  }

  const result = await prisma.vehicle.createMany({ data });
  console.log(`✓ Insertados ${result.count} vehículos nuevos`);
  console.log(`  (${VEHICLES.length - data.length} omitidos por título duplicado)`);
}

main()
  .catch((e) => {
    console.error("✗ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
