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
      className="card-surface flex flex-col gap-5 rounded-2xl p-6"
    >
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Title</span>
        <input
          name="title"
          type="text"
          required
          maxLength={200}
          data-testid="submission-title"
          className="field"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Lyrics (optional)</span>
        <textarea
          name="lyricsBody"
          rows={8}
          maxLength={20000}
          data-testid="submission-lyrics"
          className="field font-mono"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Genre tags (optional)</span>
        <input
          name="genreTags"
          type="text"
          placeholder="pop, ballad"
          maxLength={200}
          className="field"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Cover picture (optional)</span>
          <input
            name="image"
            type="file"
            accept="image/*"
            data-testid="submission-image"
            className="field cursor-pointer file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink-700 hover:file:bg-ink-150"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="field-label">Your music (optional)</span>
          <input
            name="audio"
            type="file"
            accept="audio/*"
            data-testid="submission-audio"
            className="field cursor-pointer file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink-700 hover:file:bg-ink-150"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Lyric sheet attachment (optional)</span>
        <input
          name="file"
          type="file"
          accept=".pdf,.txt"
          className="field cursor-pointer file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink-700 hover:file:bg-ink-150"
        />
      </label>

      <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <legend className="sr-only">Who should see this submission</legend>
        <label className="flex cursor-pointer flex-col gap-1 rounded-xl border border-ink-200 bg-ink-25 p-4 text-sm transition-colors has-[:checked]:border-flame-400 has-[:checked]:bg-flame-50">
          <span className="flex items-center gap-2 font-semibold text-ink-900">
            <input
              type="radio"
              name="targetMode"
              value="SPECIFIC"
              defaultChecked
              data-testid="target-mode-specific"
            />
            Target specific artists
          </span>
          <span className="text-xs text-ink-500">
            You&apos;ll swipe through artist profiles next.
          </span>
        </label>
        <label className="flex cursor-pointer flex-col gap-1 rounded-xl border border-ink-200 bg-ink-25 p-4 text-sm transition-colors has-[:checked]:border-flame-400 has-[:checked]:bg-flame-50">
          <span className="flex items-center gap-2 font-semibold text-ink-900">
            <input
              type="radio"
              name="targetMode"
              value="ALL_ARTISTS"
              data-testid="target-mode-all"
            />
            Broadcast to all artists
          </span>
          <span className="text-xs text-ink-500">
            Any artist can discover and like this.
          </span>
        </label>
      </fieldset>

      {state?.error && (
        <p
          className="rounded-lg bg-flame-50 px-3 py-2 text-sm font-medium text-flame-700"
          data-testid="submission-error"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        data-testid="submission-submit"
        className="btn btn-primary rounded-full px-4 py-2.5 font-semibold disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save submission"}
      </button>
    </form>
  );
}
