"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAcceptedCurrentTerms } from "@/lib/terms";
import { saveFile } from "@/lib/storage";

export type SubmissionFormState = { error?: string };

export async function createSubmissionAction(
  _prevState: SubmissionFormState | undefined,
  formData: FormData
): Promise<SubmissionFormState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "SONGWRITER") {
    return { error: "Only songwriters can create submissions." };
  }

  const accepted = await hasAcceptedCurrentTerms(session.user.id);
  if (!accepted) {
    return { error: "You must accept the current Terms & Conditions first." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const lyricsBody = String(formData.get("lyricsBody") ?? "").trim();
  const genreTags = String(formData.get("genreTags") ?? "").trim();
  const targetMode = String(formData.get("targetMode") ?? "");
  const file = formData.get("file");

  if (!title || !lyricsBody) {
    return { error: "Title and lyrics are required." };
  }
  if (targetMode !== "SPECIFIC" && targetMode !== "ALL_ARTISTS") {
    return { error: "Choose a targeting mode." };
  }

  let fileUrl: string | undefined;
  let fileName: string | undefined;
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveFile(buffer, file.name);
    fileUrl = saved.url;
    fileName = file.name;
  }

  const profile = await db.songwriterProfile.findUniqueOrThrow({
    where: { userId: session.user.id },
  });

  const submission = await db.submission.create({
    data: {
      songwriterProfileId: profile.id,
      title,
      lyricsBody,
      genreTags: genreTags || null,
      targetMode: targetMode as "SPECIFIC" | "ALL_ARTISTS",
      fileUrl,
      fileName,
    },
  });

  if (targetMode === "SPECIFIC") {
    redirect(`/dashboard/songwriter/submissions/${submission.id}/target`);
  }
  redirect("/dashboard/songwriter");
}
