"use client";

import { useActionState } from "react";
import { createSubmissionAction } from "@/actions/submissions";

export function SubmissionForm() {
  const [state, action, pending] = useActionState(
    createSubmissionAction,
    undefined
  );

  return (
    <form
      action={action}
      encType="multipart/form-data"
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1 text-sm">
        Title
        <input
          name="title"
          type="text"
          required
          data-testid="submission-title"
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Lyrics
        <textarea
          name="lyricsBody"
          required
          rows={8}
          data-testid="submission-lyrics"
          className="rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Genre tags (comma separated, optional)
        <input
          name="genreTags"
          type="text"
          placeholder="pop, ballad"
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Attach a file (optional — PDF/TXT)
        <input
          name="file"
          type="file"
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>

      <fieldset className="grid grid-cols-2 gap-3">
        <label className="flex cursor-pointer flex-col gap-1 rounded-lg border border-neutral-300 p-4 text-sm has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50">
          <span className="flex items-center gap-2 font-semibold">
            <input
              type="radio"
              name="targetMode"
              value="SPECIFIC"
              defaultChecked
              data-testid="target-mode-specific"
            />
            Target specific artists
          </span>
          <span className="text-xs text-neutral-500">
            You&apos;ll swipe through artist profiles next.
          </span>
        </label>
        <label className="flex cursor-pointer flex-col gap-1 rounded-lg border border-neutral-300 p-4 text-sm has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50">
          <span className="flex items-center gap-2 font-semibold">
            <input
              type="radio"
              name="targetMode"
              value="ALL_ARTISTS"
              data-testid="target-mode-all"
            />
            Broadcast to all artists
          </span>
          <span className="text-xs text-neutral-500">
            Any artist can discover and like this.
          </span>
        </label>
      </fieldset>

      {state?.error && (
        <p className="text-sm text-red-600" data-testid="submission-error">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        data-testid="submission-submit"
        className="rounded-md bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save submission"}
      </button>
    </form>
  );
}
