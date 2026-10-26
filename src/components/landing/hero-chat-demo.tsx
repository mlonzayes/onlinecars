import { ChatBubble } from "./chat-bubble";
import { PublishedCarCard } from "./published-car-card";

/**
 * Video real de Mateo cargando un auto desde Claude. Cuando exista, dejarlo en
 * `public/video/` (vertical, mp4 H.264, sin audio, < 3 MB) y poner la ruta acá:
 * reemplaza la conversación de ejemplo. El video real es mejor prueba que
 * cualquier recreación, y es lo mismo que va a mostrar el anuncio de Meta.
 */
const HERO_VIDEO_SRC: string | null = null;

// La conversación sigue el comportamiento real del MCP: el auto entra como
// borrador y se publica solo cuando el dealer lo pide.
function DemoConversation() {
  return (
    <div className="flex flex-1 flex-col justify-end gap-2 overflow-hidden px-3 pb-3">
      <ChatBubble from="user" delay={0.3}>
        cargame un Corolla XEI 2019, 68.000 km, azul, a 18.500.000
      </ChatBubble>
      <span
        className="chat-in mr-auto rounded-md border border-dashed border-ink/25 px-2 py-0.5 text-[10px] text-ink-soft"
        style={{ animationDelay: "1s" }}
      >
        Usando motorflow · crear vehículo
      </span>
      <ChatBubble from="ai" delay={1.5}>
        Listo, cargué el Toyota Corolla XEI 2019 como borrador. ¿Lo publico en tu web?
      </ChatBubble>
      <ChatBubble from="user" delay={2.4}>
        dale
      </ChatBubble>
      <ChatBubble from="ai" delay={3}>
        Publicado. Ya aparece en tu catálogo.
      </ChatBubble>
      <PublishedCarCard />
    </div>
  );
}

export function HeroChatDemo() {
  return (
    <div className="mx-auto w-full max-w-[340px] lg:mr-0">
      {/* Alto atado al viewport en desktop: así el hero entra entero en una
          notebook de 720px de alto o con zoom del navegador. */}
      <div className="flex h-[26rem] flex-col overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-2xl shadow-ink/10 lg:h-[clamp(22rem,calc(100svh-11rem),30rem)]">
        <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-brand text-[11px] font-medium text-white">
            IA
          </span>
          <div className="leading-tight">
            <p className="text-xs font-medium text-ink">Tu asistente de IA</p>
            <p className="text-[10px] text-ink-soft">conectado a motorflow</p>
          </div>
        </div>

        {HERO_VIDEO_SRC ? (
          <video
            src={HERO_VIDEO_SRC}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            aria-label="Video: cargando un auto en motorflow desde Claude"
          />
        ) : (
          <DemoConversation />
        )}
      </div>
    </div>
  );
}
