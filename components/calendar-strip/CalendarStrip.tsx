"use client";
import { useMemo } from "react";
import {
  addDays,
  format,
  isSameDay,
  isToday,
  startOfWeek,
} from "date-fns";
import clsx from "clsx";

interface CalendarStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  /** Dates (yyyy-MM-dd) that had all reminders completed, for the streak highlight */
  streakDates?: string[];
}

export function CalendarStrip({
  selectedDate,
  onSelectDate,
  streakDates = [],
}: CalendarStripProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Generate a mock streak of 3 days prior to today if streakDates is empty
  const activeStreakDates = useMemo(() => {
    if (streakDates.length > 0) return streakDates;
    const today = new Date();
    return [
      format(addDays(today, -2), "yyyy-MM-dd"),
      format(addDays(today, -3), "yyyy-MM-dd"),
      format(addDays(today, -4), "yyyy-MM-dd"),
    ];
  }, [streakDates]);

  return (
    <div className="rounded-card bg-accent p-4 shadow-sm text-white relative overflow-hidden">
      {/* Streaks Header */}
      <div className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/80">
        <span>⚡</span>
        <span>your streaks</span>
      </div>

      {/* Month Centered */}
      <div className="mb-4 flex justify-center">
        <span className="text-sm font-bold text-black lowercase">
          {format(selectedDate, "MMMM yyyy")}
        </span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 items-center justify-items-center">
        {days.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const dateStr = format(day, "yyyy-MM-dd");
          const hasStreak = activeStreakDates.includes(dateStr);

          // Check if previous/next days also have streaks for rendering connection lines
          const prevDayStr = format(addDays(day, -1), "yyyy-MM-dd");
          const nextDayStr = format(addDays(day, 1), "yyyy-MM-dd");
          const hasLeftStreak = activeStreakDates.includes(prevDayStr) && idx > 0;
          const hasRightStreak = activeStreakDates.includes(nextDayStr) && idx < 6;

          if (isSelected) {
            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className="relative flex h-[72px] w-[36px] flex-col items-center justify-between rounded-full bg-black/15 py-2.5 text-black focus:outline-none"
              >
                {/* Top dot */}
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {/* Bottom day number */}
                <span className="text-sm font-bold">{format(day, "d")}</span>
              </button>
            );
          }

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className="relative flex h-[72px] w-full flex-col items-center justify-between pb-0.5 text-center focus:outline-none"
            >
              {/* Day Header */}
              <span className="text-[11px] font-bold text-black/60">
                {format(day, "EE").slice(0, 2)}
              </span>

              {/* Day Number Circle */}
              <span
                className={clsx(
                  "relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all",
                  hasStreak
                    ? "bg-[#D4FF5F] text-[#121212] shadow-sm"
                    : "bg-white/20 text-white hover:bg-white/30"
                )}
              >
                {format(day, "d")}
              </span>

              {/* Left Connector Line */}
              {hasStreak && hasLeftStreak && (
                <div className="absolute left-0 right-1/2 top-[54px] h-[3px] -translate-y-1/2 bg-[#D4FF5F] z-0" />
              )}
              {/* Right Connector Line */}
              {hasStreak && hasRightStreak && (
                <div className="absolute left-1/2 right-0 top-[54px] h-[3px] -translate-y-1/2 bg-[#D4FF5F] z-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Downward Chevron */}
      <div className="mt-2.5 flex justify-center text-white/80">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 stroke-[3px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
