"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, MessageSquare, Star, ShoppingCart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

const ICON_BY_TYPE: Record<string, React.ComponentType<{ className?: string }>> = {
  lead: MessageSquare,
  review: Star,
  sale: ShoppingCart,
};

// Cada 60s. Solo se pollea el contador (liviano, vía Redis) y SOLO con la
// pestaña visible (ver Page Visibility abajo). Los items se traen al abrir.
const POLL_MS = 60_000;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "recién";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  // Polling liviano: solo el contador, desde Redis. No trae la lista completa.
  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setUnread(json.data?.unread ?? 0);
    } catch {
      // Silencioso: es polling, reintenta en el próximo tick.
    }
  }, []);

  // Fetch pesado: la lista de items. Solo al abrir la campanita.
  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.data ?? []);
      setUnread(json.meta?.unread ?? 0);
    } catch {
      // Silencioso
    }
  }, []);

  useEffect(() => {
    // Solo polleamos con la pestaña visible: una tab en segundo plano no le pega
    // a la base por nada. Al volver al foco refrescamos de inmediato.
    let id: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (id !== null) return;
      fetchUnread();
      id = setInterval(fetchUnread, POLL_MS);
    }
    function stop() {
      if (id !== null) {
        clearInterval(id);
        id = null;
      }
    }
    function onVisibilityChange() {
      if (document.visibilityState === "visible") start();
      else stop();
    }

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchUnread]);

  async function markAllRead() {
    // Optimista: limpiamos en UI y confirmamos contra el server.
    setUnread(0);
    setItems((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
    );
    try {
      await fetch("/api/notifications", { method: "PATCH" });
    } catch {
      fetchItems();
    }
  }

  const hasUnread = unread > 0;

  return (
    <DropdownMenu onOpenChange={(open) => open && fetchItems()}>
      <DropdownMenuTrigger
        aria-label="Notificaciones"
        className="relative inline-flex size-8 items-center justify-center rounded-md text-sm outline-none hover:bg-accent"
      >
        <Bell className="size-4" />
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notificaciones</span>
          {hasUnread && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <Bell className="size-7 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No tenés notificaciones</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {items.map((n) => {
              const Icon = ICON_BY_TYPE[n.type] ?? Bell;
              const unreadItem = n.readAt === null;
              const content = (
                <div
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors hover:bg-accent",
                    unreadItem && "bg-blue-50/60 dark:bg-blue-950/20"
                  )}
                >
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {n.title}
                      {unreadItem && (
                        <span className="size-1.5 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </p>
                    {n.body && (
                      <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              );

              return n.link ? (
                <Link key={n.id} href={n.link} className="block">
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
