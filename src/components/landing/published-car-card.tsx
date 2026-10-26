import Image from "next/image";

/**
 * Vista previa del auto recién publicado, como la mostraría el chat: va DENTRO
 * de la conversación (no flotando afuera) para que el hero sea un solo bloque
 * que entra en cualquier alto de pantalla.
 */
export function PublishedCarCard() {
  return (
    <div
      className="chat-in mr-auto flex w-[85%] items-center gap-3 rounded-xl border border-ink/10 bg-white p-2 shadow-sm"
      style={{ animationDelay: "3.4s" }}
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-paper-deep">
        <Image
          src="/premium_images/P10_sedan_azul.png"
          alt="Toyota Corolla publicado en el catálogo del concesionario"
          fill
          sizes="56px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-xs text-ink">Toyota Corolla XEI 2019</p>
        <p className="mt-0.5 font-display text-sm font-medium text-brand">$18.500.000</p>
        <p className="mt-0.5 truncate text-[10px] text-ink-soft">tuagencia.motorflowapp.com</p>
      </div>
    </div>
  );
}
