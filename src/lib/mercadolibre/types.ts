// Tipos de la integración con Mercado Libre Argentina (MLAR)

// ─── OAuth2 ───────────────────────────────────────────────────────────────────

export interface MLTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // segundos
  refresh_token: string;
  user_id: number;
  scope: string;
}

export interface MLUserInfo {
  id: number;
  nickname: string;
  email?: string;
  seller_reputation?: {
    level_id?: string;
  };
}

// ─── Items (publicaciones) ────────────────────────────────────────────────────

export interface MLAttribute {
  id: string;
  value_name: string;
}

export interface MLPicture {
  source: string; // URL pública accesible por ML
}

// Location requerida por ML para vehículos. country + state + city son obligatorios.
export interface MLLocation {
  country: { name: string };
  state: { name: string };
  city: { name: string };
}

// Payload mínimo para crear una publicación de vehículo en ML
export interface MLCreateItemPayload {
  title: string;
  category_id: string;
  price: number;
  currency_id: "ARS" | "USD";
  available_quantity: number;
  buying_mode: "classified";
  listing_type_id: string; // ej: "silver"
  condition: "new" | "used";
  description?: {
    plain_text: string;
  };
  pictures?: MLPicture[];
  attributes: MLAttribute[];
  sale_terms?: { id: string; value_name: string }[];
  location?: MLLocation;
}

export interface MLItemResponse {
  id: string;
  title: string;
  // `payment_required` lo devuelve ML para clasificados que necesitan pago
  // antes de activarse (típicamente vehículos en MLA1744).
  status: "active" | "paused" | "closed" | "under_review" | "payment_required";
  permalink: string;
  category_id: string;
  price: number;
  currency_id: string;
  thumbnail?: string;
}

// Payload para actualizar status de una publicación
export interface MLUpdateStatusPayload {
  status: "active" | "paused" | "closed";
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────

export interface MLWebhookNotification {
  _id: string;
  resource: string;       // ej: "/questions/123456789"
  user_id: number;
  topic: string;          // ej: "questions"
  application_id: number;
  attempts: number;
  sent: string;           // ISO datetime
  received: string;
}

export interface MLQuestion {
  id: number;
  text: string;
  status: "unanswered" | "answered" | "closed_unanswered" | "under_review";
  date_created: string;
  item_id: string;
  seller_id: number;
  from: {
    id: number;
    answered_questions?: number;
  };
}

// ─── Internos ─────────────────────────────────────────────────────────────────

// Status de ML → status interno del listing
export const ML_LISTING_STATUS_MAP = {
  active: "active",
  paused: "paused",
  closed: "closed",
  under_review: "active", // tratamos como activo
} as const;

export type MLListingStatus = "active" | "paused" | "closed" | "error";
