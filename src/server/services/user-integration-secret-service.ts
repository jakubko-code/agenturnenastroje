import { decrypt, encrypt } from "@/lib/security/encrypt";
import { getUserIntegrationSecret, upsertUserIntegrationSecret } from "@/server/repos/user-integration-secret-repo";

function normalizeApiKey(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.toLowerCase() === "null" || normalized.toLowerCase() === "undefined") {
    return null;
  }
  return normalized;
}

export async function getApifyStatusForUser(userId: string): Promise<{ apify: boolean }> {
  const existing = await getUserIntegrationSecret(userId, "apify");
  return { apify: !!(existing?.isEnabled && existing.encryptedApiKey) };
}

export async function saveApifyKeyForUser(userId: string, apifyApiKey: string): Promise<void> {
  const normalized = normalizeApiKey(apifyApiKey);
  await upsertUserIntegrationSecret({
    userId,
    provider: "apify",
    encryptedApiKey: normalized ? encrypt(normalized) : null
  });
}

export async function resolveApifyTokenForUser(userId: string): Promise<string> {
  const existing = await getUserIntegrationSecret(userId, "apify");
  if (existing?.isEnabled && existing.encryptedApiKey) {
    return decrypt(existing.encryptedApiKey);
  }

  const fallback = normalizeApiKey(process.env.APIFY_TOKEN);
  if (fallback) {
    return fallback;
  }

  throw new Error("APIFY token is not configured.");
}
