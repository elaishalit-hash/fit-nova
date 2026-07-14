import { db } from "@/lib/db";
import { COPYRIGHT_SHARE_PERCENT } from "@/lib/config";
import { getCurrentTermsVersion } from "@/lib/terms";

// Artists' swipe deck: submissions not yet swiped by this artist, not yet
// matched to anyone, and eligible for this artist — either broadcast to all
// artists, or specifically targeted at this artist by the songwriter.
const DECK_BATCH_SIZE = 200;

export async function getArtistDeck(artistProfileId: string) {
  return db.submission.findMany({
    where: {
      match: null,
      artistSwipes: { none: { artistProfileId } },
      OR: [
        { targetMode: "ALL_ARTISTS" },
        {
          targetMode: "SPECIFIC",
          submissionTargets: {
            some: { artistProfileId, decision: "LIKE" },
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      lyricsBody: true,
      genreTags: true,
      imageUrl: true,
      audioUrl: true,
      songwriter: { select: { displayName: true } },
    },
    orderBy: { createdAt: "asc" },
    take: DECK_BATCH_SIZE,
  });
}

// Songwriter's targeting deck for one SPECIFIC-mode submission: artist
// profiles not yet swiped on for that submission.
export async function getArtistProfilesForTargeting(submissionId: string) {
  return db.artistProfile.findMany({
    where: {
      submissionTargets: { none: { submissionId } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function recordSubmissionTarget(
  submissionId: string,
  artistProfileId: string,
  decision: "LIKE" | "PASS"
) {
  const submission = await db.submission.findUniqueOrThrow({
    where: { id: submissionId },
  });
  if (submission.targetMode !== "SPECIFIC") {
    throw new Error("Only SPECIFIC-mode submissions can be targeted.");
  }

  try {
    await db.submissionTarget.create({
      data: { submissionId, artistProfileId, decision },
    });
  } catch {
    // Unique constraint on [submissionId, artistProfileId] — already swiped, no-op.
  }
}

export async function recordArtistSwipe(
  artistProfileId: string,
  submissionId: string,
  decision: "LIKE" | "PASS"
) {
  const eligible = await db.submission.findFirst({
    where: {
      id: submissionId,
      match: null,
      artistSwipes: { none: { artistProfileId } },
      OR: [
        { targetMode: "ALL_ARTISTS" },
        {
          targetMode: "SPECIFIC",
          submissionTargets: { some: { artistProfileId, decision: "LIKE" } },
        },
      ],
    },
    select: { id: true, songwriterProfileId: true },
  });
  if (!eligible) {
    throw new Error("This submission is not currently in your deck.");
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.artistSwipe.create({
        data: { artistProfileId, submissionId, decision },
      });

      if (decision === "LIKE") {
        const termsVersion = await getCurrentTermsVersion();

        await tx.match.create({
          data: {
            submissionId,
            songwriterProfileId: eligible.songwriterProfileId,
            artistProfileId,
            copyrightSharePercent: COPYRIGHT_SHARE_PERCENT,
            termsVersionId: termsVersion.id,
          },
        });
      }
    });
  } catch (err) {
    // Unique constraints on ArtistSwipe / Match.submissionId — treat a
    // duplicate swipe or already-matched submission as an idempotent no-op.
    const message = err instanceof Error ? err.message : "";
    if (!message.includes("Unique constraint")) {
      throw err;
    }
  }
}
