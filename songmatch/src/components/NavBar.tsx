import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

function Logo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 text-ink-900 transition-transform active:scale-95"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-flame-400 to-flame-600 shadow-glow">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="text-white"
        >
          <path
            d="M4 14V10M9 17V7M14 20V4M19 14V10"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">
        SongMatch
      </span>
    </Link>
  );
}

export async function NavBar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-ink-150/80 bg-ink-50/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-3 py-3 sm:px-5 sm:py-3.5">
        <Logo />
        <div className="flex items-center gap-0.5 whitespace-nowrap text-xs sm:gap-1.5 sm:text-sm">
          <Link
            href="/terms"
            className="rounded-full px-2.5 py-1.5 font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 sm:px-3"
          >
            Terms
          </Link>
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full px-2.5 py-1.5 font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 sm:px-3"
              >
                Dashboard
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  data-testid="sign-out"
                  className="rounded-full px-2.5 py-1.5 font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 sm:px-3"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-2.5 py-1.5 font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 sm:px-3"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="btn btn-primary ml-1 rounded-full px-3.5 py-1.5 font-semibold sm:px-4"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
