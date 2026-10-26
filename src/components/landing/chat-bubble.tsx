import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  from: "user" | "ai";
  children: React.ReactNode;
  /** Delay de entrada en segundos (animación `.chat-in` de globals.css). */
  delay?: number;
  className?: string;
}

/**
 * Burbuja de chat neutra. NO imita la UI de ChatGPT ni de Claude a propósito:
 * el mensaje de la página es "la IA que uses", y copiar la interfaz de una
 * marca ajena sería engañoso además de atarnos a una sola.
 */
export function ChatBubble({ from, children, delay, className }: ChatBubbleProps) {
  const isUser = from === "user";

  return (
    <div
      className={cn(
        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug",
        delay !== undefined && "chat-in",
        isUser
          ? "ml-auto rounded-br-sm bg-brand text-white"
          : "mr-auto rounded-bl-sm border border-ink/10 bg-paper text-ink",
        className
      )}
      style={delay !== undefined ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
