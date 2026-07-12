import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MessageThread } from "@/components/MessageThread";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { matchId } = await params;

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      submission: true,
      songwriter: { include: { user: true } },
      artist: { include: { user: true } },
      termsVersion: true,
      messages: { orderBy: { createdAt: "asc" }, include: { sender: true } },
    },
  });

  if (!match) {
    notFound();
  }

  const isParticipant =
    match.songwriter.userId === session.user.id ||
    match.artist.userId === session.user.id;
  if (!isParticipant) {
    notFound();
  }

  const viewerIsSongwriter = match.songwriter.userId === session.user.id;
  const counterpart = viewerIsSongwriter ? match.artist : match.songwriter;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">{match.submission.title}</h1>
        <p className="mt-1 text-neutral-500">
          Matched with {counterpart.displayName}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <span
          className="rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-700"
          data-testid="match-detail-copyright"
        >
          {match.copyrightSharePercent}% platform copyright share
        </span>
        <span
          className="rounded-full bg-neutral-100 px-3 py-1 font-semibold text-neutral-600"
          data-testid="match-detail-terms"
        >
          Terms {match.termsVersion.versionLabel}
        </span>
      </div>

      <div className="rounded-lg border border-neutral-200 p-4">
        <p className="whitespace-pre-wrap font-mono text-sm text-neutral-700">
          {match.submission.lyricsBody}
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Messages</h2>
        <MessageThread
          matchId={match.id}
          currentUserId={session.user.id}
          messages={match.messages.map((m) => ({
            id: m.id,
            body: m.body,
            senderUserId: m.senderUserId,
            senderName: m.sender.name,
            createdAt: m.createdAt,
          }))}
        />
      </div>
    </main>
  );
}
