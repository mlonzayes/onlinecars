/**
 * Token store — abstracción sobre la DB para leer y escribir tokens ML.
 *
 * NUNCA expone los tokens en texto plano fuera de este módulo.
 * Todos los access/refresh tokens se encriptan antes de persistirse.
 */
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "./crypto";
import type { MLTokenResponse } from "./types";

export interface StoredTokens {
  accessToken: string;   // en texto plano (ya desencriptado)
  refreshToken: string;  // en texto plano (ya desencriptado)
  expiresAt: Date;
}

/**
 * Persiste los tokens de ML para un concesionario.
 * Si ya existe un registro, lo actualiza (upsert).
 */
export async function saveTokens(
  dealershipId: string,
  tokenResponse: MLTokenResponse,
  nickname: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

  await prisma.mercadoLibreAccount.upsert({
    where: { dealershipId },
    create: {
      dealershipId,
      mlUserId: String(tokenResponse.user_id),
      nickname,
      accessToken: encrypt(tokenResponse.access_token),
      refreshToken: encrypt(tokenResponse.refresh_token),
      expiresAt,
    },
    update: {
      mlUserId: String(tokenResponse.user_id),
      nickname,
      accessToken: encrypt(tokenResponse.access_token),
      refreshToken: encrypt(tokenResponse.refresh_token),
      expiresAt,
    },
  });
}

/**
 * Devuelve los tokens en texto plano si la cuenta existe.
 * NO verifica expiración — eso lo hace el client.ts.
 */
export async function getTokens(dealershipId: string): Promise<StoredTokens | null> {
  const account = await prisma.mercadoLibreAccount.findUnique({
    where: { dealershipId },
    select: {
      accessToken: true,
      refreshToken: true,
      expiresAt: true,
    },
  });

  if (!account) return null;

  return {
    accessToken: decrypt(account.accessToken),
    refreshToken: decrypt(account.refreshToken),
    expiresAt: account.expiresAt,
  };
}

/**
 * Actualiza solo los tokens (post-refresh).
 */
export async function updateTokens(
  dealershipId: string,
  tokenResponse: MLTokenResponse
): Promise<void> {
  const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

  await prisma.mercadoLibreAccount.update({
    where: { dealershipId },
    data: {
      accessToken: encrypt(tokenResponse.access_token),
      refreshToken: encrypt(tokenResponse.refresh_token),
      expiresAt,
    },
  });
}

/**
 * Borra la cuenta ML y todos sus listings asociados (cascade en DB).
 */
export async function deleteAccount(dealershipId: string): Promise<void> {
  await prisma.mercadoLibreAccount.delete({
    where: { dealershipId },
  });
}

/**
 * Verifica si el concesionario tiene cuenta ML conectada.
 */
export async function getAccountInfo(dealershipId: string) {
  return prisma.mercadoLibreAccount.findUnique({
    where: { dealershipId },
    select: {
      id: true,
      mlUserId: true,
      nickname: true,
      expiresAt: true,
      createdAt: true,
    },
  });
}
