import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import {
  sectionPatchSchema,
  sectionTypeSchema,
} from "@/lib/validators/section";
import { sectionConfigSchemaFor } from "@/lib/sections/config-schemas";
import { invalidateTenantHomeBundle, resolveSection } from "@/lib/tenant";
import type { SectionType } from "@/lib/constants";

type RouteParams = { type: string };

// Normaliza string entrante: trim, vacío => null. Si viene null explícito, lo respeta.
function normalizeNullableString(
  value: string | null | undefined
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

// PATCH /api/concesionario/sections/[type]
// Body: SectionPatchInput (Partial: enabled, title, subtitle, content, config)
// Response 200: { data: { section: TenantHomeBundleSection } }
export const PATCH = withLogger<RouteParams>(async (request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "sections.update.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "sections.update.no_dealership", { userId });
    return NextResponse.json(
      { error: "Concesionario no encontrado" },
      { status: 404 }
    );
  }

  const typeParsed = sectionTypeSchema.safeParse(params.type);
  if (!typeParsed.success) {
    logger.warn(requestId, "sections.update.invalid_type", {
      dealershipId: dealership.id,
      type: params.type,
    });
    return NextResponse.json(
      { error: "Tipo de sección inválido" },
      { status: 400 }
    );
  }
  const type: SectionType = typeParsed.data;

  const body: unknown = await request.json();
  const parsed = sectionPatchSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "sections.update.invalid_input", {
      dealershipId: dealership.id,
      type,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // El catálogo es obligatorio — no se puede desactivar desde el dashboard.
  if (type === "catalog" && parsed.data.enabled === false) {
    logger.warn(requestId, "sections.update.catalog_disable_blocked", {
      dealershipId: dealership.id,
    });
    return NextResponse.json(
      { error: "El catálogo no se puede desactivar" },
      { status: 400 }
    );
  }

  // Validación profunda del config según el tipo de sección.
  let validatedConfig: Prisma.InputJsonValue | undefined = undefined;
  if (parsed.data.config !== undefined && parsed.data.config !== null) {
    const configSchema = sectionConfigSchemaFor(type);
    const configParsed = configSchema.safeParse(parsed.data.config);
    if (!configParsed.success) {
      logger.warn(requestId, "sections.update.invalid_config", {
        dealershipId: dealership.id,
        type,
        details: configParsed.error.flatten(),
      });
      return NextResponse.json(
        {
          error: "Configuración de sección inválida",
          details: configParsed.error.flatten(),
        },
        { status: 400 }
      );
    }
    validatedConfig = configParsed.data as unknown as Prisma.InputJsonValue;
  }

  // Armamos el data del update solo con los campos presentes en el body.
  // Las strings vacías se normalizan a null (revert a default).
  const data: Prisma.DealershipSectionUpdateInput = {};
  if (parsed.data.enabled !== undefined) data.enabled = parsed.data.enabled;
  if (parsed.data.title !== undefined) {
    data.title = normalizeNullableString(parsed.data.title);
  }
  if (parsed.data.subtitle !== undefined) {
    data.subtitle = normalizeNullableString(parsed.data.subtitle);
  }
  if (parsed.data.content !== undefined) {
    data.content = normalizeNullableString(parsed.data.content);
  }
  if (parsed.data.config === null) {
    // null explícito => limpiar a JSON null (vuelve al default vía resolveSection).
    data.config = Prisma.JsonNull;
  } else if (validatedConfig !== undefined) {
    data.config = validatedConfig;
  }

  try {
    const updated = await prisma.dealershipSection.update({
      where: {
        dealershipId_type: { dealershipId: dealership.id, type },
      },
      data,
    });

    await invalidateTenantHomeBundle(dealership.slug);

    logger.info(requestId, "sections.update.ok", {
      dealershipId: dealership.id,
      type,
      fields: Object.keys(parsed.data),
    });

    return NextResponse.json({ data: { section: resolveSection(updated) } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      logger.warn(requestId, "sections.update.not_found", {
        dealershipId: dealership.id,
        type,
      });
      return NextResponse.json(
        { error: "Sección no encontrada" },
        { status: 404 }
      );
    }
    throw error;
  }
});
