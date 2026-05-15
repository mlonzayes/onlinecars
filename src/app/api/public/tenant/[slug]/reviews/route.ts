import { NextResponse } from "next/server";
import { getDealershipBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { reviewCreateSchema } from "@/lib/validators/review";
import { applyRateLimit, getClientIp, publicReviewsLimiter } from "@/lib/rate-limit";
import { isHoneypotTriggered } from "@/lib/honeypot";

type TenantParams = { slug: string };

// POST /api/public/tenant/[slug]/reviews
// Lo usa el sitio del concesionario ({slug}.motorflow.com.ar) cuando un visitante
// envía una opinión. Las reviews entran como `pending` y necesitan moderación
// desde el dashboard antes de mostrarse.
export const POST = withLogger<TenantParams>(async (request, { requestId, params }) => {
  const { slug } = params;

  const ip = getClientIp(request);
  const rl = await applyRateLimit(publicReviewsLimiter, `${ip}:${slug}`, requestId, { slug });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Probá en unos minutos." },
      { status: 429, headers: rl.headers }
    );
  }

  const dealership = await getDealershipBySlug(slug);

  if (!dealership) {
    logger.warn(requestId, "public.reviews.tenant_not_found", { slug });
    return NextResponse.json(
      { error: "Concesionario no encontrado" },
      { status: 404, headers: rl.headers }
    );
  }

  const body = await request.json().catch(() => null);
  if (body === null) {
    logger.warn(requestId, "public.reviews.invalid_body", { slug, dealershipId: dealership.id });
    return NextResponse.json({ error: "Body inválido" }, { status: 400, headers: rl.headers });
  }

  if (isHoneypotTriggered(body)) {
    logger.warn(requestId, "public.reviews.honeypot_triggered", {
      slug,
      dealershipId: dealership.id,
    });
    return NextResponse.json(
      { data: { id: globalThis.crypto.randomUUID() } },
      { status: 201, headers: rl.headers }
    );
  }

  const parsed = reviewCreateSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "public.reviews.invalid_input", {
      slug,
      dealershipId: dealership.id,
      details: parsed.error.flatten().fieldErrors,
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400, headers: rl.headers }
    );
  }

  const review = await prisma.review.create({
    data: {
      dealershipId: dealership.id,
      name: parsed.data.name,
      content: parsed.data.content,
      rating: parsed.data.rating,
      status: "pending",
    },
    select: { id: true },
  });

  logger.info(requestId, "public.reviews.created", {
    slug,
    dealershipId: dealership.id,
    reviewId: review.id,
    rating: parsed.data.rating,
  });

  return NextResponse.json({ data: { id: review.id } }, { status: 201, headers: rl.headers });
});
