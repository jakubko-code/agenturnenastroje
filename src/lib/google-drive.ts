import { db } from "@/lib/db";

// ─── Token management ─────────────────────────────────────────────────────────

async function getValidAccessToken(userId: string): Promise<string> {
  const account = await db.account.findFirst({
    where: { userId, provider: "google" }
  });

  if (!account?.access_token) {
    throw new Error("Google Drive: žiadny token. Odhláste sa a prihláste znova.");
  }

  // If token is still valid (with 60s buffer), return it
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (account.expires_at && account.expires_at > nowSeconds + 60) {
    return account.access_token;
  }

  // Refresh the token
  if (!account.refresh_token) {
    throw new Error("Google Drive: chýba refresh token. Odhláste sa a prihláste znova.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID ?? "",
      client_secret: process.env.AUTH_GOOGLE_SECRET ?? "",
      refresh_token: account.refresh_token,
      grant_type: "refresh_token"
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Google token refresh zlyhal: ${data.error_description ?? data.error}`);
  }

  // Persist refreshed token
  await db.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      expires_at: nowSeconds + Number(data.expires_in ?? 3600)
    }
  });

  return data.access_token as string;
}

// ─── Folder helpers ───────────────────────────────────────────────────────────

async function findOrCreateFolder(accessToken: string, folderName: string, parentId?: string): Promise<string> {
  const query = [
    `name = '${folderName}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    parentId ? `'${parentId}' in parents` : "'root' in parents"
  ].join(" and ");

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)&spaces=drive`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const searchData = await searchRes.json();
  if (searchData.files?.length > 0) return searchData.files[0].id as string;

  // Create folder
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : ["root"]
    })
  });
  const folder = await createRes.json();
  return folder.id as string;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadImageToDrive(
  userId: string,
  imageBuffer: Buffer,
  filename: string,
  clientName: string
): Promise<string> {
  const accessToken = await getValidAccessToken(userId);

  // Create folder structure: AI Kreatívy / ClientName
  const rootFolderId = await findOrCreateFolder(accessToken, "AI Kreatívy");
  const clientFolderId = await findOrCreateFolder(accessToken, clientName, rootFolderId);

  // Multipart upload: metadata + binary
  const metadata = JSON.stringify({ name: filename, parents: [clientFolderId] });
  const boundary = "ai_kreativy_boundary";

  const bodyParts = [
    `--${boundary}\r\n`,
    `Content-Type: application/json; charset=UTF-8\r\n\r\n`,
    `${metadata}\r\n`,
    `--${boundary}\r\n`,
    `Content-Type: image/png\r\n\r\n`
  ];

  const headerBytes = Buffer.from(bodyParts.join(""), "utf-8");
  const footerBytes = Buffer.from(`\r\n--${boundary}--`, "utf-8");
  const body = Buffer.concat([headerBytes, imageBuffer, footerBytes]);

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(body.length)
      },
      body
    }
  );

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || !uploadData.id) {
    throw new Error(`Google Drive upload zlyhal: ${JSON.stringify(uploadData)}`);
  }

  return uploadData.id as string;
}

// ─── Download (proxy) ─────────────────────────────────────────────────────────

export async function downloadImageFromDrive(userId: string, fileId: string): Promise<Buffer> {
  const accessToken = await getValidAccessToken(userId);

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    throw new Error(`Google Drive stiahnutie zlyhalo (${res.status}).`);
  }

  return Buffer.from(await res.arrayBuffer());
}
