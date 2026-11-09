"use client";

import { useActionState, useState } from "react";
import { publishReview, type ReviewState } from "@/app/actions/reviews";

const initialState: ReviewState = {};

const fieldClass =
  "w-full rounded-xl border border-line bg-paper px-3 py-2 text-ink";

export function ReviewForm({ workId, chapters = [] }: { workId: string; chapters?: string[] }) {
  const [state, action, pending] = useActionState(publishReview, initialState);
  const [scope, setScope] = useState<"book" | "chapter">("book");

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="workId" value={workId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">
          What this review covers
          <select
            name="scope"
            value={scope}
            onChange={(event) => setScope(event.target.value === "chapter" ? "chapter" : "book")}
            className={fieldClass}
          >
            <option value="book">The whole book</option>
            <option value="chapter">One chapter</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Stars, if you want them
          <select name="stars" defaultValue="" className={fieldClass}>
            <option value="">No star rating</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </label>
      </div>
      {scope === "chapter" ? (
        <label className="grid gap-1 text-sm font-semibold">
          Chapter
          <input
            name="chapterLabel"
            required
            maxLength={80}
            list={chapters.length > 0 ? "review-chapters" : undefined}
            placeholder="Chapter 4, or the chapter title"
            className={fieldClass}
          />
          {chapters.length > 0 ? (
            <datalist id="review-chapters">
              {chapters.map((chapter, index) => (
                <option key={`${chapter}-${index}`} value={chapter.slice(0, 80)} />
              ))}
            </datalist>
          ) : null}
        </label>
      ) : null}
      <TextField name="lesson" label="Lesson learnt" />
      <TextField name="application" label="What I am going to do with it" />
      <TextField name="whoItsFor" label="Who it is for" />
      <TextField name="observation" label="One concrete observation from the book" optional />
      {state.error ? <p className="text-sm text-clay">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-lake-deep">{state.message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-lake px-5 py-2.5 font-semibold text-white hover:bg-lake-deep disabled:opacity-60"
      >
        {pending ? "Publishing…" : "Publish review"}
      </button>
    </form>
  );
}

function TextField({
  name,
  label,
  optional = false,
}: {
  name: string;
  label: string;
  optional?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      {label}
      <textarea name={name} required={!optional} rows={3} className={fieldClass} />
    </label>
  );
}
