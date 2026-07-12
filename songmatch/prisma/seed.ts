import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { COPYRIGHT_SHARE_PERCENT } from "../src/lib/config";
import { TERMS_BODY_MARKDOWN, TERMS_VERSION_LABEL } from "../src/lib/termsContent";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const db = new PrismaClient({ adapter });

const DEMO_PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const termsVersion = await db.termsVersion.upsert({
    where: { versionLabel: TERMS_VERSION_LABEL },
    update: { bodyMarkdown: TERMS_BODY_MARKDOWN },
    create: {
      versionLabel: TERMS_VERSION_LABEL,
      bodyMarkdown: TERMS_BODY_MARKDOWN,
    },
  });

  async function upsertSongwriter(email: string, name: string, bio: string) {
    return db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        passwordHash,
        role: "SONGWRITER",
        songwriterProfile: { create: { displayName: name, bio } },
        termsAcceptances: {
          create: { termsVersionId: termsVersion.id },
        },
      },
      include: { songwriterProfile: true },
    });
  }

  async function upsertArtist(
    email: string,
    name: string,
    bio: string,
    genreTags: string
  ) {
    return db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        passwordHash,
        role: "ARTIST",
        artistProfile: { create: { displayName: name, bio, genreTags } },
        termsAcceptances: {
          create: { termsVersionId: termsVersion.id },
        },
      },
      include: { artistProfile: true },
    });
  }

  const songwriter1 = await upsertSongwriter(
    "songwriter1@songmatch.test",
    "Robin Vale",
    "Lyricist chasing three-minute heartbreaks."
  );
  const songwriter2 = await upsertSongwriter(
    "songwriter2@songmatch.test",
    "Casey Reed",
    "Writes hooks first, verses second."
  );
  const artist1 = await upsertArtist(
    "artist1@songmatch.test",
    "Nova Sterling",
    "Indie-pop vocalist, always looking for fresh lyrics.",
    "indie, pop"
  );
  const artist2 = await upsertArtist(
    "artist2@songmatch.test",
    "Jax Rivera",
    "Singer-songwriter with a soft spot for ballads.",
    "ballad, acoustic"
  );

  if (
    !songwriter1.songwriterProfile ||
    !songwriter2.songwriterProfile ||
    !artist1.artistProfile ||
    !artist2.artistProfile
  ) {
    throw new Error("Seed profiles failed to create.");
  }

  // Broadcast submission — visible to every artist immediately, nothing pre-swiped.
  await db.submission.upsert({
    where: { id: "seed-broadcast-submission" },
    update: {},
    create: {
      id: "seed-broadcast-submission",
      songwriterProfileId: songwriter1.songwriterProfile.id,
      title: "Neon Rearview",
      lyricsBody:
        "Taillights bleeding into rain,\nI keep replaying your refrain...",
      genreTags: "pop, night-drive",
      targetMode: "ALL_ARTISTS",
    },
  });

  // Specific submission, pre-targeted at artist2 — visible in artist2's deck right away.
  const targetedSubmission = await db.submission.upsert({
    where: { id: "seed-targeted-submission" },
    update: {},
    create: {
      id: "seed-targeted-submission",
      songwriterProfileId: songwriter2.songwriterProfile.id,
      title: "Paper Boats",
      lyricsBody:
        "We folded promises from paper boats,\nand sent them down the gutter after the storm...",
      genreTags: "ballad",
      targetMode: "SPECIFIC",
    },
  });
  await db.submissionTarget.upsert({
    where: {
      submissionId_artistProfileId: {
        submissionId: targetedSubmission.id,
        artistProfileId: artist2.artistProfile.id,
      },
    },
    update: {},
    create: {
      submissionId: targetedSubmission.id,
      artistProfileId: artist2.artistProfile.id,
      decision: "LIKE",
    },
  });

  // Untargeted SPECIFIC submission — for manually exercising the targeting deck.
  await db.submission.upsert({
    where: { id: "seed-untargeted-submission" },
    update: {},
    create: {
      id: "seed-untargeted-submission",
      songwriterProfileId: songwriter1.songwriterProfile.id,
      title: "Static & Stars",
      lyricsBody: "Somewhere between the static and the stars,\nI found your frequency...",
      genreTags: "indie",
      targetMode: "SPECIFIC",
    },
  });

  // A fully pre-baked match with a seeded message, so /matches pages have data immediately.
  const matchSubmission = await db.submission.upsert({
    where: { id: "seed-matched-submission" },
    update: {},
    create: {
      id: "seed-matched-submission",
      songwriterProfileId: songwriter2.songwriterProfile.id,
      title: "Concrete Constellations",
      lyricsBody:
        "We built constellations out of concrete and streetlight,\nnamed every crack in the sidewalk after a wish...",
      genreTags: "indie, pop",
      targetMode: "ALL_ARTISTS",
    },
  });
  const seedMatch = await db.match.upsert({
    where: { submissionId: matchSubmission.id },
    update: {},
    create: {
      submissionId: matchSubmission.id,
      songwriterProfileId: songwriter2.songwriterProfile.id,
      artistProfileId: artist1.artistProfile.id,
      copyrightSharePercent: COPYRIGHT_SHARE_PERCENT,
      termsVersionId: termsVersion.id,
    },
  });
  await db.artistSwipe.upsert({
    where: {
      artistProfileId_submissionId: {
        artistProfileId: artist1.artistProfile.id,
        submissionId: matchSubmission.id,
      },
    },
    update: {},
    create: {
      artistProfileId: artist1.artistProfile.id,
      submissionId: matchSubmission.id,
      decision: "LIKE",
    },
  });
  await db.message.upsert({
    where: { id: "seed-message-1" },
    update: {},
    create: {
      id: "seed-message-1",
      matchId: seedMatch.id,
      senderUserId: artist1.id,
      body: "Loved 'Concrete Constellations' — when can we get in the studio?",
    },
  });

  console.log("Seed complete.");
  console.log(`Demo password for all accounts: ${DEMO_PASSWORD}`);
  console.log(
    [
      "songwriter1@songmatch.test",
      "songwriter2@songmatch.test",
      "artist1@songmatch.test",
      "artist2@songmatch.test",
    ].join(", ")
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
