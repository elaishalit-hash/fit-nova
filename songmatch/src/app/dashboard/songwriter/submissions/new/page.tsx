import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SubmissionForm } from "@/components/SubmissionForm";

export default async function NewSubmissionPage() {
  const session = await auth();
  if (session?.user.role !== "SONGWRITER") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">New Submission</h1>
      <SubmissionForm />
    </div>
  );
}
