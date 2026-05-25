import { redirect } from "next/navigation";

/**
 * El sign-up público está deshabilitado a propósito.
 * La ÚNICA forma de crear una cuenta es vía /registro?token=xxx, donde el
 * token lo genera el admin desde /admin/waitlist al aprobar un lead.
 *
 * Si alguien navega manualmente a /sign-up, lo mandamos al landing.
 */
export default function SignUpDisabledPage() {
  redirect("/");
}
