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
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="animate-fade-up flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-flame-400 to-plum-400 font-display text-2xl font-semibold text-white shadow-glow">
          {counterpart.displayName.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            {match.submission.title}
          </h1>
          <p className="mt-0.5 text-ink-500">
            Matched with {counterpart.displayName}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <span
          className="rounded-full bg-flame-50 px-3 py-1 font-semibold text-flame-700"
          data-testid="match-detail-copyright"
        >
          {match.copyrightSharePercent}% platform copyright share
        </span>
        <span
          className="rounded-full bg-ink-100 px-3 py-1 font-semibold text-ink-600"
          data-testid="match-detail-terms"
        >
          Terms {match.termsVersion.versionLabel}
        </span>
      </div>

      {match.submission.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={match.submission.imageUrl}
          alt=""
          className="h-56 w-full rounded-2xl object-cover shadow-card"
        />
      )}

      {match.submission.audioUrl && (
        <audio
          controls
          src={match.submission.audioUrl}
          data-testid="match-detail-audio"
          className="w-full"
        />
      )}

      <div className="card-surface rounded-2xl p-4">
        {match.submission.lyricsBody ? (
          <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-ink-700">
            {match.submission.lyricsBody}
          </p>
        ) : (
          <p className="text-sm italic text-ink-400">
            No lyrics provided — see attached music/file.
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-2 font-display text-lg font-semibold text-ink-900">
          Messages
        </h2>
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
