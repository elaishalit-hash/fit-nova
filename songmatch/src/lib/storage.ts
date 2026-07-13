import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  aac: "audio/aac",
  flac: "audio/flac",
  pdf: "application/pdf",
  txt: "text/plain",
};

// Media types (image/audio) render inline in <img>/<audio> tags; everything
// else downloads as an attachment.
const INLINE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "mp3",
  "wav",
  "m4a",
  "ogg",
  "aac",
  "flac",
]);

export class UploadValidationError extends Error {}

function extensionOf(fileName: string) {
  return (fileName.split(".").pop() ?? "").toLowerCase();
}

export function getMimeType(fileName: string) {
  return MIME_TYPES[extensionOf(fileName)] ?? "application/octet-stream";
}

export function isInline(fileName: string) {
  return INLINE_EXTENSIONS.has(extensionOf(fileName));
}

export async function saveFile(
  buffer: Buffer,
  originalFileName: string,
  options?: { allowedExtensions?: string[] }
) {
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError("File is too large (max 25MB).");
  }
  const ext = extensionOf(originalFileName);
  if (options?.allowedExtensions && !options.allowedExtensions.includes(ext)) {
    throw new UploadValidationError(
      `Unsupported file type ".${ext || "?"}". Allowed: ${options.allowedExtensions.join(", ")}.`
    );
  }

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
