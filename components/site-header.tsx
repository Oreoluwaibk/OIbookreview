import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { getOptionalUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

async function AccountLink() {
  if (!isSupabaseConfigured()) {
    return (
      <Link href="/library" className="py-1 text-sm font-semibold text-lake-deep">
        Set up shelf
      </Link>
    );
  }

  const user = await getOptionalUser();

  if (!user) {
    return (
      <Link href="/login" className="py-1 text-sm font-semibold text-lake-deep">
        Sign in
      </Link>
    );
  }

  return (
    <form action={signOut} className="flex max-w-full items-center gap-3">
      <span className="max-w-28 truncate text-sm text-ink-soft sm:max-w-48">{user.displayName}</span>
      <button type="submit" className="py-1 text-sm font-semibold text-lake-deep">
        Sign out
      </button>
    </form>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper-raised">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center gap-2 text-ink">
          <Logo className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
          <span className="font-serif text-xl sm:text-2xl">Book Review</span>
        </Link>
        <nav className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 sm:w-auto sm:justify-end">
          <Link href="/search" className="py-1 text-sm font-semibold text-ink">
            Search
          </Link>
          <Link href="/study" className="py-1 text-sm font-semibold text-ink">
            Study
          </Link>
          <Link href="/library" className="py-1 text-sm font-semibold text-ink">
            Library
          </Link>
          <Suspense fallback={<span className="text-sm text-ink-soft">Account</span>}>
            <AccountLink />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
