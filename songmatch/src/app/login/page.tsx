import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your SongMatch account.",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(40% 35% at 50% 0%, rgba(110,70,166,0.08), transparent 60%)",
        }}
      />
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-semibold text-ink-900">
            Welcome back
          </h1>
        </div>
        <div className="card-surface rounded-2xl p-6">
          <LoginForm />
        </div>
        <p className="mt-5 text-center text-sm text-ink-500">
          No account yet?{" "}
          <Link href="/signup" className="link-flame">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
