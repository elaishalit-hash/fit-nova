import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <main className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(40% 35% at 50% 0%, rgba(255,90,52,0.08), transparent 60%)",
        }}
      />
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-semibold text-ink-900">
            Join SongMatch
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Songwriters pitch lyrics to artists. Artists discover new
            material.
          </p>
        </div>
        <div className="card-surface rounded-2xl p-6">
          <SignupForm />
        </div>
        <p className="mt-5 text-center text-sm text-ink-500">
          Already have an account?{" "}
          <Link href="/login" className="link-flame">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
