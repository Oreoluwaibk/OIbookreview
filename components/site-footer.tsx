import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap gap-x-5 gap-y-2 px-4 py-6 text-sm sm:px-6">
        <Link href="/privacy" className="font-semibold text-lake-deep">
          Privacy
        </Link>
        <Link href="/terms" className="font-semibold text-lake-deep">
          Terms of use
        </Link>
        <Link href="/delete" className="font-semibold text-lake-deep">
          Delete account
        </Link>
      </div>
    </footer>
  );
}
