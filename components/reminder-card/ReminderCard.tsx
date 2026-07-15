"use client";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Pet, Reminder } from "@/types/reminder";

interface ReminderCardProps {
  reminder: Reminder;
  pet?: Pet;
  onToggleComplete: (reminder: Reminder) => void;
  onClick: (reminder: Reminder) => void;
}

export function ReminderCard({
  reminder,
  pet,
  onToggleComplete,
  onClick,
}: ReminderCardProps) {
  const isCompleted = reminder.status === "completed";
  const hasNotes = !!reminder.notes?.trim();

  const [notesOpen, setNotesOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const notesBtnRef = useRef<HTMLButtonElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    if (!notesOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        notesBtnRef.current &&
        !notesBtnRef.current.contains(e.target as Node)
      ) {
        setNotesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notesOpen]);

  function handleCardClick() {
    if (notesOpen) return; // don't toggle when popup is open
    onToggleComplete({
      ...reminder,
      status: isCompleted ? "pending" : "completed",
    });
  }

  function handleEditClick(e: React.MouseEvent) {
    e.stopPropagation();
    onClick(reminder);
  }

  function handleNotesClick(e: React.MouseEvent) {
    e.stopPropagation();
    setNotesOpen((prev) => !prev);
  }

  return (
    <div className="relative">
      <div
        onClick={handleCardClick}
        className={clsx(
          "group flex items-center justify-between rounded-card border p-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow",
          isCompleted
            ? "bg-surfaceMuted border-transparent opacity-80"
            : "bg-surface border-border"
        )}
      >
        {/* Content Area */}
        <div className="flex flex-1 flex-col items-start gap-1.5 text-left select-none min-w-0">
          {/* Title Row: title + optional notes icon */}
          <div className="flex items-center gap-1.5 w-full min-w-0">
            <span
              className={clsx(
                "text-sm font-bold transition-all truncate",
                isCompleted
                  ? "text-textSecondary line-through lowercase font-semibold"
                  : "text-textPrimary"
              )}
            >
              {reminder.title}
            </span>

            {hasNotes && (
              <button
                ref={notesBtnRef}
                onClick={handleNotesClick}
                aria-label="View note"
                className={clsx(
                  "shrink-0 flex items-center justify-center h-5 w-5 rounded-md transition-all duration-200 focus:outline-none",
                  notesOpen
                    ? "bg-[#121212] text-white"
                    : "bg-black/8 text-textSecondary hover:bg-[#121212] hover:text-white"
                )}
              >
                {/* Solid document / note icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z"
                    clipRule="evenodd"
                  />
                  <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                </svg>
              </button>
            )}
          </div>

          {/* Details Row */}
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] font-medium text-textSecondary">
            {/* Pet Indicator */}
            <span className="flex items-center gap-1">
              <svg
                className="h-3.5 w-3.5 text-textSecondary"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 4.5 1-1 3-2.5 3-4.5 0-1.66-1.34-3-3-3zm-4.5-2c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S6 9.67 6 10.5s.67 1.5 1.5 1.5zm9 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-6-3c.83 0 1.5-.67 1.5-1.5S11.33 6 10.5 6 9 6.67 9 7.5 9.67 9 10.5 9zm3 0c.83 0 1.5-.67 1.5-1.5S14.33 6 13.5 6s-1.5.67-1.5 1.5.67 1.5 1.5 1.5z" />
              </svg>
              For {pet?.name ?? "Pet"}
            </span>

            {/* Time Indicator */}
            <span className="flex items-center gap-1">
              <svg
                className="h-3.5 w-3.5 text-textSecondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              At {formatTime(reminder.time)}
            </span>

            {/* Frequency Indicator */}
            <span className="flex items-center gap-1">
              <svg
                className="h-3.5 w-3.5 text-textSecondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              {reminder.frequency}
            </span>
          </div>
        </div>

        {/* Right Action Area */}
        <div className="ml-3 flex items-center justify-center shrink-0">
          {isCompleted ? (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#121212] text-white shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 stroke-[3px]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <button
              onClick={handleEditClick}
              aria-label="Edit reminder"
              className="flex h-7 w-7 items-center justify-center rounded-full text-textSecondary hover:bg-black/5 hover:text-textPrimary transition-colors focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 stroke-[2.5px]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Notes Popup */}
      {hasNotes && notesOpen && (
        <div
          ref={popupRef}
          role="dialog"
          aria-label="Reminder note"
          className="notes-popup absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl bg-[#1a1a1a] shadow-2xl"
          style={{ animation: "notesPopIn 0.22s cubic-bezier(0.16,1,0.3,1) forwards" }}
        >
          {/* Dark header bar */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/40">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z"
                  clipRule="evenodd"
                />
              </svg>
              <span>note</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setNotesOpen(false); }}
              className="flex h-5 w-5 items-center justify-center rounded-full text-white/30 hover:text-white/70 transition-colors focus:outline-none"
              aria-label="Close note"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Note content */}
          <p className="px-4 pb-4 text-sm font-medium leading-relaxed text-white/85">
            {reminder.notes}
          </p>
        </div>
      )}
    </div>
  );
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")}${period}`;
}
