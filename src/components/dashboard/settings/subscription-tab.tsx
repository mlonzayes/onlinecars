"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Rocket, Zap, Crown } from "lucide-react";
import type { Dealership } from "@prisma/client";

interface SubscriptionTabProps {
  dealership: Dealership;
}

const PLAN_DETAILS = {
  base: {
    name: "Base",
    icon: <Rocket className="h-5 w-5" />,
    features: ["Hasta 30 vehículos", "Hasta 50 clientes", "1 usuario (solo dueño)"],
    color: "bg-secondary text-secondary-foreground",
  },
  media: {
    name: "Media",
    icon: <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
    features: ["Hasta 100 vehículos", "Hasta 2000 clientes", "3 usuarios (dueño + 2 vendedores)", "Acciones masivas", "Integración con Mercado Libre"],
    color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400",
  },
  premium: {
    name: "Premium",
    icon: <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
    features: ["Vehículos ilimitados", "Clientes ilimitados", "Usuarios ilimitados", "Todas las integraciones", "Soporte prioritario"],
    color: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-400",
  },
  enterprise: {
    name: "Enterprise",
    icon: <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    features: ["Funciones personalizadas", "SLA garantizado", "Desarrollos a medida"],
    color: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400",
  },
};

export function SubscriptionTab({ dealership }: SubscriptionTabProps) {
  const currentPlan = (dealership.plan || "base") as keyof typeof PLAN_DETAILS;
  const details = PLAN_DETAILS[currentPlan] || PLAN_DETAILS.base;

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          {details.icon}
        </div>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            Plan Actual
            <Badge variant="secondary" className={details.color}>
              {details.name}
            </Badge>
          </CardTitle>
          <CardDescription>
            Estás usando el plan {details.name}. Estos son tus límites y características actuales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {details.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t pt-6">
          <div className="flex w-full items-center justify-between">
            <p className="text-sm text-muted-foreground">¿Necesitás más capacidad?</p>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              nativeButton={false}
              render={
                <a
                  href={`https://wa.me/5491100000000?text=Hola%20equipo%20de%20Motorflow!%20Me%20gustar%C3%ADa%20mejorar%20el%20plan%20de%20mi%20concesionaria%20(${dealership.name}).`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              Hablar con Soporte
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
