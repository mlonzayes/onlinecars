"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { PiCaretDown } from "react-icons/pi";

export interface FaqItemProps {
  question: string;
  answer: React.ReactNode;
  /** Si arranca abierto. Default: false */
  defaultOpen?: boolean;
}

export function FaqItem({ question, answer, defaultOpen = false }: FaqItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  // react-icons no acepta ref nativo en sus componentes (tipo IconBaseProps
  // no declara ref). Animamos el <span> wrapper que contiene el SVG.
  const caretRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const caret = caretRef.current;
    if (!caret) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(caret, { rotate: open ? 180 : 0 });
      return;
    }

    gsap.to(caret, {
      rotate: open ? 180 : 0,
      duration: 0.5,
      ease: open ? "back.out(1.8)" : "back.in(1.4)",
    });
  }, [open]);

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-white transition-colors ${
        open
          ? "border-blue-200 shadow-sm shadow-blue-100/50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50/80"
      >
        <span className="text-sm font-semibold text-gray-900 sm:text-base">{question}</span>
        <span ref={caretRef} className="inline-flex shrink-0">
          <PiCaretDown
            className={`h-4 w-4 ${open ? "text-blue-600" : "text-gray-400"}`}
          />
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-0 text-xs leading-relaxed text-gray-600 sm:text-sm">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
}
