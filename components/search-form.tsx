export function SearchForm({ defaultQuery = "" }: { defaultQuery?: string }) {
  return (
    <form action="/search" className="flex w-full flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor="q">
        Search books
      </label>
      <input
        id="q"
        name="q"
        defaultValue={defaultQuery}
        placeholder="Title, author, or ISBN"
        className="w-full rounded-full border border-line bg-paper-raised px-5 py-3 text-base text-ink placeholder:text-ink-soft"
      />
      <button
        type="submit"
        className="w-full rounded-full bg-lake px-6 py-3 font-semibold text-white hover:bg-lake-deep sm:w-auto"
      >
        Search
      </button>
    </form>
  );
}
