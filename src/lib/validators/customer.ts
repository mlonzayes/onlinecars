import { z } from "zod";
import {
  CUSTOMER_TYPES,
  CUSTOMER_DOCUMENT_TYPES,
  PROVINCIAS_ARGENTINA,
} from "@/lib/constants";

// No verificamos dígito verificador del CUIT/DNI — eso es trabajo de un servicio externo.
// Esta validación cubre que sea numérico y de longitud razonable.
const documentNumberSchema = z
  .string()
  .min(7, "Mínimo 7 caracteres")
  .max(20, "Máximo 20 caracteres")
  .regex(/^[\d.-]+$/, "Solo números, puntos y guiones");

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

export const customerCreateSchema = customerBaseSchema.superRefine(validateCompanyShape);

// Para update permitimos campos parciales pero seguimos validando si type viene seteado.
export const customerUpdateSchema = customerBaseSchema
  .partial()
  .superRefine((data, ctx) => {
    if (data.type === "company") {
      validateCompanyShape(data as z.infer<typeof customerBaseSchema>, ctx);
    }
  });

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
