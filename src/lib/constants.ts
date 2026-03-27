export const FUEL_TYPES = ["nafta", "diesel", "gnc", "electrico", "hibrido"] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const TRANSMISSION_TYPES = ["manual", "automatica"] as const;
export type TransmissionType = (typeof TRANSMISSION_TYPES)[number];

export const VEHICLE_CONDITIONS = ["new", "used"] as const;
export type VehicleCondition = (typeof VEHICLE_CONDITIONS)[number];

export const VEHICLE_STATUSES = ["available", "reserved", "sold"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const LEAD_STATUSES = ["new", "contacted", "qualified", "closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = ["web", "whatsapp", "mercadolibre"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const CURRENCIES = ["ARS", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const USER_ROLES = ["admin", "editor", "viewer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MAX_IMAGES_PER_VEHICLE = 15;
export const VEHICLES_PER_PAGE = 12;
export const CACHE_TTL_VEHICLES = 300; // 5 minutos
export const CACHE_TTL_DEALERSHIP = 300; // 5 minutos
