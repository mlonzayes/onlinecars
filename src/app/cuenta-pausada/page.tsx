import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Lock, MessageCircle } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

// Pantalla mostrada cuando el dealership tiene trial vencido o cuenta suspendida.
// El layout del dashboard redirige acá si subscriptionStatus !== "active|trial vigente".
// El user NO puede acceder a ningún dato del dashboard hasta que el admin
// re-active la cuenta (cambia subscriptionStatus a "active" desde /admin).

// Número de WhatsApp del soporte/admin para que el cliente reactive su plan.
// Tomado de NEXT_PUBLIC_SUPPORT_WHATSAPP. Si no está seteado cae a un placeholder.
const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "5491100000000";

const COPY = {
  expired: {
    title: "Tu prueba terminó",
    body: "Tu período de prueba de 15 días finalizó. Contactanos para activar tu plan y seguir gestionando tu concesionario.",
    whatsappMsg: "Hola! Mi prueba en motorflow terminó y quiero activar un plan.",
  },
  suspended: {
    title: "Tu cuenta está pausada",
    body: "Tu cuenta fue pausada temporalmente. Contactanos para resolver la situación y reactivarla.",
    whatsappMsg: "Hola! Mi cuenta de motorflow está pausada y quiero reactivarla.",
  },
} as const;

type Reason = keyof typeof COPY;

function isReason(v: string | undefined): v is Reason {
  return v === "expired" || v === "suspended";
}

export default async function CuentaPausadaPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { userId } = await auth();
  // Si no está logueado, no tiene sentido estar acá — lo mandamos al landing.
  if (!userId) redirect("/");

  const { reason } = await searchParams;
  const copy = COPY[isReason(reason) ? reason : "expired"];

  const whatsappHref = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(copy.whatsappMsg)}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <Lock className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.body}</p>

        <div className="mt-8 space-y-3">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-green-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Contactar por WhatsApp
          </a>

          <SignOutButton redirectUrl="/">
            <Button variant="outline" className="w-full">
              Cerrar sesión
            </Button>
          </SignOutButton>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          motorflow · soporte@motorflowapp.com
        </p>
      </div>
    </div>
  );
}
