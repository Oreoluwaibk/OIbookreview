"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const tabs = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/study", label: "Study" },
  { href: "/library", label: "Library" },
  { href: "/profile", label: "You" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    function onFocusIn(event: FocusEvent) {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        setHidden(true);
      }
    }

    function onFocusOut() {
      setHidden(false);
    }

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return (
    <nav
      aria-label="App"
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper-raised pb-[env(safe-area-inset-bottom)] md:hidden ${
        hidden ? "hidden" : ""
      }`}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                  active ? "text-lake-deep" : "text-ink-soft"
                }`}
              >
                <TabIcon name={tab.label} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TabIcon({ name }: { name: string }) {
  const className = "h-5 w-5";
  if (name === "Home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "Search") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="6" />
        <path d="M16 16.5 20 20.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "Study") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 5.5h9.5A2.5 2.5 0 0 1 18 8v11H8.5A2.5 2.5 0 0 0 6 21.5V5.5Z" strokeLinejoin="round" />
        <path d="M6 5.5A2.5 2.5 0 0 1 8.5 3H18" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "Library") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 4.5h4.5v15H5a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1ZM9.5 4.5H14v15H9.5V4.5ZM14 7h5a1 1 0 0 1 1 1v10.5a1 1 0 0 1-1 1h-5V7Z" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 19.2a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />
    </svg>
  );
}
