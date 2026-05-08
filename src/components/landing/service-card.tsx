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
      className={`relative flex flex-col gap-3 rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-md ${
        highlighted
          ? "border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm"
          : "border-gray-200 bg-white"
      }`}
    >
      {comingSoon && (
        <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
          Próximamente
        </span>
      )}
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          highlighted ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-500">{description}</p>
    </div>
  );
}
