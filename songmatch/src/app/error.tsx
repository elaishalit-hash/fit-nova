"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-flame-50 text-2xl">
        ⚠️
      </span>
      <h1 className="font-display text-3xl font-semibold text-ink-900">
        Something went wrong
      </h1>
      <p className="text-ink-600">
        An unexpected error occurred. You can try again, or head back home.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          onClick={reset}
          className="btn btn-primary rounded-full px-6 py-2.5 font-semibold"
        >
          Try again
        </button>
        <Link
          href="/"
          className="btn btn-ghost rounded-full px-6 py-2.5 font-semibold"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
