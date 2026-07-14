import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-2xl">
        🎵
      </span>
      <h1 className="font-display text-3xl font-semibold text-ink-900">
        Page not found
      </h1>
      <p className="text-ink-600">
        This page doesn&apos;t exist, or it may have moved.
      </p>
      <Link
        href="/"
        className="btn btn-primary mt-2 rounded-full px-6 py-2.5 font-semibold"
      >
        Back to home
      </Link>
    </main>
  );
}
