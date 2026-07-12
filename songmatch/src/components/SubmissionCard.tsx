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
    <div className="flex h-full flex-col gap-3">
      {submission.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={submission.imageUrl}
          alt=""
          data-testid="deck-card-image"
          className="h-36 w-full rounded-md object-cover"
        />
      )}
      <h2 className="text-xl font-bold" data-testid="deck-card-title">
        {submission.title}
      </h2>
      <p className="text-xs uppercase tracking-wide text-neutral-400">
        by {submission.songwriter.displayName}
      </p>
      {submission.genreTags && (
        <p className="text-xs text-neutral-400">{submission.genreTags}</p>
      )}
      {submission.audioUrl && (
        <audio
          controls
          src={submission.audioUrl}
          data-testid="deck-card-audio"
          className="w-full"
        />
      )}
      <p className="whitespace-pre-wrap font-mono text-sm text-neutral-700">
        {submission.lyricsBody}
      </p>
    </div>
  );
}
