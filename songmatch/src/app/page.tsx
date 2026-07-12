import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Songwriters meet artists.
      </h1>
      <p className="max-w-xl text-neutral-600">
        Upload your lyrics, aim them at a specific artist or broadcast to
        everyone. Swipe, match, and connect — Tinder-style.
      </p>
      <div className="flex gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-rose-600 px-5 py-2.5 font-semibold text-white hover:bg-rose-700"
        >
          Get started
        </Link>
        <Link
          href="/terms"
          className="rounded-md border border-neutral-300 px-5 py-2.5 font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Read the Terms
        </Link>
      </div>
    </main>
  );
}
