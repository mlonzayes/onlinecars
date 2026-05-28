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
