export type ApiResponse<T> = {
  data: T;
};

export type ApiListResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
};

export type ApiError = {
  error: string;
  details?: unknown;
};

export type DealershipTheme = {
  colorPrimary: string;
  darkMode: boolean;
  heroType: "none" | "image" | "video";
  heroUrl: string | null;
  selectedBrandIds?: string[];
};

// Links a redes sociales del concesionario. Cada uno es la URL completa al perfil.
// WhatsApp NO va acá — reusa el campo `whatsapp` del Dealership.
// Las keys deben coincidir con SOCIAL_NETWORKS en src/lib/constants.ts.
export type SocialLinks = {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  x?: string;
  threads?: string;
};
