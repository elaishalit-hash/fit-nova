import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-bold">Sign in</h1>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-neutral-500">
        No account yet?{" "}
        <Link href="/signup" className="font-semibold text-rose-600">
          Create one
        </Link>
      </p>
    </main>
  );
}
