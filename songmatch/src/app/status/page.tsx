export const dynamic = "force-dynamic";

type AppEntry = {
  name: string;
  description: string;
  url: string;
};

const APPS: AppEntry[] = [
  {
    name: "SongMatch",
    description: "Songwriter/artist matching app.",
    url: "https://songmatch-production-6c95.up.railway.app",
  },
  {
    name: "Fit Nova",
    description: "Workout, progress, and meal tracker.",
    url: "https://fit-n.netlify.app/",
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

export default async function StatusPage() {
  const results = await Promise.all(
    APPS.map(async (app) => ({ app, ...(await checkStatus(app.url)) }))
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink-900">
        My Apps
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Live status, checked when this page loads.
      </p>

      <ul className="mt-8 flex flex-col gap-4">
        {results.map(({ app, ok, statusCode, ms }) => (
          <li key={app.url} className="card-surface rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg font-semibold text-ink-900">
                  {app.name}
                </p>
                <p className="text-sm text-ink-500">{app.description}</p>
              </div>
              <span
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  ok
                    ? "bg-flame-50 text-flame-700"
                    : "bg-ink-100 text-ink-500"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    ok ? "bg-flame-500" : "bg-ink-400"
                  }`}
                />
                {ok ? "Online" : "Unreachable"}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-flame"
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
