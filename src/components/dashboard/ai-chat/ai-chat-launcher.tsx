"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CHAT_COPY } from "@/lib/chat/copy";
import { ChatLocked } from "./chat-locked";
import { ChatPanel } from "./chat-panel";

interface AiChatLauncherProps {
  // La cuenta tiene el add-on contratado (cupo > 0).
  enabled: boolean;
  contactHref: string;
}

// Botón del header que abre el asistente. El panel se monta recién al abrir el
// sheet, así que la conversación no se pide hasta que el usuario la quiere ver.
export function AiChatLauncher({ enabled, contactHref }: AiChatLauncherProps) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" className="h-8 gap-1.5" />}>
        <Sparkles className="size-3.5" />
        <span className="hidden sm:inline">{CHAT_COPY.launcher}</span>
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        {enabled ? <ChatPanel /> : <ChatLocked contactHref={contactHref} />}
      </SheetContent>
    </Sheet>
  );
}
