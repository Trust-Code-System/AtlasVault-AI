import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "documents";

function supabaseStorageEnabled() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase storage is not configured");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function saveWorkspaceFile(params: {
  workspaceId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const safeName = `${Date.now()}-${sanitizeFileName(params.fileName)}`;
  const storagePath = `${params.workspaceId}/${safeName}`;

  if (supabaseStorageEnabled()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(bucket).upload(storagePath, params.buffer, {
      contentType: params.mimeType || "application/octet-stream",
      upsert: false,
    });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    return `supabase://${bucket}/${storagePath}`;
  }

  const dir = path.join(process.cwd(), "uploads", params.workspaceId);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, safeName);
  await writeFile(filePath, params.buffer);

  return path.join("uploads", params.workspaceId, safeName);
}
