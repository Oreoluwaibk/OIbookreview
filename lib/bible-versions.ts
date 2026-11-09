export const BIBLE_VERSIONS = ["KJV", "NKJV", "TPT", "NLT", "AMP"] as const;

export type BibleVersion = (typeof BIBLE_VERSIONS)[number];
