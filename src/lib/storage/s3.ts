import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  StorageProvider,
  StorageBucket,
  UploadResult,
  CreateUploadUrlResult,
  ObjectProbe,
} from "./types";

// Driver S3-compatible (Cloudflare R2). Maneja DOS buckets:
//   - S3_PUBLIC_BUCKET: imágenes del catálogo. Servido vía custom domain (S3_PUBLIC_URL).
//   - S3_PRIVATE_BUCKET: documentos del legajo de venta. Solo accesible por presigned URL.
//
// Para R2: region "auto", forcePathStyle true, endpoint = https://<account>.r2.cloudflarestorage.com

const DEFAULT_DOCUMENT_TTL_SECONDS = 300; // 5 min

// Ventana de la firma de subida directa. 10 min cubre 20MB desde una conexión
// hogareña lenta con margen de sobra.
const DEFAULT_UPLOAD_TTL_SECONDS = 600;

interface S3Env {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBucket: string;
  publicUrl: string;
  privateBucket: string;
}

let cachedEnv: S3Env | null = null;
let cachedClient: S3Client | null = null;

function readEnv(): S3Env {
  if (cachedEnv) return cachedEnv;

  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "auto";
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const publicBucket = process.env.S3_PUBLIC_BUCKET;
  const publicUrl = process.env.S3_PUBLIC_URL;
  const privateBucket = process.env.S3_PRIVATE_BUCKET;

  const missing: string[] = [];
  if (!endpoint) missing.push("S3_ENDPOINT");
  if (!accessKeyId) missing.push("S3_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("S3_SECRET_ACCESS_KEY");
  if (!publicBucket) missing.push("S3_PUBLIC_BUCKET");
  if (!publicUrl) missing.push("S3_PUBLIC_URL");
  if (!privateBucket) missing.push("S3_PRIVATE_BUCKET");

  if (missing.length > 0) {
    throw new Error(
      `Faltan env vars para STORAGE_DRIVER=s3: ${missing.join(", ")}`
    );
  }

  // Red de seguridad: el bucket de documentos (privado) y el de imágenes (público)
  // DEBEN ser distintos. Si fueran el mismo, los documentos del legajo (DNI,
  // facturas) terminarían en un bucket público. Fallar acá es preferible a filtrar
  // datos personales en silencio.
  if (publicBucket === privateBucket) {
    throw new Error(
      "S3_PUBLIC_BUCKET y S3_PRIVATE_BUCKET no pueden ser el mismo bucket: " +
        "los documentos del legajo quedarían en el bucket público."
    );
  }

  cachedEnv = {
    endpoint: endpoint!,
    region,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    publicBucket: publicBucket!,
    // Normalizamos: sin trailing slash, así concatenar con el key es consistente.
    publicUrl: publicUrl!.replace(/\/+$/, ""),
    privateBucket: privateBucket!,
  };
  return cachedEnv;
}

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  const env = readEnv();
  cachedClient = new S3Client({
    region: env.region,
    endpoint: env.endpoint,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
    forcePathStyle: true,
    // AWS SDK v3 (>=3.700) agrega un x-amz-sdk-checksum-algorithm a todos los
    // PutObject por default. Providers S3-compatible (Contabo, Backblaze B2,
    // MinIO viejo) no lo entienden y responden con error en JSON en lugar de
    // XML, lo cual rompe el deserializer del SDK ("char '{' is not expected").
    // WHEN_REQUIRED le dice al SDK que solo calcule checksums cuando la
    // operación los exige obligatoriamente — para PutObject no es obligatorio.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return cachedClient;
}

function bucketFor(bucket: StorageBucket): string {
  const env = readEnv();
  return bucket === "public" ? env.publicBucket : env.privateBucket;
}

// Content-Disposition para forzar descarga (no render inline) de un documento.
// Si hay nombre, lo usa (con fallback RFC 5987 para acentos/no-ASCII).
function contentDisposition(filename?: string): string {
  if (!filename) return "attachment";
  const ascii = filename.replace(/["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

function joinKey(keyPrefix: string, filename: string): string {
  return `${keyPrefix.replace(/^\/+|\/+$/g, "")}/${filename}`;
}

async function putObject(
  bucket: string,
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
}

export const s3Storage: StorageProvider = {
  async upload({ buffer, mimeType, keyPrefix, filename }): Promise<UploadResult> {
    const env = readEnv();
    const key = joinKey(keyPrefix, filename);
    await putObject(env.publicBucket, key, buffer, mimeType);
    return { url: `${env.publicUrl}/${key}`, key };
  },

  async uploadDocument({ buffer, mimeType, keyPrefix, filename }): Promise<UploadResult> {
    const env = readEnv();
    const key = joinKey(keyPrefix, filename);
    await putObject(env.privateBucket, key, buffer, mimeType);
    // url queda con un identificador interno — el front pide la URL firmada
    // a /api/ventas/[id]/documentos/[docId]/url. No se sirve directo nunca.
    return { url: `s3://${env.privateBucket}/${key}`, key };
  },

  async createUploadUrl({
    keyPrefix,
    filename,
    mimeType,
    ttlSeconds = DEFAULT_UPLOAD_TTL_SECONDS,
  }): Promise<CreateUploadUrlResult> {
    const env = readEnv();
    const key = joinKey(keyPrefix, filename);

    // Firmamos SOLO con ContentType. Tentador era firmar también ContentLength
    // para clavar el tamaño exacto, pero eso lo convierte en header firmado y
    // varios providers S3-compatible (incluido Contabo) se ponen quisquillosos.
    // El tamaño se verifica después con probeObject, que además chequea el
    // magic-number — y si algo no cierra, borramos el objeto. El resultado es
    // equivalente y funciona en cualquier provider.
    const command = new PutObjectCommand({
      Bucket: env.publicBucket,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(getClient(), command, {
      expiresIn: ttlSeconds,
    });

    return { uploadUrl, key, publicUrl: `${env.publicUrl}/${key}` };
  },

  async probeObject(key, headBytes): Promise<ObjectProbe | null> {
    const env = readEnv();
    try {
      // Un GET con Range trae los primeros bytes Y el tamaño total en el header
      // ContentRange ("bytes 0-15/12345678") — una sola llamada para las dos
      // cosas, sin bajar el archivo entero.
      const response = await getClient().send(
        new GetObjectCommand({
          Bucket: env.publicBucket,
          Key: key,
          Range: `bytes=0-${headBytes - 1}`,
        })
      );

      if (!response.Body) return null;
      const head = Buffer.from(await response.Body.transformToByteArray());

      // ContentRange: "bytes 0-15/12345678" → el total va después de la barra.
      const total = response.ContentRange?.split("/")[1];
      const sizeBytes =
        total && total !== "*" ? Number(total) : (response.ContentLength ?? head.length);

      return { sizeBytes, head };
    } catch {
      // Objeto inexistente o inaccesible. El caller lo trata como "no llegó".
      return null;
    }
  },

  publicUrlFor(key) {
    return `${readEnv().publicUrl}/${key}`;
  },

  async delete(key, bucket) {
    const targetBucket = bucketFor(bucket);
    await getClient().send(
      new DeleteObjectCommand({ Bucket: targetBucket, Key: key })
    );
  },

  async getDocumentUrl(key, ttlSeconds = DEFAULT_DOCUMENT_TTL_SECONDS, downloadFilename) {
    const env = readEnv();
    const command = new GetObjectCommand({
      Bucket: env.privateBucket,
      Key: key,
      // Fuerza descarga en vez de render inline en el browser (evita preview/caché).
      ResponseContentDisposition: contentDisposition(downloadFilename),
    });
    return getSignedUrl(getClient(), command, { expiresIn: ttlSeconds });
  },
};
