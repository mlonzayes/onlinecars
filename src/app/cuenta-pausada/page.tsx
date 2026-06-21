import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Lock, MessageCircle, AlertTriangle } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { getCurrentDealership } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SITE_WHATSAPP } from "@/lib/seo";

// Pantalla mostrada cuando el dealership tiene trial vencido o cuenta suspendida.
// El layout del dashboard redirige acá si subscriptionStatus !== "active|trial vigente".
// El user NO puede acceder a ningún dato del dashboard hasta que el admin
// re-active la cuenta (cambia subscriptionStatus a "active" desde /admin).

const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? SITE_WHATSAPP;

// Días desde el vencimiento del pago antes de que la cuenta se elimine.
const GRACE_DAYS = 60;

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

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function CuentaPausadaPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const { reason } = await searchParams;
  const dealership = await getCurrentDealership();

  // Morosidad: suspendido con la suscripción vencida → cartel específico de impago.
  const now = Date.now();
  const overdue =
    dealership?.subscriptionStatus === "suspended" &&
    dealership.paidUntil &&
    dealership.paidUntil.getTime() < now
      ? (() => {
          const deadline = new Date(dealership.paidUntil!.getTime() + GRACE_DAYS * 86_400_000);
          const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now) / 86_400_000));
          return { deadline, daysLeft };
        })()
      : null;

  const copy = overdue
    ? {
        title: "Servicio suspendido por falta de pago",
        body: "Suspendimos tu servicio porque hay un pago pendiente. Regularizá tu cuenta para reactivar el acceso a tu concesionario.",
        whatsappMsg: "Hola! Quiero regularizar el pago de mi cuenta en motorflow.",
      }
    : COPY[isReason(reason) ? reason : "expired"];

  const whatsappHref = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(copy.whatsappMsg)}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <div
          className={`mb-6 flex h-14 w-14 items-center justify-center rounded-full ${overdue ? "bg-red-50" : "bg-amber-50"}`}
        >
          {overdue ? (
            <AlertTriangle className="h-7 w-7 text-red-600" />
          ) : (
            <Lock className="h-7 w-7 text-amber-600" />
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.body}</p>

        {/* Advertencia de eliminación por morosidad */}
        {overdue && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-semibold">
              Tenés hasta el {formatDate(overdue.deadline)} ({overdue.daysLeft} días) para abonar.
            </p>
            <p className="mt-1.5 text-red-800">
              Pasado ese plazo, tu cuenta y todos tus datos se eliminarán de forma
              permanente. Si querés dar de baja el servicio y exportar tu información,
              primero tenés que saldar el monto adeudado.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-3">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-green-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {overdue ? "Regularizar por WhatsApp" : "Contactar por WhatsApp"}
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
