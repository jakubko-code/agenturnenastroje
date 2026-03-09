import { db } from "@/lib/db";

export async function listActiveClients() {
  return db.creativeClient.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  });
}

export async function getClientById(id: string) {
  return db.creativeClient.findFirst({ where: { id, isActive: true } });
}

export async function createClient(data: {
  name: string;
  industry: string;
  defaultStyle: string;
  defaultLighting: string;
  defaultColorGrading: string;
  defaultAspectRatio: string;
  brandNotes?: string;
  createdBy: string;
}) {
  return db.creativeClient.create({ data });
}

export async function updateClient(
  id: string,
  data: {
    name?: string;
    industry?: string;
    defaultStyle?: string;
    defaultLighting?: string;
    defaultColorGrading?: string;
    defaultAspectRatio?: string;
    brandNotes?: string;
  }
) {
  return db.creativeClient.update({ where: { id }, data });
}

export async function deactivateClient(id: string) {
  return db.creativeClient.update({ where: { id }, data: { isActive: false } });
}
