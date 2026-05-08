import type { LucideIcon } from "lucide-react";

export interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  comingSoon?: boolean;
  highlighted?: boolean;
}

export function ServiceCard({
  icon: Icon,
  title,
  description,
  comingSoon,
  highlighted,
}: ServiceCardProps) {
  return (
    <div
      className={`relative flex flex-col gap-2.5 rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm sm:p-5 ${
        highlighted
          ? "border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm"
          : "border-gray-200 bg-white"
      }`}
    >
      {comingSoon && (
        <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
          Próximamente
        </span>
      )}
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          highlighted ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      <p className="text-xs leading-relaxed text-gray-500 sm:text-sm">{description}</p>
    </div>
  );
}
