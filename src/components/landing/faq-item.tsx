"use client";

import { useState } from "react";
import { PiCaretDown } from "react-icons/pi";

export interface FaqItemProps {
  question: string;
  answer: React.ReactNode;
  /** Si arranca abierto. Default: false */
  defaultOpen?: boolean;
}

export function FaqItem({ question, answer, defaultOpen = false }: FaqItemProps) {
  const [open, setOpen] = useState(defaultOpen);

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
        {/* Rotación con CSS (antes GSAP): el easing con rebote sale del
            cubic-bezier, y motion-reduce la vuelve instantánea. */}
        <span
          className={`inline-flex shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none ${
            open ? "rotate-180" : "rotate-0"
          }`}
        >
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
