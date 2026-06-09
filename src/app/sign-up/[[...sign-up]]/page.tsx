import { redirect } from "next/navigation";

/**
 * El sign-up público está deshabilitado a propósito.
 * La forma de dar de alta a un usuario es que se contacte mediante el formulario
 * y el equipo lo dé de alta manualmente.
 *
 * Si alguien navega manualmente a /sign-up, lo mandamos al landing.
 */
export default function SignUpDisabledPage() {
  redirect("/");
}
