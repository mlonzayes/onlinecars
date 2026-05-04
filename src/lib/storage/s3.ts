import type { StorageProvider } from "./types";

// Stub — implementar cuando se conecte el bucket R2/S3.
// Las deps `@aws-sdk/client-s3` y `@aws-sdk/s3-request-presigner` ya están instaladas.
// Para activarlo: setear STORAGE_DRIVER=s3 + las S3_* env vars.
const NOT_IMPLEMENTED =
  "Storage S3 no implementado. Definí STORAGE_DRIVER=local o implementá src/lib/storage/s3.ts";

export const s3Storage: StorageProvider = {
  async upload() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async uploadDocument() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async delete() {
    throw new Error(NOT_IMPLEMENTED);
  },
};
