"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          data-testid="login-email"
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          data-testid="login-password"
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>

      {state?.error && (
        <p className="text-sm text-red-600" data-testid="login-error">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        data-testid="login-submit"
        className="rounded-md bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
