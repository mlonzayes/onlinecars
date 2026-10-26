import { Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CHAT_COPY } from "@/lib/chat/copy";

interface ChatLockedProps {
  // wa.me de soporte con el mensaje de contratación ya cargado.
  contactHref: string;
}

// Estado del panel cuando la cuenta no contrató el add-on: muestra qué hace y
// cómo pedirlo. Mismo criterio que las features gateadas por plan.
export function ChatLocked({ contactHref }: ChatLockedProps) {
  return (
    <SheetHeader className="gap-3 pt-8 pr-12">
      <span className="flex size-9 items-center justify-center rounded-full bg-muted">
        <Lock className="size-4 text-muted-foreground" />
      </span>
      <SheetTitle>{CHAT_COPY.lockedTitle}</SheetTitle>
      <SheetDescription>{CHAT_COPY.lockedDescription}</SheetDescription>
      <a href={contactHref} target="_blank" rel="noopener noreferrer" className={buttonVariants({ className: "mt-2 w-fit" })}>
        {CHAT_COPY.lockedCta}
      </a>
    </SheetHeader>
  );
}
