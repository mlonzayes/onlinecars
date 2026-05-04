"use client";

import { useTheme } from "next-themes";
import { useCallback } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon } from "lucide-react";

export function ThemeSettings() {
  const { setTheme, theme: currentTheme } = useTheme();

  const isDark = currentTheme === "dark";

  const handleDarkModeChange = useCallback(
    async (checked: boolean) => {
      const nextTheme = checked ? "dark" : "light";
      setTheme(nextTheme);

      try {
        const response = await fetch("/api/concesionario/theme", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ darkMode: checked }),
        });

        if (!response.ok) throw new Error("Error al guardar el tema");
        toast.success(checked ? "Modo oscuro activado" : "Modo claro activado", { duration: 2000 });
      } catch {
        toast.error("No se pudo guardar el modo oscuro");
      }
    },
    [setTheme]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-indigo-500" />
          Apariencia del panel
        </CardTitle>
        <CardDescription>Esto solo afecta al panel de administración, no a tu sitio web público.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="dark-mode-switch" className="cursor-pointer">
            Modo oscuro
          </Label>
          <Switch
            id="dark-mode-switch"
            checked={isDark}
            onCheckedChange={handleDarkModeChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
