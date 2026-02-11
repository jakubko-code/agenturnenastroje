import { Provider, SettingScope } from "@prisma/client";
import { db } from "@/lib/db";

export async function upsertProviderSetting(args: {
  scope: SettingScope;
  userId: string | null;
  provider: Provider;
  encryptedApiKey: string | null;
  actorUserId: string;
}) {
  // Prisma compound upsert does not handle nullable unique parts well for agency scope.
  // For agency-level settings we do explicit find + update/create.
  if (args.scope === "agency") {
    const existing = await db.providerSetting.findFirst({
      where: { scope: "agency", provider: args.provider }
    });

    if (existing) {
      return db.providerSetting.update({
        where: { id: existing.id },
        data: {
          encryptedApiKey: args.encryptedApiKey,
          isEnabled: !!args.encryptedApiKey
        }
      });
    }

    return db.providerSetting.create({
      data: {
        scope: "agency",
        userId: null,
        provider: args.provider,
        encryptedApiKey: args.encryptedApiKey,
        createdById: args.actorUserId,
        isEnabled: !!args.encryptedApiKey
      }
    });
  }

  if (!args.userId) {
    throw new Error("userId is required for user-scoped provider settings.");
  }

  return db.providerSetting.upsert({
    where: {
      scope_userId_provider: {
        scope: args.scope,
        userId: args.userId,
        provider: args.provider
      }
    },
    create: {
      scope: args.scope,
      userId: args.userId,
      provider: args.provider,
      encryptedApiKey: args.encryptedApiKey,
      createdById: args.actorUserId,
      isEnabled: !!args.encryptedApiKey
    },
    update: {
      encryptedApiKey: args.encryptedApiKey,
      isEnabled: !!args.encryptedApiKey
    }
  });
}

export async function listProviderSettingsForUser(userId: string) {
  const [agency, personal] = await Promise.all([
    db.providerSetting.findMany({ where: { scope: "agency" } }),
    db.providerSetting.findMany({ where: { scope: "user", userId } })
  ]);

  return { agency, personal };
}
