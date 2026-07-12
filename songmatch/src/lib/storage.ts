import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function saveFile(buffer: Buffer, originalFileName: string) {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const safeOriginal = originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${randomUUID()}-${safeOriginal}`;
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer);
  return { storedName, url: `/api/files/${storedName}` };
}

export async function readStoredFile(storedName: string) {
  const safeName = path.basename(storedName);
  return readFile(path.join(UPLOAD_DIR, safeName));
}
