import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { dealershipCreateSchema } from "@/lib/validators/dealership";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { type PlanType } from "@/lib/plans";

const TRIAL_DAYS = 15;
const VALID_PLANS: PlanType[] = ["base", "media", "premium", "enterprise"];

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

  // Plan asignado: si el admin seteó publicMetadata.assignedPlan en Clerk,
  // la cuenta arranca activa con ese plan directo (sin trial).
  // Caso de uso: activar un plan pago para un cliente que ya cerró contrato.
  // Si no hay assignedPlan → trial base de TRIAL_DAYS días (default para demos).
  const clerkUser = await currentUser();
  const rawPlan = clerkUser?.publicMetadata?.assignedPlan as string | undefined;
  const assignedPlan: PlanType | null =
    rawPlan && VALID_PLANS.includes(rawPlan as PlanType) ? (rawPlan as PlanType) : null;

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

  // Si hay plan asignado → cuenta activa inmediata sin período de prueba.
  // Si no → trial de TRIAL_DAYS días (comportamiento default).
  const trialEndsAt = assignedPlan
    ? null
    : (() => {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() + TRIAL_DAYS);
        return d;
      })();

  const dealershipId = crypto.randomUUID();

  const [dealership] = await prisma.$transaction([
    prisma.dealership.create({
      data: {
        id: dealershipId,
        ...parsed.data,
        plan: assignedPlan ?? "base",
        subscriptionStatus: assignedPlan ? "active" : "trial",
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
    plan: dealership.plan,
    subscriptionStatus: dealership.subscriptionStatus,
    trialEndsAt: trialEndsAt?.toISOString() ?? null,
  });

  return NextResponse.json(
    { data: { dealershipId: dealership.id, slug: dealership.slug } },
    { status: 201 }
  );
});
