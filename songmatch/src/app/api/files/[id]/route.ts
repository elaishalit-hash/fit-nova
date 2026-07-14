import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMimeType, isInline, readStoredFile } from "@/lib/storage";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const buffer = await readStoredFile(id);
    const disposition = isInline(id) ? "inline" : "attachment";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": getMimeType(id),
        "Content-Disposition": `${disposition}; filename="${id}"`,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
