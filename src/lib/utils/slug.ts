import crypto from "crypto";

export function generateVehicleSlug(make: string, model: string, year: number): string {
  const sanitize = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const shortId = crypto.randomBytes(4).toString("hex").toLowerCase();

  return `${sanitize(make)}-${sanitize(model)}-${year}-${shortId}`;
}
