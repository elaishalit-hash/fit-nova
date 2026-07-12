import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function SongwriterDashboardPage() {
  const session = await auth();
  if (session?.user.role !== "SONGWRITER") {
    redirect("/dashboard");
  }

  const profile = await db.songwriterProfile.findUniqueOrThrow({
    where: { userId: session.user.id },
    include: {
      submissions: {
        orderBy: { createdAt: "desc" },
        include: { match: true },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          My Submissions
        </h1>
        <Link
          href="/dashboard/songwriter/submissions/new"
          data-testid="new-submission-link"
          className="btn btn-primary rounded-full px-4 py-2 text-sm font-semibold"
        >
          + New Submission
        </Link>
      </div>

      {profile.submissions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ink-200 bg-ink-25/60 px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-2xl">
            📝
          </span>
          <p className="font-medium text-ink-500">
            You haven&apos;t uploaded anything yet.
          </p>
          <Link
            href="/dashboard/songwriter/submissions/new"
            className="link-flame text-sm"
          >
            Create your first submission
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="submission-list">
          {profile.submissions.map((s) => (
            <li
              key={s.id}
              className="card-surface flex gap-4 rounded-xl p-4 transition-shadow hover:shadow-float"
            >
              {s.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.imageUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-flame-100 to-plum-100 text-xl">
                  🎵
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-ink-900">{s.title}</p>
                  <span className="shrink-0 rounded-full bg-ink-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                    {s.targetMode === "ALL_ARTISTS"
                      ? "Broadcast"
                      : "Specific artists"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-ink-500">
                  {s.lyricsBody}
                </p>
                {s.audioUrl && (
                  <p className="mt-1 text-xs text-ink-400">
                    🎵 {s.audioFileName}
                  </p>
                )}
                <div className="mt-2 flex gap-3 text-sm">
                  {s.match ? (
                    <span className="font-semibold text-flame-600">
                      ✓ Matched!
                    </span>
                  ) : s.targetMode === "SPECIFIC" ? (
                    <Link
                      href={`/dashboard/songwriter/submissions/${s.id}/target`}
                      className="link-flame"
                    >
                      Target artists
                    </Link>
                  ) : (
                    <span className="text-ink-400">
                      Waiting for a match...
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
