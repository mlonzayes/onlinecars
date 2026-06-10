import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { dealershipCreateSchema } from "@/lib/validators/dealership";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

// Duración del período de prueba para nuevos dealerships.
// 15 días desde el momento del onboarding. Si cambiás esto, actualizá también
// el copy del landing/waitlist que menciona "demo gratuita de N días".
const TRIAL_DAYS = 15;

// POST /api/onboarding
// Body: DealershipCreateInput
// Response 201: { data: { dealershipId, slug } }
// Response 400: validación fallida
// Response 401: no autenticado
// Response 409: slug ya en uso o ya tiene concesionario
export const POST = withLogger(async (req, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "onboarding.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const existing = await prisma.dealershipUser.findFirst({
    where: { clerkUserId: userId },
  });
  if (existing) {
    logger.warn(requestId, "onboarding.already_has_dealership", { userId });
    return NextResponse.json(
      { error: "Ya tenés un concesionario creado" },
      { status: 409 }
    );
  }

  const body = await req.json();
  const parsed = dealershipCreateSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn(requestId, "onboarding.invalid_input", {
      userId,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const slugTaken = await prisma.dealership.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (slugTaken) {
    logger.warn(requestId, "onboarding.slug_taken", {
      userId,
      slug: parsed.data.slug,
    });
    return NextResponse.json(
      {
        error: "El nombre de sitio ya está en uso. Elegí otro.",
        details: { fieldErrors: { slug: ["Ya está en uso"] } },
      },
      { status: 409 }
    );
  }

  // Trial: TRIAL_DAYS desde ahora. Status arranca en "trial".
  // El cron diario marca como "expired" cuando trialEndsAt < now().
  const trialEndsAt = new Date();
  trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + TRIAL_DAYS);

  const dealershipId = crypto.randomUUID();

  const [dealership] = await prisma.$transaction([
    prisma.dealership.create({
      data: {
        id: dealershipId,
        ...parsed.data,
        subscriptionStatus: "trial",
        trialEndsAt,
      },
    }),
    prisma.dealershipUser.create({
      data: { clerkUserId: userId, dealershipId, role: "admin" },
    }),
  ]);

  logger.info(requestId, "onboarding.created", {
    userId,
    dealershipId: dealership.id,
    slug: dealership.slug,
    trialEndsAt: trialEndsAt.toISOString(),
  });

  return NextResponse.json(
    { data: { dealershipId: dealership.id, slug: dealership.slug } },
    { status: 201 }
  );
});
