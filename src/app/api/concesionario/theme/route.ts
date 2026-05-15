import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { invalidateTenantHomeBundle } from "@/lib/tenant";

const themeUpdateSchema = z.object({
  colorPrimary: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hex válido (ej: #2563eb)")
    .optional(),
  darkMode: z.boolean().optional(),
  heroType: z.enum(["none", "image", "video"]).optional(),
  heroUrl: z.string().url("URL inválida").nullable().optional(),
  customDomain: z.string().max(253).nullable().optional(),
});

// PATCH /api/concesionario/theme
// Actualiza solo el theme del concesionario.
// Body: { colorPrimary?: string; darkMode?: boolean; heroType?: string; heroUrl?: string; customDomain?: string }
// Response 200: { data: { theme } }
export const PATCH = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "dealership.theme.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "dealership.theme.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const body: unknown = await request.json();
  const parsed = themeUpdateSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "dealership.theme.invalid_input", {
      dealershipId: dealership.id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Merge con el theme existente para no pisar valores anteriores
  const currentTheme =
    dealership.theme && typeof dealership.theme === "object" && !Array.isArray(dealership.theme)
      ? (dealership.theme as Record<string, unknown>)
      : {};

  const newTheme = {
    colorPrimary: "#2563eb",
    darkMode: false,
    heroType: "none",
    heroUrl: null,
    customDomain: null,
    ...currentTheme,
    ...parsed.data,
  };

  const updated = await prisma.dealership.update({
    where: { id: dealership.id },
    data: { theme: newTheme },
    select: { theme: true },
  });

  await invalidateTenantHomeBundle(dealership.slug);

  logger.info(requestId, "dealership.theme.updated", {
    dealershipId: dealership.id,
    fields: Object.keys(parsed.data),
  });

  return NextResponse.json({ data: { theme: updated.theme } });
});
