import { prisma } from "../src/lib/prisma";
import type { Prisma } from "@prisma/client";

// Seed de 20 clientes (10 particulares + 10 empresas) para testear paginación
// y búsqueda. Idempotente: usa createMany con skipDuplicates por la unique
// constraint (dealershipId, documentType, documentNumber).
//
// Toma el primer dealership encontrado. Si tenés múltiples, ajustá la query.

interface IndividualSeed {
  firstName: string;
  lastName: string;
  documentNumber: string; // DNI 7-8 dígitos
  email: string | null;
  phone: string | null;
  city: string;
  province: string;
}

interface CompanySeed {
  businessName: string;
  documentNumber: string; // CUIT 11 dígitos
  firstName: string; // contacto
  lastName: string;
  email: string;
  phone: string;
  city: string;
  province: string;
}

const INDIVIDUALS: IndividualSeed[] = [
  { firstName: "Juan", lastName: "Pérez", documentNumber: "33444555", email: "juan.perez@gmail.com", phone: "1141234567", city: "Quilmes", province: "Buenos Aires" },
  { firstName: "María", lastName: "González", documentNumber: "28765432", email: "maria.g@hotmail.com", phone: "1156789012", city: "CABA", province: "CABA" },
  { firstName: "Sofía", lastName: "Rodríguez", documentNumber: "31999111", email: null, phone: "1167890123", city: "La Plata", province: "Buenos Aires" },
  { firstName: "Mateo", lastName: "Fernández", documentNumber: "40123456", email: "mateo.f@yahoo.com.ar", phone: null, city: "Córdoba", province: "Córdoba" },
  { firstName: "Lucía", lastName: "Martínez", documentNumber: "35888777", email: "lu.martinez@gmail.com", phone: "1145678901", city: "Rosario", province: "Santa Fe" },
  { firstName: "Diego", lastName: "Sánchez", documentNumber: "29333222", email: null, phone: "1134567890", city: "Lanús", province: "Buenos Aires" },
  { firstName: "Camila", lastName: "Romero", documentNumber: "42111000", email: "cami.romero@gmail.com", phone: "1178901234", city: "Bernal", province: "Buenos Aires" },
  { firstName: "Federico", lastName: "Díaz", documentNumber: "30555444", email: "fede.diaz@outlook.com", phone: "1189012345", city: "Mendoza", province: "Mendoza" },
  { firstName: "Valentina", lastName: "Suárez", documentNumber: "38222333", email: null, phone: "1190123456", city: "Mar del Plata", province: "Buenos Aires" },
  { firstName: "Ramiro", lastName: "Acosta", documentNumber: "32777888", email: "ramiro.a@gmail.com", phone: "1101234567", city: "Tigre", province: "Buenos Aires" },
];

const COMPANIES: CompanySeed[] = [
  { businessName: "Auto Norte SA", documentNumber: "30712345671", firstName: "Roberto", lastName: "Silva", email: "ventas@autonorte.com.ar", phone: "1144556677", city: "San Isidro", province: "Buenos Aires" },
  { businessName: "Concesionaria del Sur SRL", documentNumber: "30700112233", firstName: "Patricia", lastName: "López", email: "info@delsur.com.ar", phone: "1133221100", city: "Avellaneda", province: "Buenos Aires" },
  { businessName: "Motors Argentina SA", documentNumber: "30681234566", firstName: "Carlos", lastName: "Vega", email: "carlos@motorsarg.com", phone: "1122334455", city: "CABA", province: "CABA" },
  { businessName: "Vehículos Premium SRL", documentNumber: "30699887766", firstName: "Alejandra", lastName: "Romero", email: "ventas@vpremium.ar", phone: "1166778899", city: "Tigre", province: "Buenos Aires" },
  { businessName: "Distribuidora Pampa SA", documentNumber: "30708899001", firstName: "Sergio", lastName: "Torres", email: "sergio@pampamotors.com", phone: "1155441122", city: "La Plata", province: "Buenos Aires" },
  { businessName: "AutoCity SRL", documentNumber: "30702244668", firstName: "Mónica", lastName: "Báez", email: "monica@autocity.com.ar", phone: "1177889900", city: "Vicente López", province: "Buenos Aires" },
  { businessName: "Garage Central SA", documentNumber: "30706655223", firstName: "Esteban", lastName: "Ríos", email: "info@garagecentral.com.ar", phone: "1144998877", city: "Rosario", province: "Santa Fe" },
  { businessName: "Mecánica del Plata SRL", documentNumber: "30704411887", firstName: "Romina", lastName: "Ferreyra", email: "ventas@mecplata.ar", phone: "1133778822", city: "CABA", province: "CABA" },
  { businessName: "Estrella Motors SA", documentNumber: "30709988332", firstName: "Hernán", lastName: "Aguirre", email: "hernan@estrellamotors.com", phone: "1188776655", city: "Córdoba", province: "Córdoba" },
  { businessName: "Vista Auto SRL", documentNumber: "30707788995", firstName: "Lorena", lastName: "Castillo", email: "lorena@vistaauto.com.ar", phone: "1199001122", city: "Quilmes", province: "Buenos Aires" },
];

async function main() {
  const dealership = await prisma.dealership.findFirst({
    select: { id: true, name: true, slug: true },
  });

  if (!dealership) {
    console.error("✗ No se encontró ningún dealership. Creá uno desde /onboarding primero.");
    process.exit(1);
  }

  console.log(`→ Sembrando customers en: ${dealership.name} (slug: ${dealership.slug})`);

  const data: Prisma.CustomerCreateManyInput[] = [
    ...INDIVIDUALS.map((c) => ({
      type: "individual",
      documentType: "DNI",
      documentNumber: c.documentNumber,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      city: c.city,
      province: c.province,
      notes: "Cliente generado por seed script",
      dealershipId: dealership.id,
    })),
    ...COMPANIES.map((c) => ({
      type: "company",
      documentType: "CUIT",
      documentNumber: c.documentNumber,
      businessName: c.businessName,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      city: c.city,
      province: c.province,
      notes: "Cliente generado por seed script",
      dealershipId: dealership.id,
    })),
  ];

  const result = await prisma.customer.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(`✓ Insertados ${result.count} clientes nuevos (omitidos los duplicados por documento)`);
}

main()
  .catch((e) => {
    console.error("✗ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
