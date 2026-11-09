import Link from "next/link";
import { SearchForm } from "@/components/search-form";

const starters = [
  "The Left Hand of Darkness",
  "Pachinko",
  "The Warmth of Other Suns",
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:gap-12 sm:px-6 sm:py-14">
      <section className="max-w-2xl">
        <p className="text-sm font-semibold tracking-wide text-clay">A warm shelf</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          A place to remember what you read.
        </h1>
        <p className="mt-4 text-lg leading-8 text-ink-soft">
          Search the catalog and read a preview before you commit to the book.
          Keep each reading with its edition and how far you got. A review you publish
          is public: the next reader who searches that book sees the lesson, and what you are going to do with it.
        </p>
        <div className="mt-8">
          <SearchForm />
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          Try{" "}
          {starters.map((title, index) => (
            <span key={title}>
              {index > 0 ? (index === starters.length - 1 ? ", or " : ", ") : null}
              <Link
                href={`/search?q=${encodeURIComponent(title)}`}
                className="font-semibold text-lake-deep"
              >
                {title}
              </Link>
            </span>
          ))}
          .
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          For Scripture, open a{" "}
          <Link href="/study" className="font-semibold text-lake-deep">
            study
          </Link>
          . You can keep a study private, or share it with anyone studying the same theme and subject.
        </p>
      </section>

      <section className="rounded-3xl border border-line bg-paper-raised p-5 sm:p-8">
        <h2 className="font-serif text-2xl">How the shelf works</h2>
        <ol className="mt-6 grid gap-5">
          <li className="grid grid-cols-[auto_1fr] gap-4">
            <span className="font-serif text-lake">01</span>
            <p>
              <span className="font-semibold">Find the book.</span>{" "}
              <span className="text-ink-soft">
                Search by title, author, or ISBN. The page names the edition when the catalog has it.
              </span>
            </p>
          </li>
          <li className="grid grid-cols-[auto_1fr] gap-4">
            <span className="font-serif text-lake">02</span>
            <p>
              <span className="font-semibold">Keep your place.</span>{" "}
              <span className="text-ink-soft">
                Want to read, reading, finished, or stopped. Format, progress, and whether the copy was bought, borrowed, or an advance.
              </span>
            </p>
          </li>
          <li className="grid grid-cols-[auto_1fr] gap-4">
            <span className="font-serif text-lake">03</span>
            <p>
              <span className="font-semibold">Remember it, then share it.</span>{" "}
              <span className="text-ink-soft">
                A public review stays with the book, so the next person who searches for it can use what you found.
              </span>
            </p>
          </li>
        </ol>
      </section>
    </main>
  );
}
