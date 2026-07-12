"use client";

import { useActionState } from "react";
import { signupAction } from "@/actions/auth";

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <fieldset className="grid grid-cols-2 gap-3">
        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-neutral-300 p-4 text-sm has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50">
          <input
            type="radio"
            name="role"
            value="SONGWRITER"
            defaultChecked
            className="sr-only"
          />
          <span className="font-semibold">Songwriter</span>
          <span className="text-xs text-neutral-500">I write lyrics</span>
        </label>
        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-neutral-300 p-4 text-sm has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50">
          <input
            type="radio"
            name="role"
            value="ARTIST"
            className="sr-only"
          />
          <span className="font-semibold">Artist</span>
          <span className="text-xs text-neutral-500">I perform songs</span>
        </label>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          name="name"
          type="text"
          required
          data-testid="signup-name"
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          data-testid="signup-email"
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={8}
          data-testid="signup-password"
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>

      {state?.error && (
        <p className="text-sm text-red-600" data-testid="signup-error">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        data-testid="signup-submit"
        className="rounded-md bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
