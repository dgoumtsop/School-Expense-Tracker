"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form-state";
import { login } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, {} as FormState);

  return (
    <form action={formAction} className="panel mt-6 space-y-4 p-5">
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="field"
        />
      </div>
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}