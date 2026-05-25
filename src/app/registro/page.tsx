import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";

/**
 * /registro?token=xxx
 *
 * Única ruta pública por la que un usuario puede crear su cuenta en la app.
 * Valida que:
 *   - El token existe en WaitlistEntry
 *   - status === "invited" (no usado todavía, no rechazado)
 *   - inviteExpiresAt > ahora
 *
 * Si pasa, renderiza el <SignUp /> de Clerk con el email pre-llenado del
 * waitlist entry. Si falla, muestra una pantalla de error con copy claro.
 *
 * El sign-up público (/sign-up) NO debe ser accesible — ver la nota en el
 * archivo de esa ruta. Esta es la única entrada al onboarding.
 */
export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <InvalidInviteScreen reason="missing_token" />;
  }

  const lead = await prisma.waitlistEntry.findUnique({
    where: { inviteToken: token },
    select: {
      email: true,
      name: true,
      status: true,
      inviteExpiresAt: true,
    },
  });

  if (!lead) {
    return <InvalidInviteScreen reason="not_found" />;
  }
  if (lead.status === "accepted") {
    return <InvalidInviteScreen reason="already_used" />;
  }
  if (lead.status === "rejected") {
    return <InvalidInviteScreen reason="rejected" />;
  }
  if (!lead.inviteExpiresAt || lead.inviteExpiresAt < new Date()) {
    return <InvalidInviteScreen reason="expired" />;
  }

  // Pasó todas las validaciones — renderizar el form de Clerk.
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">¡Bienvenido a motorflow!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Estás a un paso de empezar tu prueba de 25 días.
            {lead.name && ` Hola ${lead.name}.`}
          </p>
        </div>

        <SignUp
          // Pre-llenamos el email del waitlist entry para evitar inconsistencias.
          // Clerk permite que el user lo cambie igual — si lo cambia, no
          // matcheará con el waitlist y el onboarding no lo marcará como
          // "accepted". El flow sigue funcionando pero perdemos el link.
          initialValues={{ emailAddress: lead.email }}
          // Tras sign-up exitoso, mandamos al onboarding (que setea trial).
          forceRedirectUrl="/onboarding"
          signInUrl="/sign-in"
          appearance={{
            elements: {
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 shadow-sm transition-all",
              card: "shadow-2xl border border-gray-200 rounded-2xl",
            },
          }}
        />
      </div>
    </div>
  );
}

const ERROR_COPY: Record<string, { title: string; body: string }> = {
  missing_token: {
    title: "Falta el código de invitación",
    body: "Este link no tiene el token de invitación. Si ya tenés cuenta, podés iniciar sesión.",
  },
  not_found: {
    title: "Invitación inválida",
    body: "El link de invitación no es válido. Verificá que sea el link completo que te enviamos, o pedinos uno nuevo.",
  },
  already_used: {
    title: "Esta invitación ya fue usada",
    body: "Este link de invitación ya se usó para crear una cuenta. Si ya sos parte de motorflow, podés iniciar sesión.",
  },
  expired: {
    title: "El link expiró",
    body: "Este link de invitación ya venció. Contactanos para que te enviemos uno nuevo.",
  },
  rejected: {
    title: "Invitación no disponible",
    body: "Este lead no está habilitado para registrarse. Si creés que es un error, contactanos.",
  },
};

function InvalidInviteScreen({ reason }: { reason: keyof typeof ERROR_COPY }) {
  const copy = ERROR_COPY[reason];
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <AlertTriangle className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/sign-in"
            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
