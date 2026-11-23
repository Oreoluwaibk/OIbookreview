"use client";

import { useEffect, useState } from "react";
import { saveGrowthSnapshot } from "@/app/actions/profile";

export function GrowthSaver() {
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    saveGrowthSnapshot().then((result) => {
      if (!cancel && result.error) {
        setNote(result.error);
      }
    });
    return () => {
      cancel = true;
    };
  }, []);

  if (!note) {
    return null;
  }

  return <p className="text-sm text-clay">{note}</p>;
}
