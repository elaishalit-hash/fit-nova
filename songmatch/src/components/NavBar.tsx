import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export async function NavBar() {
  const session = await auth();

  return (
    <header className="border-b border-neutral-200">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-rose-600">
          SongMatch
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/terms" className="text-neutral-600 hover:text-neutral-900">
            Terms
          </Link>
          {session?.user ? (
            <>
              <Link href="/dashboard" className="text-neutral-600 hover:text-neutral-900">
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
                  className="text-neutral-600 hover:text-neutral-900"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-neutral-600 hover:text-neutral-900">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700"
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
