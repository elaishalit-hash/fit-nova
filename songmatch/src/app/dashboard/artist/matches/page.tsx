import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MatchList } from "@/components/MatchList";

export default async function ArtistMatchesPage() {
  const session = await auth();
  if (session?.user.role !== "ARTIST") {
    redirect("/dashboard");
  }

  const profile = await db.artistProfile.findUniqueOrThrow({
    where: { userId: session.user.id },
  });

  const matches = await db.match.findMany({
    where: { artistProfileId: profile.id },
    include: { submission: true, songwriter: true, termsVersion: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">My Matches</h1>
      <MatchList
        matches={matches.map((m) => ({
          id: m.id,
          submissionTitle: m.submission.title,
          counterpartName: m.songwriter.displayName,
          copyrightSharePercent: m.copyrightSharePercent,
          termsVersionLabel: m.termsVersion.versionLabel,
          createdAt: m.createdAt,
        }))}
      />
    </div>
  );
}
