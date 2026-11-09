import Link from "next/link";

export default function BookNotFound() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-serif text-3xl sm:text-4xl">That book is not in the catalog</h1>
      <p className="mt-3 text-ink-soft">Try the title, the author, or the ISBN.</p>
      <Link href="/search" className="mt-6 inline-block font-semibold text-lake-deep">
        Back to search
      </Link>
    </main>
  );
}
