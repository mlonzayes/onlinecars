import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider, StorageKind } from "./types";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Defensa contra path traversal — los keys son construidos por nosotros
// pero esto es defense-in-depth.
function assertSafeKey(key: string): void {
  if (key.includes("..") || key.includes("\0") || path.isAbsolute(key)) {
    throw new Error(`Storage key inválido: ${key}`);
  }
}

// Ambos métodos comparten implementación — el escritor en disco no tiene por qué
// distinguir entre imagen y documento. La separación es conceptual a nivel de la
// interface; las validaciones de tipo/tamaño viven en cada endpoint.
async function writeFileToUploads(
  buffer: Buffer,
  keyPrefix: string,
  filename: string
): Promise<{ url: string; key: string }> {
  assertSafeKey(keyPrefix);
  assertSafeKey(filename);

  const dirPath = path.join(UPLOADS_DIR, keyPrefix);
  await mkdir(dirPath, { recursive: true });

  const filePath = path.join(dirPath, filename);
  await writeFile(filePath, buffer);

  const key = `${keyPrefix}/${filename}`;
  return { url: `/uploads/${key}`, key };
}

export const localStorage: StorageProvider = {
  async upload({ buffer, keyPrefix, filename }) {
    return writeFileToUploads(buffer, keyPrefix, filename);
  },

  async uploadDocument({ buffer, keyPrefix, filename }) {
    return writeFileToUploads(buffer, keyPrefix, filename);
  },

  // El driver local guarda todo en un solo árbol — el kind se ignora.
  async delete(key, _kind: StorageKind) {
    assertSafeKey(key);

    const filePath = path.join(UPLOADS_DIR, key);
    try {
      await unlink(filePath);
    } catch (error: unknown) {
      // Idempotente — si el archivo ya no está, no es error.
      const code =
        error && typeof error === "object" && "code" in error
          ? (error as NodeJS.ErrnoException).code
          : undefined;
      if (code !== "ENOENT") throw error;
    }
  },

  // En local los documentos viven en /public/uploads y son servidos directo
  // por Next. El TTL no aplica.
  async getDocumentUrl(key) {
    assertSafeKey(key);
    return `/uploads/${key}`;
  },
};
