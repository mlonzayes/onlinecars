import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Fecha estimada de release (ej: "Q1 2026", "On demand"). */
  eta?: string;
  /** Bullets descriptivos de qué va a poder hacer el usuario. */
  features?: string[];
}

export function ComingSoon({
  icon: Icon,
  title,
  description,
  eta,
  features,
}: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        {eta && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
            {eta}
          </span>
        )}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-br from-blue-50 via-blue-50/40 to-transparent px-6 py-12 sm:px-12 sm:py-16">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <Icon className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-xl font-bold">Próximamente disponible</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {features && features.length > 0 && (
          <CardContent className="border-t bg-white pt-6 pb-6">
            <p className="text-sm font-semibold">Qué vas a poder hacer:</p>
            <ul className="mt-4 space-y-2.5">
              {features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
