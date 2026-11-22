"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface BlogPostRowActionsProps {
  id: string;
  title: string;
  /** Ruta pública si la nota ya salió; null si es borrador o programada. */
  publicHref: string | null;
}

export function BlogPostRowActions({ id, title, publicHref }: BlogPostRowActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDeleteConfirmed() {
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("No se pudo borrar la nota");
        return;
      }
      toast.success("Nota borrada");
      router.refresh();
    } finally {
      setConfirmOpen(false);
    }
  }

  return (
    <div className="flex justify-end gap-1">
      {publicHref && (
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={publicHref} target="_blank" />}>
          Ver
        </Button>
      )}
      <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/blog/${id}`} />}>
        Editar
      </Button>
      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmOpen(true)}>
        Borrar
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Borrar nota"
        description={`"${title}" se borra del blog, del sitemap y de llms.txt. No se puede deshacer.`}
        confirmLabel="Borrar"
        destructive
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}
