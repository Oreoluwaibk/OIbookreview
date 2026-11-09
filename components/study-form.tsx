"use client";

import { useActionState, useEffect, useState } from "react";
import { publishStudy, type StudyState } from "@/app/actions/studies";
import { BIBLE_VERSIONS, type BibleVersion } from "@/lib/bible-versions";

const initialState: StudyState = {};

const fieldClass = "w-full rounded-xl border border-line bg-paper px-3 py-2 text-ink";

type Theme = "book" | "topic" | "character" | "other";

type VerseDraft = {
  id: string;
  reference: string;
  version: BibleVersion;
  text: string;
  attribution: string;
  error: string;
};

const subjectLabel: Record<Theme, string> = {
  book: "Which book",
  topic: "Topic",
  character: "Character",
  other: "What you are studying",
};

export function StudyForm({ signedIn }: { signedIn: boolean }) {
  const [state, action, pending] = useActionState(publishStudy, initialState);
  const [theme, setTheme] = useState<Theme>("book");
  const [verses, setVerses] = useState<VerseDraft[]>([blankVerse("verse-1")]);

  useEffect(() => {
    const timers = verses.map((verse, index) => {
      if (!/\d+:\d+/.test(verse.reference)) {
        return null;
      }

      return setTimeout(() => {
        void lookup(index, verse.reference, verse.version);
      }, 400);
    });

    return () => {
      for (const timer of timers) {
        if (timer) {
          clearTimeout(timer);
        }
      }
    };
  }, [verses.map((verse) => `${verse.reference}|${verse.version}`).join("||")]);

  function updateVerse(index: number, patch: Partial<VerseDraft>) {
    setVerses((current) => current.map((verse, item) => (item === index ? { ...verse, ...patch } : verse)));
  }

  async function lookup(index: number, reference: string, version: BibleVersion) {
    const response = await fetch(
      `/api/verse?reference=${encodeURIComponent(reference)}&version=${encodeURIComponent(version)}`,
    );
    const data = (await response.json()) as {
      error?: string;
      reference?: string;
      text?: string;
      attribution?: string;
    };

    setVerses((current) =>
      current.map((verse, item) => {
        if (item !== index || verse.reference !== reference || verse.version !== version) {
          return verse;
        }

        if (!response.ok || data.error) {
          return { ...verse, text: "", attribution: "", error: data.error ?? "The verse could not be fetched." };
        }

        return {
          ...verse,
          text: data.text ?? "",
          attribution: data.attribution ?? "",
          error: "",
        };
      }),
    );
  }

  const savedVerses = verses
    .filter((verse) => verse.text)
    .map((verse) => ({
      reference: verse.reference,
      version: verse.version,
      text: verse.text,
    }));

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="verses" value={JSON.stringify(savedVerses)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">
          Theme
          <select
            name="theme"
            value={theme}
            onChange={(event) => setTheme(event.target.value as Theme)}
            className={fieldClass}
          >
            <option value="book">Book review</option>
            <option value="topic">Topic review</option>
            <option value="character">Character review</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          {subjectLabel[theme]}
          <input name="subject" required maxLength={80} className={fieldClass} />
        </label>
      </div>
      {theme === "book" ? (
        <label className="grid gap-1 text-sm font-semibold">
          Chapters
          <input
            name="chapters"
            maxLength={120}
            placeholder="1–3, or 1, 5, 12"
            className={fieldClass}
          />
        </label>
      ) : null}
      {theme === "other" ? (
        <label className="grid gap-1 text-sm font-semibold">
          Name this theme
          <input name="themeLabel" required maxLength={40} placeholder="A short name for this kind of study" className={fieldClass} />
        </label>
      ) : null}
      <div className="grid gap-3">
        <p className="text-sm font-semibold">Verses</p>
        {verses.map((verse, index) => (
          <div key={verse.id} className="rounded-2xl border border-line bg-paper-raised p-4">
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm font-semibold">
                Reference
                <input
                  value={verse.reference}
                  onChange={(event) => updateVerse(index, { reference: event.target.value, text: "", error: "" })}
                  placeholder="John 3:16"
                  className={fieldClass}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {BIBLE_VERSIONS.map((version) => (
                  <button
                    key={version}
                    type="button"
                    onClick={() => updateVerse(index, { version, text: "", error: "" })}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                      verse.version === version ? "bg-lake text-white" : "bg-paper text-lake-deep"
                    }`}
                  >
                    {version}
                  </button>
                ))}
              </div>
            </div>
            {verse.error ? <p className="mt-3 text-sm text-clay">{verse.error}</p> : null}
            {verse.text ? (
              <blockquote className="mt-3 text-sm leading-6">
                <p>{verse.text}</p>
                <footer className="mt-2 text-xs text-ink-soft">{verse.attribution}</footer>
              </blockquote>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setVerses((current) => [...current, blankVerse(`verse-${current.length + 1}`)])}
          className="w-fit text-sm font-semibold text-lake-deep"
        >
          Add another verse
        </button>
      </div>
      <label className="grid gap-1 text-sm font-semibold">
        Notes
        <textarea name="notes" rows={4} className={fieldClass} />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Lesson learnt
        <textarea name="lesson" rows={3} className={fieldClass} />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        What I am going to do with it
        <textarea name="application" rows={3} className={fieldClass} />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Who can see this
        <select name="visibility" defaultValue="public" className={fieldClass}>
          <option value="public">Everyone on the app</option>
          <option value="private">Only me</option>
        </select>
      </label>
      {state.error ? <p className="text-sm text-clay">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-lake-deep">{state.message}</p> : null}
      {signedIn ? (
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-full bg-lake px-5 py-2.5 font-semibold text-white hover:bg-lake-deep disabled:opacity-60"
        >
          {pending ? "Publishing…" : "Publish study"}
        </button>
      ) : (
        <a href="/login?next=/study" className="w-fit rounded-full bg-lake px-5 py-2.5 font-semibold text-white">
          Sign in to publish
        </a>
      )}
    </form>
  );
}

function blankVerse(id: string): VerseDraft {
  return {
    id,
    reference: "",
    version: "KJV",
    text: "",
    attribution: "",
    error: "",
  };
}
