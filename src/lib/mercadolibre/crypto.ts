/**
 * Encriptación AES-256-GCM para tokens de ML.
 *
 * Usa Node.js `crypto` nativo — sin dependencias externas.
 * La clave de encriptación viene de ML_TOKEN_SECRET (32 bytes en hex, 64 chars).
 *
 * Formato del cifrado: base64(iv:authTag:ciphertext) — los tres separados por ":".
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // 96 bits — recomendado para GCM

function getKey(): Buffer {
  const secret = process.env.ML_TOKEN_SECRET;
  if (!secret) {
    throw new Error("ML_TOKEN_SECRET no está definida en las variables de entorno.");
  }
  if (secret.length !== 64) {
    throw new Error(
      "ML_TOKEN_SECRET debe ser exactamente 64 caracteres hex (32 bytes). " +
      "Generá una con: openssl rand -hex 32"
    );
  }
  return Buffer.from(secret, "hex");
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // formato: iv:authTag:ciphertext (todo en base64)
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Formato de token encriptado inválido.");
  }

  const iv = Buffer.from(parts[0], "base64");
  const authTag = Buffer.from(parts[1], "base64");
  const encrypted = Buffer.from(parts[2], "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}
