import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MatchList } from "@/components/MatchList";

export default async function SongwriterMatchesPage() {
  const session = await auth();
  if (session?.user.role !== "SONGWRITER") {
    redirect("/dashboard");
  }

  const profile = await db.songwriterProfile.findUniqueOrThrow({
    where: { userId: session.user.id },
  });

  const matches = await db.match.findMany({
    where: { songwriterProfileId: profile.id },
    select: {
      id: true,
      copyrightSharePercent: true,
      createdAt: true,
      submission: { select: { title: true } },
      artist: { select: { displayName: true } },
      termsVersion: { select: { versionLabel: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink-900">
        My Matches
      </h1>
      <MatchList
        matches={matches.map((m) => ({
          id: m.id,
          submissionTitle: m.submission.title,
          counterpartName: m.artist.displayName,
          copyrightSharePercent: m.copyrightSharePercent,
          termsVersionLabel: m.termsVersion.versionLabel,
          createdAt: m.createdAt,
        }))}
      />
    </div>
  );
}
