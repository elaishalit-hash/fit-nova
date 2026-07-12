export type ArtistCardData = {
  id: string;
  displayName: string;
  bio: string | null;
  genreTags: string | null;
};

export function ArtistCard({ artist }: { artist: ArtistCardData }) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-plum-200 to-flame-100 text-4xl font-semibold text-plum-700">
        {artist.displayName.slice(0, 1).toUpperCase()}
      </div>
      <div>
        <h2
          className="line-clamp-2 font-display text-2xl font-semibold text-ink-900"
          data-testid="deck-card-title"
        >
          {artist.displayName}
        </h2>
        {artist.genreTags && (
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-plum-500">
            {artist.genreTags}
          </p>
        )}
      </div>
      <p className="text-sm leading-relaxed text-ink-600">
        {artist.bio ?? "No bio yet."}
      </p>
    </div>
  );
}
