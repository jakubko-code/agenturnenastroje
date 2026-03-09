import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { downloadImageFromDrive } from "@/lib/google-drive";

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const user = await requireSessionUser();

    const { path: segments } = await params;
    const normalized = segments.join("/");

    // ── Google Drive file ──────────────────────────────────────────────────────
    if (normalized.startsWith("drive:")) {
      const fileId = normalized.slice("drive:".length);
      if (!fileId) return new NextResponse("Not found", { status: 404 });

      const imageBuffer = await downloadImageFromDrive(user.id, fileId);
      return new NextResponse(new Uint8Array(imageBuffer), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "private, max-age=3600"
        }
      });
    }

    // ── Legacy: local file (backward compat) ───────────────────────────────────
    const safePath = normalized.replace(/\.\./g, "");
    if (!safePath || safePath.includes("..")) {
      return new NextResponse("Not found", { status: 404 });
    }

    const filePath = path.join(process.cwd(), "uploads", "ad-creative", safePath);
    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(filePath);
    } catch {
      return new NextResponse("Not found", { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chyba servera.";
    if (message === "UNAUTHORIZED") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Server error", { status: 500 });
  }
}
