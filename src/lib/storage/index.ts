import { localStorage } from "./local";
import { s3Storage } from "./s3";
import type { StorageProvider } from "./types";

// Driver activo según env. Default: "local" (filesystem en /public/uploads).
// IMPORTANTE: en producción Vercel el driver "local" NO funciona — el filesystem
// es read-only en runtime. Antes de deploy hay que setear STORAGE_DRIVER=s3 e
// implementar el provider de S3/R2.
const driver = process.env.STORAGE_DRIVER ?? "local";

export const storage: StorageProvider = driver === "s3" ? s3Storage : localStorage;

export type { StorageProvider, UploadParams, UploadResult } from "./types";
