import { IntegrationProvider } from "@prisma/client";
import { db } from "@/lib/db";

export async function getUserIntegrationSecret(userId: string, provider: IntegrationProvider) {
  return db.userIntegrationSecret.findUnique({
    where: {
      userId_provider: {
        userId,
        provider
      }
    }
  });
}

export async function upsertUserIntegrationSecret(args: {
  userId: string;
  provider: IntegrationProvider;
  encryptedApiKey: string | null;
}) {
  return db.userIntegrationSecret.upsert({
    where: {
      userId_provider: {
        userId: args.userId,
        provider: args.provider
      }
    },
    create: {
      userId: args.userId,
      provider: args.provider,
      encryptedApiKey: args.encryptedApiKey,
      isEnabled: !!args.encryptedApiKey
    },
    update: {
      encryptedApiKey: args.encryptedApiKey,
      isEnabled: !!args.encryptedApiKey
    }
  });
}
