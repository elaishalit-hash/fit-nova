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
        <h1 className="text-2xl font-bold">My Submissions</h1>
        <Link
          href="/dashboard/songwriter/submissions/new"
          data-testid="new-submission-link"
          className="rounded-md bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700"
        >
          New Submission
        </Link>
      </div>

      {profile.submissions.length === 0 ? (
        <p className="text-neutral-500">
          You haven&apos;t uploaded anything yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="submission-list">
          {profile.submissions.map((s) => (
            <li
              key={s.id}
              className="flex gap-4 rounded-lg border border-neutral-200 p-4"
            >
              {s.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.imageUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-md object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{s.title}</p>
                  <span className="shrink-0 text-xs uppercase text-neutral-400">
                    {s.targetMode === "ALL_ARTISTS"
                      ? "Broadcast"
                      : "Specific artists"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
                  {s.lyricsBody}
                </p>
                {s.audioUrl && (
                  <p className="mt-1 text-xs text-neutral-400">
                    🎵 {s.audioFileName}
                  </p>
                )}
                <div className="mt-2 flex gap-3 text-sm">
                {s.match ? (
                  <span className="font-semibold text-rose-600">
                    Matched!
                  </span>
                ) : s.targetMode === "SPECIFIC" ? (
                  <Link
                    href={`/dashboard/songwriter/submissions/${s.id}/target`}
                    className="text-rose-600 hover:underline"
                  >
                    Target artists
                  </Link>
                ) : (
                  <span className="text-neutral-400">
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
