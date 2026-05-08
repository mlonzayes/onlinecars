"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FaqItemProps {
  question: string;
  answer: React.ReactNode;
  /** Si arranca abierto. Default: false */
  defaultOpen?: boolean;
}

export function FaqItem({ question, answer, defaultOpen = false }: FaqItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
      >
        <span className="text-sm font-semibold text-gray-900 sm:text-base">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ease-out ${
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
