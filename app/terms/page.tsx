import type { Metadata } from "next";
import { Suspense } from "react";
import { LegalDocumentView } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Terms of use · Book Review",
  description: "How to use the Book Review shelf, what a public review means, and what can be removed.",
};

export default function TermsPage() {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-3xl px-4 py-8 text-ink-soft sm:px-6">Opening the terms…</main>}>
      <LegalDocumentView slug="terms" />
    </Suspense>
  );
}
