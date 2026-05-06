import { z } from "zod";
import {
  CUSTOMER_TYPES,
  CUSTOMER_DOCUMENT_TYPES,
  PROVINCIAS_ARGENTINA,
} from "@/lib/constants";

// Regex base laxa: acepta dígitos, puntos, guiones y letras (estas últimas
// solo para PASAPORTE). El formato exacto se valida en validateDocumentNumber
// según el documentType seleccionado.
const documentNumberSchema = z
  .string()
  .min(6, "Mínimo 6 caracteres")
  .max(20, "Máximo 20 caracteres")
  .regex(/^[A-Za-z0-9.-]+$/, "Solo letras, números, puntos y guiones");

const customerBaseSchema = z.object({
  type: z.enum(CUSTOMER_TYPES).default("individual"),
  documentType: z.enum(CUSTOMER_DOCUMENT_TYPES),
  documentNumber: documentNumberSchema,
  firstName: z.string().min(1, "Requerido").max(100),
  lastName: z.string().max(100).optional(),
  businessName: z.string().max(200).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  province: z.enum(PROVINCIAS_ARGENTINA).optional(),
  notes: z.string().max(2000).optional(),
});

// Cross-field: si type=company, businessName es obligatorio y documentType debe ser CUIT.
function validateCompanyShape(
  data: z.infer<typeof customerBaseSchema>,
  ctx: z.RefinementCtx
) {
  if (data.type !== "company") return;

  if (!data.businessName || data.businessName.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["businessName"],
      message: "Razón social requerida para empresas",
    });
  }
  if (data.documentType !== "CUIT") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["documentType"],
      message: "Las empresas se registran con CUIT",
    });
  }
}

// Cross-field: el formato del documentNumber depende del documentType.
// No verificamos dígito verificador (es trabajo de un servicio externo) — solo
// que el formato sea consistente con el tipo elegido.
function validateDocumentNumber(
  data: z.infer<typeof customerBaseSchema>,
  ctx: z.RefinementCtx
) {
  if (!data.documentType || !data.documentNumber) return;

  // Para DNI/CUIT/CUIL aceptamos puntos y guiones decorativos pero validamos
  // sobre los dígitos puros — se normaliza en el handler antes de guardar.
  const digits = data.documentNumber.replace(/[.-]/g, "");

  switch (data.documentType) {
    case "DNI": {
      if (!/^\d{7,8}$/.test(digits)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["documentNumber"],
          message: "El DNI debe tener 7 u 8 dígitos numéricos",
        });
      }
      break;
    }
    case "CUIT":
    case "CUIL": {
      if (!/^\d{11}$/.test(digits)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["documentNumber"],
          message: `El ${data.documentType} debe tener 11 dígitos (con o sin guiones)`,
        });
      }
      break;
    }
    case "PASAPORTE": {
      if (!/^[A-Za-z0-9]{6,12}$/.test(data.documentNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["documentNumber"],
          message: "El pasaporte debe ser alfanumérico, 6-12 caracteres",
        });
      }
      break;
    }
  }
}

export const customerCreateSchema = customerBaseSchema.superRefine((data, ctx) => {
  validateCompanyShape(data, ctx);
  validateDocumentNumber(data, ctx);
});

// Para update permitimos campos parciales pero seguimos validando si type/document vienen seteados.
export const customerUpdateSchema = customerBaseSchema
  .partial()
  .superRefine((data, ctx) => {
    if (data.type === "company") {
      validateCompanyShape(data as z.infer<typeof customerBaseSchema>, ctx);
    }
    if (data.documentType && data.documentNumber) {
      validateDocumentNumber(data as z.infer<typeof customerBaseSchema>, ctx);
    }
  });

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
