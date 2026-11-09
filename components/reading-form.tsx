"use client";

import { useActionState } from "react";
import { saveReading, type ReadingState } from "@/app/actions/readings";
import type { EditionHit } from "@/lib/open-library";

const initialState: ReadingState = {};

const fieldClass =
  "w-full rounded-xl border border-line bg-paper px-3 py-2 text-ink";

export function ReadingForm({
  workId,
  editions,
}: {
  workId: string;
  editions: EditionHit[];
}) {
  const [state, action, pending] = useActionState(saveReading, initialState);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="workId" value={workId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">
          Status
          <select name="status" defaultValue="want" className={fieldClass}>
            <option value="want">Want to read</option>
            <option value="reading">Reading</option>
            <option value="finished">Finished</option>
            <option value="stopped">Stopped</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Format
          <select name="format" defaultValue="print" className={fieldClass}>
            <option value="print">Print</option>
            <option value="ebook">Ebook</option>
            <option value="audio">Audio</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          How far you got
          <input
            name="progress"
            inputMode="numeric"
            placeholder="0–100"
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Where the copy came from
          <select name="copySource" defaultValue="" className={fieldClass}>
            <option value="">Not noted</option>
            <option value="bought">Bought</option>
            <option value="library">Library</option>
            <option value="advance">Advance copy</option>
          </select>
        </label>
      </div>
      {editions.length > 0 ? (
        <label className="grid gap-1 text-sm font-semibold">
          Edition
          <select name="editionKey" defaultValue="" className={fieldClass}>
            <option value="">Any edition</option>
            {editions.map((edition) => (
              <option key={edition.key} value={edition.key}>
                {[
                  edition.publishYear,
                  edition.publisher,
                  edition.translator ? `tr. ${edition.translator}` : null,
                  edition.isbn13,
                ]
                  .filter(Boolean)
                  .join(" · ") || edition.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="newReading" />
        Save this as a new reading, beside the earlier one
      </label>
      {state.error ? <p className="text-sm text-clay">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-lake-deep">{state.message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-lake px-5 py-2.5 font-semibold text-white hover:bg-lake-deep disabled:opacity-60"
      >
        {pending ? "Saving…" : "Keep on my shelf"}
      </button>
    </form>
  );
}
