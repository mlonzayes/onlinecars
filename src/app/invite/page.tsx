import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import Link from "next/link";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/");
  }

  const invite = await prisma.dealershipInvite.findUnique({
    where: { token },
    include: { dealership: true },
  });

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Enlace inválido</CardTitle>
            <CardDescription>
              La invitación no existe o ya fue utilizada. Pedile al dueño de la concesionaria que te envíe un nuevo enlace.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invitación expirada</CardTitle>
            <CardDescription>
              Este enlace caducó el {invite.expiresAt.toLocaleDateString()}. Pedí un nuevo enlace de invitación.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { userId } = await auth();

  // Si el usuario ya está logueado en Clerk, asociarlo automáticamente
  if (userId) {
    // Verificar si ya pertenece a la concesionaria
    const existing = await prisma.dealershipUser.findUnique({
      where: {
        clerkUserId_dealershipId: {
          clerkUserId: userId,
          dealershipId: invite.dealershipId,
        },
      },
    });

    if (!existing) {
      await prisma.$transaction([
        prisma.dealershipUser.create({
          data: {
            clerkUserId: userId,
            dealershipId: invite.dealershipId,
            role: invite.role,
          },
        }),
        prisma.dealershipInvite.delete({ where: { id: invite.id } }),
      ]);
    } else {
      // Si ya existe, solo borramos la invitación
      await prisma.dealershipInvite.delete({ where: { id: invite.id } });
    }

    redirect("/dashboard");
  }

  // Si no está logueado, mostrar botón para registrarse
  const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in";
  const signUpUrl = signInUrl.replace("sign-in", "sign-up");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="space-y-4 pb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Unite al equipo</CardTitle>
          <CardDescription className="text-base">
            Te invitaron a unirte como <strong>Vendedor</strong> a la concesionaria{" "}
            <span className="font-semibold text-foreground">{invite.dealership.name}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" size="lg" asChild>
            <Link href={`${signUpUrl}?redirect_url=/invite?token=${token}`}>
              Crear cuenta y Aceptar Invitación
            </Link>
          </Button>
          <div className="text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{" "}
            <Link 
              href={`${signInUrl}?redirect_url=/invite?token=${token}`}
              className="text-blue-600 hover:underline"
            >
              Iniciá sesión acá
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
