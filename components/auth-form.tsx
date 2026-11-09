"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

const fieldClass =
  "w-full rounded-xl border border-line bg-paper px-3 py-2 text-ink";

export function AuthForm({
  mode,
  nextPath,
}: {
  mode: "sign-in" | "sign-up";
  nextPath: string;
}) {
  const action = mode === "sign-in" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="next" value={nextPath} />
      {mode === "sign-up" ? (
        <label className="grid gap-1 text-sm font-semibold">
          Name on your shelf
          <input name="displayName" autoComplete="name" required className={fieldClass} />
        </label>
      ) : null}
      <label className="grid gap-1 text-sm font-semibold">
        Email
        <input name="email" type="email" autoComplete="email" required className={fieldClass} />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Password
        <input
          name="password"
          type="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          required
          minLength={6}
          className={fieldClass}
        />
      </label>
      {state.error ? <p className="text-sm text-clay">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-lake-deep">{state.message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-lake px-5 py-2.5 font-semibold text-white hover:bg-lake-deep disabled:opacity-60"
      >
        {pending ? "Working…" : mode === "sign-in" ? "Sign in" : "Create account"}
      </button>
      {mode === "sign-in" ? (
        <p className="text-sm text-ink-soft">
          New here?{" "}
          <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-lake-deep">
            Create an account
          </Link>
        </p>
      ) : (
        <p className="text-sm text-ink-soft">
          Already have a shelf?{" "}
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-lake-deep">
            Sign in
          </Link>
        </p>
      )}
    </form>
  );
}
