"use client";

export function ThemeToggle() {
  return (
    <button
      type="button"
      aria-label="Switch color mode"
      onClick={() => {
        const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
        document.documentElement.classList.toggle("dark", next === "dark");
        localStorage.setItem("theme", next);
        document.querySelector('meta[name="theme-color"]')?.setAttribute(
          "content",
          next === "dark" ? "#141a22" : "#f3eee4",
        );
      }}
      className="grid h-10 w-10 place-items-center rounded-full border border-line bg-paper text-ink"
    >
      <MoonIcon className="h-5 w-5 dark:hidden" />
      <SunIcon className="hidden h-5 w-5 dark:block" />
    </button>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16.5 13.5A6.5 6.5 0 0 1 10 4.2 7 7 0 1 0 19.8 14a6.5 6.5 0 0 1-3.3-.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" strokeLinecap="round" />
    </svg>
  );
}
