import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getOptionalUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-serif text-3xl sm:text-4xl">Start your shelf</h1>
      <p className="mt-2 text-ink-soft">A name, an email, and a password.</p>
      <div className="mt-8 rounded-3xl border border-line bg-paper-raised p-4 sm:p-6">
        <Suspense fallback={<p className="text-ink-soft">Checking your shelf…</p>}>
          <SignupBody searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function SignupBody({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/library";

  if (!isSupabaseConfigured()) {
    return (
      <p className="text-ink-soft">
        Accounts open once the Supabase URL and anon key are in .env.local and the schema has been
        run.
      </p>
    );
  }

  const user = await getOptionalUser();
  if (user) {
    redirect("/library");
  }

  return <AuthForm mode="sign-up" nextPath={nextPath} />;
}
