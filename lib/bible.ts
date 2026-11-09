import { cacheLife } from "next/cache";
import { BIBLE_VERSIONS, type BibleVersion } from "@/lib/bible-versions";

export { BIBLE_VERSIONS, type BibleVersion };

export type VerseLookup = {
  reference: string;
  version: BibleVersion;
  text: string;
  attribution: string;
};

const ATTRIBUTION: Record<BibleVersion, string> = {
  KJV: "King James Version. Public domain.",
  NKJV: "New King James Version. Copyright © 1982 Thomas Nelson.",
  NLT: "New Living Translation. Copyright © 1996, 2004, 2015 Tyndale House Foundation.",
  AMP: "Amplified Bible. Copyright © 2015 The Lockman Foundation.",
  TPT: "The Passion Translation.",
};

const BOOKS: { id: number; name: string; aliases: string[] }[] = [
  { id: 1, name: "Genesis", aliases: ["genesis", "gen", "ge", "gn"] },
  { id: 2, name: "Exodus", aliases: ["exodus", "exod", "exo", "ex"] },
  { id: 3, name: "Leviticus", aliases: ["leviticus", "lev", "le"] },
  { id: 4, name: "Numbers", aliases: ["numbers", "num", "nu", "nm"] },
  { id: 5, name: "Deuteronomy", aliases: ["deuteronomy", "deut", "dt"] },
  { id: 6, name: "Joshua", aliases: ["joshua", "josh", "jos"] },
  { id: 7, name: "Judges", aliases: ["judges", "judg", "jdg"] },
  { id: 8, name: "Ruth", aliases: ["ruth", "ru"] },
  { id: 9, name: "1 Samuel", aliases: ["1 samuel", "1 sam", "1sam", "1 sa"] },
  { id: 10, name: "2 Samuel", aliases: ["2 samuel", "2 sam", "2sam", "2 sa"] },
  { id: 11, name: "1 Kings", aliases: ["1 kings", "1 kgs", "1kgs", "1 ki"] },
  { id: 12, name: "2 Kings", aliases: ["2 kings", "2 kgs", "2kgs", "2 ki"] },
  { id: 13, name: "1 Chronicles", aliases: ["1 chronicles", "1 chron", "1 chr", "1chr"] },
  { id: 14, name: "2 Chronicles", aliases: ["2 chronicles", "2 chron", "2 chr", "2chr"] },
  { id: 15, name: "Ezra", aliases: ["ezra", "ezr"] },
  { id: 16, name: "Nehemiah", aliases: ["nehemiah", "neh"] },
  { id: 17, name: "Esther", aliases: ["esther", "esth", "est"] },
  { id: 18, name: "Job", aliases: ["job"] },
  { id: 19, name: "Psalms", aliases: ["psalms", "psalm", "psa", "ps"] },
  { id: 20, name: "Proverbs", aliases: ["proverbs", "prov", "prv", "pr"] },
  { id: 21, name: "Ecclesiastes", aliases: ["ecclesiastes", "eccl", "ecc"] },
  { id: 22, name: "Song of Solomon", aliases: ["song of solomon", "song of songs", "canticles", "song", "sos"] },
  { id: 23, name: "Isaiah", aliases: ["isaiah", "isa", "is"] },
  { id: 24, name: "Jeremiah", aliases: ["jeremiah", "jer", "je"] },
  { id: 25, name: "Lamentations", aliases: ["lamentations", "lam", "la"] },
  { id: 26, name: "Ezekiel", aliases: ["ezekiel", "ezek", "eze"] },
  { id: 27, name: "Daniel", aliases: ["daniel", "dan", "da"] },
  { id: 28, name: "Hosea", aliases: ["hosea", "hos"] },
  { id: 29, name: "Joel", aliases: ["joel", "joe"] },
  { id: 30, name: "Amos", aliases: ["amos", "am"] },
  { id: 31, name: "Obadiah", aliases: ["obadiah", "obad", "ob"] },
  { id: 32, name: "Jonah", aliases: ["jonah", "jon"] },
  { id: 33, name: "Micah", aliases: ["micah", "mic"] },
  { id: 34, name: "Nahum", aliases: ["nahum", "nah"] },
  { id: 35, name: "Habakkuk", aliases: ["habakkuk", "hab"] },
  { id: 36, name: "Zephaniah", aliases: ["zephaniah", "zeph"] },
  { id: 37, name: "Haggai", aliases: ["haggai", "hag"] },
  { id: 38, name: "Zechariah", aliases: ["zechariah", "zech", "zec"] },
  { id: 39, name: "Malachi", aliases: ["malachi", "mal"] },
  { id: 40, name: "Matthew", aliases: ["matthew", "matt", "mt"] },
  { id: 41, name: "Mark", aliases: ["mark", "mrk", "mk"] },
  { id: 42, name: "Luke", aliases: ["luke", "luk", "lk"] },
  { id: 43, name: "John", aliases: ["john", "jhn", "jn"] },
  { id: 44, name: "Acts", aliases: ["acts", "act", "ac"] },
  { id: 45, name: "Romans", aliases: ["romans", "rom", "ro"] },
  { id: 46, name: "1 Corinthians", aliases: ["1 corinthians", "1 cor", "1cor"] },
  { id: 47, name: "2 Corinthians", aliases: ["2 corinthians", "2 cor", "2cor"] },
  { id: 48, name: "Galatians", aliases: ["galatians", "gal", "ga"] },
  { id: 49, name: "Ephesians", aliases: ["ephesians", "eph"] },
  { id: 50, name: "Philippians", aliases: ["philippians", "phil", "php"] },
  { id: 51, name: "Colossians", aliases: ["colossians", "col"] },
  { id: 52, name: "1 Thessalonians", aliases: ["1 thessalonians", "1 thess", "1 thes", "1th"] },
  { id: 53, name: "2 Thessalonians", aliases: ["2 thessalonians", "2 thess", "2 thes", "2th"] },
  { id: 54, name: "1 Timothy", aliases: ["1 timothy", "1 tim", "1tim"] },
  { id: 55, name: "2 Timothy", aliases: ["2 timothy", "2 tim", "2tim"] },
  { id: 56, name: "Titus", aliases: ["titus", "tit"] },
  { id: 57, name: "Philemon", aliases: ["philemon", "phlm", "phm"] },
  { id: 58, name: "Hebrews", aliases: ["hebrews", "heb"] },
  { id: 59, name: "James", aliases: ["james", "jas", "jam"] },
  { id: 60, name: "1 Peter", aliases: ["1 peter", "1 pet", "1pet"] },
  { id: 61, name: "2 Peter", aliases: ["2 peter", "2 pet", "2pet"] },
  { id: 62, name: "1 John", aliases: ["1 john", "1 jn", "1jn"] },
  { id: 63, name: "2 John", aliases: ["2 john", "2 jn", "2jn"] },
  { id: 64, name: "3 John", aliases: ["3 john", "3 jn", "3jn"] },
  { id: 65, name: "Jude", aliases: ["jude", "jud"] },
  { id: 66, name: "Revelation", aliases: ["revelation", "revelations", "rev", "re"] },
];

const ALIASES = BOOKS.flatMap((book) => book.aliases.map((alias) => ({ alias, book }))).sort(
  (left, right) => right.alias.length - left.alias.length,
);

export function isBibleVersion(value: string): value is BibleVersion {
  return (BIBLE_VERSIONS as readonly string[]).includes(value);
}

export async function lookupVerse(reference: string, version: string): Promise<VerseLookup | { error: string }> {
  if (!isBibleVersion(version)) {
    return { error: "Choose KJV, NKJV, TPT, NLT, or AMP." };
  }

  const parsed = parseReference(reference);
  if ("error" in parsed) {
    return parsed;
  }

  if (version === "TPT") {
    return {
      error: "The Passion Translation is not in the verse catalog. KJV, NKJV, NLT, and AMP can be fetched.",
    };
  }

  const text = await loadPassage(version, parsed.bookId, parsed.chapter, parsed.start, parsed.end, parsed.name);
  if (!text) {
    return { error: "That reference was not found in this version." };
  }

  const label =
    parsed.end === parsed.start
      ? `${parsed.name} ${parsed.chapter}:${parsed.start}`
      : `${parsed.name} ${parsed.chapter}:${parsed.start}-${parsed.end}`;

  return {
    reference: label,
    version,
    text,
    attribution: ATTRIBUTION[version],
  };
}

function parseReference(input: string):
  | { error: string }
  | { bookId: number; name: string; chapter: number; start: number; end: number } {
  const normalized = input
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/(\d)([a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  const match = ALIASES.find((item) => normalized.startsWith(`${item.alias} `));
  if (!match) {
    return { error: "Use a reference like John 3:16." };
  }

  const rest = normalized.slice(match.alias.length).trim();
  const parts = rest.match(/^(\d+):(\d+)(?:-(\d+))?$/);
  if (!parts) {
    return { error: "Use a reference like John 3:16 or John 3:16-18." };
  }

  const chapter = Number(parts[1]);
  const start = Number(parts[2]);
  const end = parts[3] ? Number(parts[3]) : start;
  if (chapter < 1 || start < 1 || end < start) {
    return { error: "That verse range does not read clearly." };
  }

  if (end - start > 7) {
    return { error: "Keep a passage to eight verses. Add another reference for the next part." };
  }

  return { bookId: match.book.id, name: match.book.name, chapter, start, end };
}

async function loadPassage(
  version: Exclude<BibleVersion, "TPT">,
  bookId: number,
  chapter: number,
  start: number,
  end: number,
  bookName: string,
) {
  "use cache";
  cacheLife("days");

  if (version === "KJV") {
    const fromPublicDomain = await loadKjv(bookName, chapter, start, end);
    if (fromPublicDomain) {
      return fromPublicDomain;
    }
  }

  const response = await fetch(`https://bolls.life/get-chapter/${version}/${bookId}/${chapter}/`, {
    headers: { Accept: "application/json", "User-Agent": "BookReview/0.1 (personal reading shelf)" },
  });
  if (!response.ok) {
    return null;
  }

  const rows = (await response.json()) as { verse?: number; text?: string }[];
  const pieces = rows
    .filter((row) => typeof row.verse === "number" && row.verse >= start && row.verse <= end && row.text)
    .map((row) => `${row.verse} ${cleanVerse(row.text ?? "")}`);

  return pieces.length > 0 ? pieces.join(" ") : null;
}

async function loadKjv(bookName: string, chapter: number, start: number, end: number) {
  const query = end === start ? `${bookName} ${chapter}:${start}` : `${bookName} ${chapter}:${start}-${end}`;
  const response = await fetch(`https://bible-api.com/${encodeURIComponent(query)}?translation=kjv`, {
    headers: { Accept: "application/json", "User-Agent": "BookReview/0.1 (personal reading shelf)" },
  });
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { verses?: { verse?: number; text?: string }[]; text?: string };
  const pieces = (data.verses ?? [])
    .filter((verse) => verse.text)
    .map((verse) => `${verse.verse ?? ""} ${cleanVerse(verse.text ?? "")}`.trim());

  if (pieces.length > 0) {
    return pieces.join(" ");
  }

  return data.text ? cleanVerse(data.text) : null;
}

function cleanVerse(text: string) {
  return text
    .replace(/<S>\d+<\/S>/gi, "")
    .replace(/<\/?i>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
