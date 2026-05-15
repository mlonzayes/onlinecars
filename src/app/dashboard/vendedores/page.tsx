import { getCurrentDealership } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HardHat } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VendedoresPage() {
  const dealership = await getCurrentDealership();
  
  if (!dealership) {
    redirect("/onboarding");
  }

  // Redirigir si no es admin (por seguridad)
  if (dealership.currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendedores</h1>
          <p className="text-muted-foreground">
            Gestión de equipo comercial y comisiones.
          </p>
        </div>
      </div>

      <Card className="border-dashed">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <HardHat className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Módulo en Desarrollo</CardTitle>
          <CardDescription>
            Próximamente podrás administrar los perfiles de tus vendedores, auditar qué vehículos y clientes crean, y llevar un seguimiento detallado de sus comisiones.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <p className="text-sm text-muted-foreground">
            Solo vos (como dueño/admin) vas a tener acceso a esta sección.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
