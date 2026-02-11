import { insertAuditEvent } from "@/server/repos/audit-event-repo";

export async function recordAuditEvent(args: {
  actorUserId?: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
  metadata?: unknown;
}) {
  try {
    await insertAuditEvent(args);
  } catch (err) {
    console.error("Failed to record audit event", err);
  }
}
