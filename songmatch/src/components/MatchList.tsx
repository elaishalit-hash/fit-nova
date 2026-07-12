import Link from "next/link";

export type MatchListEntry = {
  id: string;
  submissionTitle: string;
  counterpartName: string;
  copyrightSharePercent: number;
  termsVersionLabel: string;
  createdAt: Date;
};

export function MatchList({ matches }: { matches: MatchListEntry[] }) {
  if (matches.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ink-200 bg-ink-25/60 px-6 py-16 text-center"
        data-testid="matches-empty"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-2xl">
          💫
        </span>
        <p className="font-medium text-ink-500">No matches yet.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3" data-testid="match-list">
      {matches.map((m) => (
        <li key={m.id}>
          <Link
            href={`/matches/${m.id}`}
            data-testid="match-list-item"
            className="card-surface group block rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-float hover:border-flame-300"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-ink-900">{m.submissionTitle}</p>
              <span
                className="shrink-0 rounded-full bg-flame-50 px-2.5 py-0.5 text-xs font-semibold text-flame-700"
                data-testid="match-copyright-percent"
              >
                {m.copyrightSharePercent}% platform share
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              with {m.counterpartName}
            </p>
            <p
              className="mt-1 text-xs text-ink-400"
              data-testid="match-terms-version"
            >
              Terms {m.termsVersionLabel}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
