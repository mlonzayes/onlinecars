import { NextResponse } from "next/server";
import { getDealershipBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

type TenantParams = { slug: string };

const leadSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  message: z.string().optional().or(z.literal("")),
  vehicleId: z.string().optional(),
});

export const POST = withLogger<TenantParams>(async (request, { requestId, params }) => {
  const { slug } = params;
  const dealership = await getDealershipBySlug(slug);

  if (!dealership) {
    logger.warn(requestId, "public.leads.tenant_not_found", { slug });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "public.leads.invalid_input", {
      slug,
      dealershipId: dealership.id,
      details: parsed.error.flatten().fieldErrors,
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.create({
    data: {
      dealershipId: dealership.id,
      vehicleId: parsed.data.vehicleId || null,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      message: parsed.data.message || null,
      source: "web",
      status: "new",
    },
  });

  logger.info(requestId, "public.leads.created", {
    slug,
    dealershipId: dealership.id,
    leadId: lead.id,
    hasVehicle: lead.vehicleId !== null,
  });

  return NextResponse.json({ data: { id: lead.id } }, { status: 201 });
});
