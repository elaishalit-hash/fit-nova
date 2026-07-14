"use client";

import { useActionState } from "react";
import { signupAction } from "@/actions/auth";

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="sr-only">I am a...</legend>
        <label className="group flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-ink-200 bg-ink-25 p-4 text-sm transition-colors has-[:checked]:border-flame-400 has-[:checked]:bg-flame-50">
          <input type="radio" name="role" value="SONGWRITER" defaultChecked />
          <span className="font-semibold text-ink-900">Songwriter</span>
          <span className="text-xs text-ink-500">I write lyrics</span>
        </label>
        <label className="group flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-ink-200 bg-ink-25 p-4 text-sm transition-colors has-[:checked]:border-flame-400 has-[:checked]:bg-flame-50">
          <input type="radio" name="role" value="ARTIST" />
          <span className="font-semibold text-ink-900">Artist</span>
          <span className="text-xs text-ink-500">I perform songs</span>
        </label>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Name</span>
        <input
          name="name"
          type="text"
          required
          maxLength={100}
          data-testid="signup-name"
          className="field"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Email</span>
        <input
          name="email"
          type="email"
          required
          data-testid="signup-email"
          className="field"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          data-testid="signup-password"
          className="field"
        />
      </label>

      {state?.error && (
        <p
          className="rounded-lg bg-flame-50 px-3 py-2 text-sm font-medium text-flame-700"
          data-testid="signup-error"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        data-testid="signup-submit"
        className="btn btn-primary rounded-full px-4 py-2.5 font-semibold disabled:opacity-60"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
