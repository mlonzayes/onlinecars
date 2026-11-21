import { ChatAutoScroll } from "./chat-auto-scroll";
import { ChatBubble } from "./chat-bubble";
import { IphoneFrame } from "./iphone-frame";
import { PublishedCarCard } from "./published-car-card";

/**
 * Video real de Mateo cargando un auto desde el Asistente IA del panel. Cuando exista, dejarlo en
 * `public/video/` (vertical, mp4 H.264, sin audio, < 3 MB) y poner la ruta acá:
 * reemplaza la conversación de ejemplo. El video real es mejor prueba que
 * cualquier recreación, y es lo mismo que va a mostrar el anuncio de Meta.
 */
const HERO_VIDEO_SRC: string | null = null;

// La conversación sigue el comportamiento real del Asistente del panel: toda
// carga se confirma con un click (tarjeta fuera del modelo), el auto entra como
// borrador y se publica solo cuando el dealer lo pide.
function DemoConversation() {
  return (
    // Máscara arriba: los mensajes viejos se desvanecen al subir, como en un chat.
    <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden px-3 pb-6 [mask-image:linear-gradient(to_bottom,transparent,black_1.5rem)]">
      <ChatAutoScroll>
        <ChatBubble from="user" delay={0.3}>
          cargame un Corolla XEI 2019, 68.000 km, azul, a 18.500.000
        </ChatBubble>
        <span
          className="chat-in mr-auto rounded-md border border-dashed border-ink/25 px-2 py-0.5 text-[10px] text-ink-soft"
          style={{ animationDelay: "1s" }}
        >
          ✓ Confirmaste · Cargar vehículo
        </span>
        <ChatBubble from="ai" delay={1.5}>
          Listo, el Toyota Corolla XEI 2019 quedó como borrador. ¿Lo publico en tu web?
        </ChatBubble>
        <ChatBubble from="user" delay={2.4}>
          dale
        </ChatBubble>
        <ChatBubble from="ai" delay={3}>
          Publicado. Ya aparece en tu catálogo.
        </ChatBubble>
        <PublishedCarCard />
      </ChatAutoScroll>
    </div>
  );
}

export function HeroChatDemo() {
  return (
    <div className="hero-phone relative mx-auto w-fit lg:mr-0">
      {/* Tamaño según el alto de la pantalla: ver `.iphone-zoom` en globals.css.
          `phone-rise`: entra desde abajo al cargar. */}
      <IphoneFrame className="phone-rise iphone-zoom">
        <div className="flex items-center gap-2 border-b border-ink/10 px-4 pb-2.5">
          <span className="flex size-7 items-center justify-center rounded-full bg-brand text-[11px] font-medium text-white">
            IA
          </span>
          <p className="text-xs font-medium text-ink">Asistente</p>
        </div>

        {HERO_VIDEO_SRC ? (
          <video
            src={HERO_VIDEO_SRC}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            aria-label="Video: cargando un auto con el asistente de motorflow"
          />
        ) : (
          <DemoConversation />
        )}
      </IphoneFrame>
    </div>
  );
}
