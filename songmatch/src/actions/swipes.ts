"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordArtistSwipe, recordSubmissionTarget } from "@/lib/matching";

export async function submissionTargetSwipeAction(
  submissionId: string,
  artistProfileId: string,
  decision: "LIKE" | "PASS"
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SONGWRITER") {
    throw new Error("Unauthorized");
  }

  const profile = await db.songwriterProfile.findUniqueOrThrow({
    where: { userId: session.user.id },
  });
  const submission = await db.submission.findUniqueOrThrow({
    where: { id: submissionId },
  });
  if (submission.songwriterProfileId !== profile.id) {
    throw new Error("Unauthorized");
  }

  await recordSubmissionTarget(submissionId, artistProfileId, decision);
  revalidatePath("/dashboard/songwriter");
}

export async function artistSwipeAction(
  submissionId: string,
  decision: "LIKE" | "PASS"
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ARTIST") {
    throw new Error("Unauthorized");
  }

  const profile = await db.artistProfile.findUniqueOrThrow({
    where: { userId: session.user.id },
  });

  await recordArtistSwipe(profile.id, submissionId, decision);
  revalidatePath("/dashboard/artist");
  revalidatePath("/dashboard/artist/matches");
  revalidatePath("/dashboard/songwriter/matches");
}
