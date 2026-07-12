import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-bold">Join SongMatch</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Songwriters pitch lyrics to artists. Artists discover new material.
        </p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-rose-600">
          Sign in
        </Link>
      </p>
    </main>
  );
}
