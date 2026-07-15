"use client";
import clsx from "clsx";

interface BottomNavProps {
  active?: string;
}

export function BottomNav({ active = "reminders" }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-center justify-around border-t border-border bg-surface px-4 py-3 shadow-lg">
      {/* Home Tab */}
      <button
        aria-label="Home"
        className={clsx(
          "flex items-center justify-center p-2 rounded-full focus:outline-none transition-colors",
          active === "home" ? "text-textPrimary" : "text-textSecondary hover:text-textPrimary"
        )}
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </button>

      {/* Favorites Tab */}
      <button
        aria-label="Favorites"
        className={clsx(
          "flex items-center justify-center p-2 rounded-full focus:outline-none transition-colors",
          active === "favorites" ? "text-textPrimary" : "text-textSecondary hover:text-textPrimary"
        )}
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      </button>

      {/* Active Reminders Tab */}
      <button
        aria-label="Reminders"
        className={clsx(
          "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold lowercase transition-all focus:outline-none",
          active === "reminders"
            ? "bg-[#121212] text-white shadow-sm"
            : "text-textSecondary hover:text-textPrimary"
        )}
      >
        <svg
          className="h-4.5 w-4.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <rect x="3" y="3" width="6" height="6" rx="1.5" />
          <rect x="15" y="3" width="6" height="6" rx="1.5" />
          <rect x="3" y="15" width="6" height="6" rx="1.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m14 17 2.5 2.5 4.5-4.5" />
        </svg>
        <span>reminders</span>
      </button>

      {/* Profile/Diary Tab */}
      <button
        aria-label="Diary"
        className={clsx(
          "flex items-center justify-center p-2 rounded-full focus:outline-none transition-colors",
          active === "diary" ? "text-textPrimary" : "text-textSecondary hover:text-textPrimary"
        )}
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5V15a2 2 0 0 1 2-2h14" />
          <path d="M20 21V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z" />
          <path d="M12 11V7" />
        </svg>
      </button>
    </nav>
  );
}
