import { NextResponse, after } from "next/server";
import { getDealershipBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { applyRateLimit, getClientIp, publicLeadsLimiter } from "@/lib/rate-limit";
import { isHoneypotTriggered } from "@/lib/honeypot";
import { createNotification } from "@/lib/notifications";
import {
  extractMetaBrowserSignals,
  getTenantCapiCredentials,
  sendMetaConversionEvent,
} from "@/lib/meta/capi";
import { META_EVENT_ID_FIELD } from "@/lib/meta/events";
import { canUseMetaPixel } from "@/lib/plans";

type TenantParams = { slug: string };

const leadSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  message: z.string().optional().or(z.literal("")),
  vehicleId: z.string().optional(),
  // Dedup contra el evento que ya mandó el pixel del browser del tenant.
  [META_EVENT_ID_FIELD]: z.string().uuid().optional(),
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

  // Notificación in-app (fail-open: no rompe la respuesta del lead).
  await createNotification({
    dealershipId: dealership.id,
    type: "lead",
    title: "Nuevo lead",
    body: `${lead.name} dejó una consulta`,
    link: "/dashboard/leads",
    requestId,
  });

  // --- Conversión al pixel DEL CONCESIONARIO (no al nuestro) ---
  //
  // El doble chequeo plan + credenciales es el mismo del tenant layout: si el
  // dealer bajó de plan, dejamos de mandarle eventos aunque la config siga en
  // la DB. Ver src/app/tenant/[slug]/layout.tsx.
  //
  // `after()` lo corre una vez respondido el 201 — el visitante no espera a Meta.
  const capi = canUseMetaPixel(dealership) ? getTenantCapiCredentials(dealership) : null;
  if (capi) {
    const eventId = parsed.data[META_EVENT_ID_FIELD] ?? globalThis.crypto.randomUUID();
    const eventSourceUrl = request.headers.get("referer");
    const signals = extractMetaBrowserSignals(request, eventSourceUrl);
    const [firstName, ...rest] = parsed.data.name.trim().split(/\s+/);

    after(async () => {
      await sendMetaConversionEvent({
        credentials: capi,
        eventName: "Lead",
        eventId,
        eventSourceUrl,
        userData: {
          email: parsed.data.email || null,
          phone: parsed.data.phone || null,
          firstName,
          lastName: rest.join(" ") || null,
          city: dealership.city,
          state: dealership.province,
          country: dealership.country,
          clientIpAddress: ip,
          ...signals,
        },
        customData: {
          contentName: "consulta-vehiculo",
          contentType: "vehicle",
          // El vehículo consultado es la señal que le permite a Meta armar
          // públicos por interés real (quién pregunta por pickups vs por 0km).
          ...(lead.vehicleId ? { contentIds: [lead.vehicleId] } : {}),
        },
        requestId,
        logContext: { slug, dealershipId: dealership.id, surface: "tenant" },
      });
    });
  }

  return NextResponse.json({ data: { id: lead.id } }, { status: 201, headers: rl.headers });
});
