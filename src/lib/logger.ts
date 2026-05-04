type LogLevel = "debug" | "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  requestId?: string;
  message: string;
  [key: string]: unknown;
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

// Formato: YYYYMMDDHHmmssSSS_xxxxxxxx (UTC + sufijo random hex de 8 chars).
// El sufijo evita colisiones cuando entran múltiples requests en el mismo ms.
export function generateRequestId(): string {
  const now = new Date();
  const ts =
    `${now.getUTCFullYear()}` +
    `${pad(now.getUTCMonth() + 1)}` +
    `${pad(now.getUTCDate())}` +
    `${pad(now.getUTCHours())}` +
    `${pad(now.getUTCMinutes())}` +
    `${pad(now.getUTCSeconds())}` +
    `${pad(now.getUTCMilliseconds(), 3)}`;
  const suffix = globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `${ts}_${suffix}`;
}

function emit(entry: LogEntry): void {
  const payload = JSON.stringify(entry);
  if (entry.level === "error" || entry.level === "warn") {
    console.error(payload);
  } else {
    console.log(payload);
  }
}

function buildEntry(
  level: LogLevel,
  requestId: string | undefined,
  message: string,
  meta?: LogMeta
): LogEntry {
  return {
    level,
    timestamp: new Date().toISOString(),
    requestId,
    message,
    ...meta,
  };
}

export const logger = {
  debug: (requestId: string | undefined, message: string, meta?: LogMeta) =>
    emit(buildEntry("debug", requestId, message, meta)),
  info: (requestId: string | undefined, message: string, meta?: LogMeta) =>
    emit(buildEntry("info", requestId, message, meta)),
  warn: (requestId: string | undefined, message: string, meta?: LogMeta) =>
    emit(buildEntry("warn", requestId, message, meta)),
  error: (requestId: string | undefined, message: string, meta?: LogMeta) =>
    emit(buildEntry("error", requestId, message, meta)),
};
