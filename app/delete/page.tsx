import type { Metadata } from "next";
import { Suspense } from "react";
import { LegalDocumentView } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Delete account · Book Review",
  description: "What is removed when a Book Review account is deleted, and how to ask for that.",
};

export default function DeleteAccountPage() {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-3xl px-4 py-8 text-ink-soft sm:px-6">Opening the deletion notice…</main>}>
      <LegalDocumentView slug="delete" />
    </Suspense>
  );
}
