import { Provider, SettingScope } from "@prisma/client";
import { decrypt, encrypt } from "@/lib/security/encrypt";
import { listProviderSettingsForUser, upsertProviderSetting } from "@/server/repos/provider-settings-repo";

type ProviderFlags = { openai: boolean; gemini: boolean; claude: boolean };

function normalizeApiKey(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.toLowerCase() === "null" || normalized.toLowerCase() === "undefined") {
    return null;
  }
  return normalized;
}

export async function getProviderStatusForUser(userId: string): Promise<ProviderFlags> {
  const { agency, personal } = await listProviderSettingsForUser(userId);

  const providerStatus: ProviderFlags = { openai: false, gemini: false, claude: false };

  for (const provider of ["openai", "gemini", "claude"] as Provider[]) {
    const personalMatch = personal.find((item) => item.provider === provider && item.isEnabled && item.encryptedApiKey);
    const agencyMatch = agency.find((item) => item.provider === provider && item.isEnabled && item.encryptedApiKey);
    const envKey = normalizeApiKey(process.env[`${provider.toUpperCase()}_API_KEY`]);
    providerStatus[provider] = !!(personalMatch || agencyMatch || envKey);
  }

  return providerStatus;
}

export async function saveAgencyProviderKeys(
  actorUserId: string,
  payload: { openaiApiKey?: string; geminiApiKey?: string; claudeApiKey?: string }
): Promise<void> {
  const updates: Array<{ provider: Provider; value?: string }> = [
    { provider: "openai", value: payload.openaiApiKey },
    { provider: "gemini", value: payload.geminiApiKey },
    { provider: "claude", value: payload.claudeApiKey }
  ];

  for (const update of updates) {
    if (typeof update.value === "undefined") continue;

    const normalized = normalizeApiKey(update.value);
    await upsertProviderSetting({
      scope: SettingScope.agency,
      userId: null,
      provider: update.provider,
      encryptedApiKey: normalized ? encrypt(normalized) : null,
      actorUserId
    });
  }
}

export async function resolveProviderApiKeyForUser(userId: string, provider: Provider): Promise<string> {
  const { agency, personal } = await listProviderSettingsForUser(userId);

  const personalMatch = personal.find((item) => item.provider === provider && item.isEnabled && item.encryptedApiKey);
  if (personalMatch?.encryptedApiKey) return decrypt(personalMatch.encryptedApiKey);

  const agencyMatch = agency.find((item) => item.provider === provider && item.isEnabled && item.encryptedApiKey);
  if (agencyMatch?.encryptedApiKey) return decrypt(agencyMatch.encryptedApiKey);

  const fallback = normalizeApiKey(process.env[`${provider.toUpperCase()}_API_KEY`]);
  if (fallback) return fallback;

  throw new Error(`${provider} API key is not configured.`);
}
