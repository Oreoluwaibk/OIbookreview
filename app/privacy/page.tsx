import type { Metadata } from "next";
import { Suspense } from "react";
import { LegalDocumentView } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Privacy · Book Review",
  description: "What Book Review keeps, what stays on your shelf, and what a published review shows.",
};

export default function PrivacyPage() {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-3xl px-4 py-8 text-ink-soft sm:px-6">Opening the privacy notice…</main>}>
      <LegalDocumentView slug="privacy" />
    </Suspense>
  );
}
