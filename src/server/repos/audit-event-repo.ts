import { db } from "@/lib/db";

export async function insertAuditEvent(args: {
  actorUserId?: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
  metadata?: unknown;
}) {
  return db.auditEvent.create({
    data: {
      actorUserId: args.actorUserId,
      eventType: args.eventType,
      entityType: args.entityType,
      entityId: args.entityId,
      metadata: args.metadata as object | undefined
    }
  });
}
