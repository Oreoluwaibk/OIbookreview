import Link from "next/link";
import { loadLegalDocument, type LegalSlug } from "@/lib/legal";

export async function LegalDocumentView({ slug }: { slug: LegalSlug }) {
  const document = await loadLegalDocument(slug);
  const updated = document.updatedAt ? formatWhen(document.updatedAt) : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-sm font-semibold tracking-wide text-clay">Book Review</p>
      <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">{document.title}</h1>
      <p className="mt-3 text-sm text-ink-soft">{updated ? `Updated ${updated}` : "This is the text that ships with the shelf."}</p>
      <article className="mt-8 grid gap-4 text-lg leading-8">
        {document.body
          .replace(/\r\n/g, "\n")
          .split(/\n{2,}/)
          .map((block) => block.trim())
          .filter(Boolean)
          .map((block, index) => {
            const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
            const first = lines[0] ?? "";
            const heading = first.length > 0 && first.length < 80 && !/[.!?]$/.test(first);
            const rest = heading ? lines.slice(1).join("\n") : block;

            return (
              <section key={`${index}-${first.slice(0, 24)}`} className="grid gap-2">
                {heading ? <h2 className="font-serif text-2xl">{first}</h2> : null}
                {rest ? <p className="whitespace-pre-wrap">{rest}</p> : null}
              </section>
            );
          })}
      </article>
      <p className="mt-10 flex flex-wrap gap-4 text-sm font-semibold">
        <Link href="/privacy" className="text-lake-deep">
          Privacy
        </Link>
        <Link href="/terms" className="text-lake-deep">
          Terms of use
        </Link>
      </p>
    </main>
  );
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
