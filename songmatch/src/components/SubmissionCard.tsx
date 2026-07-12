export type SubmissionCardData = {
  id: string;
  title: string;
  lyricsBody: string;
  genreTags: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  songwriter: { displayName: string };
};

export function SubmissionCard({
  submission,
}: {
  submission: SubmissionCardData;
}) {
  return (
    <div className="flex h-full flex-col gap-3.5">
      {submission.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={submission.imageUrl}
          alt=""
          data-testid="deck-card-image"
          className="h-36 w-full rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-flame-100 to-plum-100 text-3xl">
          🎶
        </div>
      )}
      <div>
        <h2
          className="line-clamp-2 font-display text-2xl font-semibold text-ink-900"
          data-testid="deck-card-title"
        >
          {submission.title}
        </h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
          by {submission.songwriter.displayName}
          {submission.genreTags ? ` · ${submission.genreTags}` : ""}
        </p>
      </div>
      {submission.audioUrl && (
        <audio
          controls
          src={submission.audioUrl}
          data-testid="deck-card-audio"
          className="w-full"
        />
      )}
      <p className="whitespace-pre-wrap rounded-lg bg-ink-50 p-3 font-mono text-sm leading-relaxed text-ink-700">
        {submission.lyricsBody}
      </p>
    </div>
  );
}
