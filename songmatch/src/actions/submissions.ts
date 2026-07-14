"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAcceptedCurrentTerms } from "@/lib/terms";
import { saveFile, UploadValidationError } from "@/lib/storage";

export type SubmissionFormState = { error?: string };

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "ogg", "aac", "flac"];

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
  const image = formData.get("image");
  const audio = formData.get("audio");

  if (!title) {
    return { error: "Title is required." };
  }
  if (targetMode !== "SPECIFIC" && targetMode !== "ALL_ARTISTS") {
    return { error: "Choose a targeting mode." };
  }

  let fileUrl: string | undefined;
  let fileName: string | undefined;
  let imageUrl: string | undefined;
  let imageFileName: string | undefined;
  let audioUrl: string | undefined;
  let audioFileName: string | undefined;

  try {
    if (file instanceof File && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const saved = await saveFile(buffer, file.name);
      fileUrl = saved.url;
      fileName = file.name;
    }

    if (image instanceof File && image.size > 0) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const saved = await saveFile(buffer, image.name, {
        allowedExtensions: IMAGE_EXTENSIONS,
      });
      imageUrl = saved.url;
      imageFileName = image.name;
    }

    if (audio instanceof File && audio.size > 0) {
      const buffer = Buffer.from(await audio.arrayBuffer());
      const saved = await saveFile(buffer, audio.name, {
        allowedExtensions: AUDIO_EXTENSIONS,
      });
      audioUrl = saved.url;
      audioFileName = audio.name;
    }
  } catch (err) {
    if (err instanceof UploadValidationError) {
      return { error: err.message };
    }
    throw err;
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
      imageUrl,
      imageFileName,
      audioUrl,
      audioFileName,
    },
  });

  if (targetMode === "SPECIFIC") {
    redirect(`/dashboard/songwriter/submissions/${submission.id}/target`);
  }
  redirect("/dashboard/songwriter");
}
