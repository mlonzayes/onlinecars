import { NextResponse } from "next/server";
import { getDealershipBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { applyRateLimit, getClientIp, publicLeadsLimiter } from "@/lib/rate-limit";
import { isHoneypotTriggered } from "@/lib/honeypot";

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

  // Rate limit por IP+slug — evita que un atacante apuntando a un tenant
  // consuma el cupo de los demás. Antes de tocar DB, antes de validar.
  const ip = getClientIp(request);
  const rl = await applyRateLimit(publicLeadsLimiter, `${ip}:${slug}`, requestId, { slug });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Probá en unos minutos." },
      { status: 429, headers: rl.headers }
    );
  }

  const dealership = await getDealershipBySlug(slug);

  if (!dealership) {
    logger.warn(requestId, "public.leads.tenant_not_found", { slug });
    return NextResponse.json(
      { error: "Concesionario no encontrado" },
      { status: 404, headers: rl.headers }
    );
  }

  const body = await request.json();

  // Honeypot — si el bot rellenó el campo trampa, fingimos éxito y nos vamos.
  // No tocamos DB. No devolvemos error (no enseñamos al bot que detectamos).
  if (isHoneypotTriggered(body)) {
    logger.warn(requestId, "public.leads.honeypot_triggered", {
      slug,
      dealershipId: dealership.id,
    });
    return NextResponse.json(
      { data: { id: globalThis.crypto.randomUUID() } },
      { status: 201, headers: rl.headers }
    );
  }

  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "public.leads.invalid_input", {
      slug,
      dealershipId: dealership.id,
      details: parsed.error.flatten().fieldErrors,
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400, headers: rl.headers }
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

  return NextResponse.json({ data: { id: lead.id } }, { status: 201, headers: rl.headers });
});
