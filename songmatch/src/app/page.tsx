import Link from "next/link";

const steps = [
  {
    n: "01",
    title: "Upload your song",
    body: "Lyrics, a cover picture, a rough demo — whatever brings the song to life.",
  },
  {
    n: "02",
    title: "Aim or broadcast",
    body: "Pitch it to specific artists you admire, or open it up to everyone on the platform.",
  },
  {
    n: "03",
    title: "Swipe, match, connect",
    body: "When an artist likes it back, you're matched — chat and take it from there.",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(55% 45% at 15% 0%, rgba(255,90,52,0.12), transparent 60%), radial-gradient(45% 40% at 100% 15%, rgba(110,70,166,0.12), transparent 60%)",
          }}
        />
        <div className="mx-auto grid max-w-5xl gap-12 px-5 pt-16 pb-24 md:grid-cols-[1.1fr_0.9fr] md:items-center md:pt-24">
          <div className="animate-fade-up text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-25 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
              For songwriters &amp; artists
            </span>
            <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight text-ink-900 sm:text-6xl">
              Your lyrics deserve
              <span className="block text-flame-600">the right voice.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-ink-600 md:mx-0">
              Upload your songs, aim them at the artists you dream of hearing
              them, or send them out to everyone. Swipe, match, and connect —
              Tinder-style, built for music.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Link
                href="/signup"
                className="btn btn-primary w-full rounded-full px-7 py-3 text-center font-semibold sm:w-auto"
              >
                Get started free
              </Link>
              <Link
                href="/terms"
                className="btn btn-ghost w-full rounded-full px-7 py-3 text-center font-semibold sm:w-auto"
              >
                Read the Terms
              </Link>
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-xs md:block">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-flame-200/50 to-plum-200/50 blur-2xl" />
            <div className="rotate-3 rounded-2xl border border-ink-150 bg-ink-25 p-5 shadow-float transition-transform duration-500 hover:rotate-0">
              <div className="h-28 rounded-lg bg-gradient-to-br from-flame-200 to-plum-200" />
              <p className="mt-4 font-display text-lg font-semibold text-ink-900">
                Concrete Constellations
              </p>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                by Casey Reed
              </p>
              <p className="mt-3 font-mono text-xs leading-relaxed text-ink-500">
                We built constellations out of concrete and streetlight,
                named every crack in the sidewalk after a wish...
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-400">
                  ✕
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-flame-500 text-white shadow-glow">
                  ♥
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink-150 bg-ink-25/60">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-center font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
            How it works
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.n} className="text-center sm:text-left">
                <span className="font-display text-3xl font-semibold text-flame-600">
                  {step.n}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-ink-900">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h2 className="font-display text-3xl font-semibold text-ink-900">
          Ready to find your match?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-ink-600">
          Join as a songwriter looking for a voice, or as an artist looking
          for your next song.
        </p>
        <Link
          href="/signup"
          className="btn btn-primary mt-7 inline-block rounded-full px-8 py-3 font-semibold"
        >
          Create your account
        </Link>
      </section>
    </main>
  );
}
