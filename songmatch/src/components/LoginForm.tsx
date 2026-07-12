"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Email</span>
        <input
          name="email"
          type="email"
          required
          data-testid="login-email"
          className="field"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Password</span>
        <input
          name="password"
          type="password"
          required
          data-testid="login-password"
          className="field"
        />
      </label>

      {state?.error && (
        <p
          className="rounded-lg bg-flame-50 px-3 py-2 text-sm font-medium text-flame-700"
          data-testid="login-error"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        data-testid="login-submit"
        className="btn btn-primary rounded-full px-4 py-2.5 font-semibold disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
