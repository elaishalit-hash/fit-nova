export const dynamic = "force-dynamic";

type AppEntry = {
  name: string;
  description: string;
  url: string;
  statsUrl?: string;
  noUserTrackingReason?: string;
};

const APPS: AppEntry[] = [
  {
    name: "SongMatch",
    description: "Songwriter/artist matching app.",
    url: "https://songmatch-production-6c95.up.railway.app",
    statsUrl: "https://songmatch-production-6c95.up.railway.app/api/stats",
  },
  {
    name: "Fit Nova",
    description: "Workout, progress, and meal tracker.",
    url: "https://fit-n.netlify.app/",
    noUserTrackingReason:
      "No signup count available — it's a local-only app (all data stays in each visitor's own browser, nothing is tracked server-side).",
  },
];

async function checkStatus(url: string) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return {
      ok: res.ok,
      statusCode: res.status as number | null,
      ms: Date.now() - start,
    };
  } catch {
    return { ok: false, statusCode: null, ms: Date.now() - start };
  }
}

type Stats = {
  userCount: number;
  songwriterCount: number;
  artistCount: number;
  submissionCount: number;
  matchCount: number;
};

async function fetchStats(statsUrl: string): Promise<Stats | null> {
  const key = process.env.STATS_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(statsUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: { "x-stats-key": key },
    });
    if (!res.ok) return null;
    return (await res.json()) as Stats;
  } catch {
    return null;
  }
}

export default async function Home() {
  const results = await Promise.all(
    APPS.map(async (app) => {
      const status = await checkStatus(app.url);
      const stats = app.statsUrl ? await fetchStats(app.statsUrl) : null;
      return { app, ...status, stats };
    })
  );
  const checkedAt = new Date().toLocaleString();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-foreground">My Apps</h1>
      <p className="mt-1 text-sm text-zinc-500">Checked at {checkedAt}</p>

      <ul className="mt-8 flex flex-col gap-4">
        {results.map(({ app, ok, statusCode, ms, stats }) => (
          <li
            key={app.url}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {app.name}
                </p>
                <p className="text-sm text-zinc-500">{app.description}</p>
              </div>
              <span
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  ok
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    ok ? "bg-emerald-500" : "bg-zinc-400"
                  }`}
                />
                {ok ? "Online" : "Unreachable"}
              </span>
            </div>

            {app.statsUrl ? (
              stats ? (
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-indigo-100 px-2.5 py-1 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {stats.userCount} people
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {stats.songwriterCount} songwriters ·{" "}
                    {stats.artistCount} artists
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {stats.submissionCount} submissions ·{" "}
                    {stats.matchCount} matches
                  </span>
                </div>
              ) : (
                <p className="mt-3 text-xs text-zinc-400">
                  Signup count unavailable right now.
                </p>
              )
            ) : (
              <p className="mt-3 text-xs text-zinc-400">
                {app.noUserTrackingReason}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-600 hover:underline dark:text-zinc-300"
              >
                {app.url.replace(/^https?:\/\//, "")}
              </a>
              <span>
                {statusCode ? `HTTP ${statusCode} · ` : ""}
                {ms}ms
              </span>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
