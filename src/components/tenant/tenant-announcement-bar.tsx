interface TenantAnnouncementBarProps {
  text: string;
}

// Cartel superior full-width del template "impacto". Fijo arriba de todo (por
// encima del header flotante), en el color de marca, con la tipografía llamativa
// del scope (Unbounded) en mayúsculas para que resalte. Solo se renderiza si el
// dealer cargó un mensaje — ver TenantChrome.
export function TenantAnnouncementBar({ text }: TenantAnnouncementBarProps) {
  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex h-10 items-center justify-center bg-[var(--tenant-primary)] px-4">
      <p className="line-clamp-1 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white sm:text-xs">
        {text}
      </p>
    </div>
  );
}
