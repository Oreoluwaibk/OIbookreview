import type { BookPreview } from "@/lib/preview";

export function BookPreviewView({
  preview,
  catalogDescription,
}: {
  preview: BookPreview;
  catalogDescription: string | null;
}) {
  return (
    <section className="rounded-3xl bg-lake-soft p-4 sm:p-6">
      <h2 className="font-serif text-2xl">Preview</h2>
      <p className="mt-2 max-w-3xl text-sm text-ink-soft">
        {preview.source === "ai"
          ? "An AI preview from the catalog record. It leaves out the ending, so you can know the book before you read it."
          : "From the catalog, so you can know this book before you read it. The ending stays out."}
      </p>
      {preview.about ? (
        <PreviewPart label="What it's about" text={preview.about} />
      ) : (
        <p className="mt-4 text-ink-soft">The catalog has no description for this book yet.</p>
      )}
      {preview.like ? <PreviewPart label="What it's like" text={preview.like} /> : null}
      {preview.forReaders ? <PreviewPart label="Who it's for" text={preview.forReaders} /> : null}
      {preview.skip ? <PreviewPart label="Who should skip it" text={preview.skip} /> : null}
      {preview.facts.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-2">
          {preview.facts.map((fact) => (
            <li key={fact} className="rounded-full bg-paper-raised px-3 py-1 text-sm text-lake-deep">
              {fact}
            </li>
          ))}
        </ul>
      ) : null}
      {preview.source === "ai" && catalogDescription ? (
        <details className="mt-5">
          <summary className="cursor-pointer text-sm font-semibold">Publisher description</summary>
          <p className="mt-2 max-w-3xl whitespace-pre-wrap leading-7">{catalogDescription}</p>
        </details>
      ) : null}
    </section>
  );
}

function PreviewPart({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-5 max-w-3xl">
      <h3 className="font-semibold">{label}</h3>
      <p className="mt-1 whitespace-pre-wrap leading-7">{text}</p>
    </div>
  );
}
