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
      <p className="text-neutral-500" data-testid="matches-empty">
        No matches yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3" data-testid="match-list">
      {matches.map((m) => (
        <li key={m.id}>
          <Link
            href={`/matches/${m.id}`}
            data-testid="match-list-item"
            className="block rounded-lg border border-neutral-200 p-4 hover:border-rose-300"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{m.submissionTitle}</p>
              <span
                className="text-xs font-semibold text-rose-600"
                data-testid="match-copyright-percent"
              >
                {m.copyrightSharePercent}% platform share
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              with {m.counterpartName}
            </p>
            <p
              className="mt-1 text-xs text-neutral-400"
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
