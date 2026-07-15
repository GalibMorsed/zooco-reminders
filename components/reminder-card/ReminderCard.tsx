"use client";
import clsx from "clsx";
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

  function handleCardClick() {
    onToggleComplete({
      ...reminder,
      status: isCompleted ? "pending" : "completed",
    });
  }

  function handleEditClick(e: React.MouseEvent) {
    e.stopPropagation(); // Prevent toggling completion
    onClick(reminder);
  }

  return (
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
      <div className="flex flex-1 flex-col items-start gap-1.5 text-left select-none">
        {/* Title */}
        <span
          className={clsx(
            "text-sm font-bold transition-all",
            isCompleted
              ? "text-textSecondary line-through lowercase font-semibold"
              : "text-textPrimary"
          )}
        >
          {reminder.title}
        </span>

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
              className="h-4.5 w-4.5 stroke-[2.5px]"
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
  );
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")}${period}`;
}
