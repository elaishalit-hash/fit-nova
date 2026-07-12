export type ArtistCardData = {
  id: string;
  displayName: string;
  bio: string | null;
  genreTags: string | null;
};

export function ArtistCard({ artist }: { artist: ArtistCardData }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex h-32 items-center justify-center rounded-lg bg-rose-100 text-4xl font-bold text-rose-600">
        {artist.displayName.slice(0, 1).toUpperCase()}
      </div>
      <h2 className="text-xl font-bold" data-testid="deck-card-title">
        {artist.displayName}
      </h2>
      {artist.genreTags && (
        <p className="text-xs uppercase tracking-wide text-neutral-400">
          {artist.genreTags}
        </p>
      )}
      <p className="text-sm text-neutral-600">
        {artist.bio ?? "No bio yet."}
      </p>
    </div>
  );
}
