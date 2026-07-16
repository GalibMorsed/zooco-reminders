"use client";
import { useMemo, useState } from "react";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import clsx from "clsx";

interface CalendarStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  /** Dates (yyyy-MM-dd) that had all reminders completed, for the streak highlight */
  streakDates?: string[];
}

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function CalendarStrip({
  selectedDate,
  onSelectDate,
  streakDates = [],
}: CalendarStripProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Current week days (Mon → Sun)
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Full month grid days (padded to start on Monday)
  const monthDays = useMemo(() => {
    const mStart = startOfMonth(selectedDate);
    const mEnd = endOfMonth(selectedDate);
    const gridStart = startOfWeek(mStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(mEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [selectedDate]);

  
  const activeStreakDates = useMemo(() => {
    return streakDates;
  }, [streakDates]);

  const streakCount = activeStreakDates.length;

  const days = isExpanded ? monthDays : weekDays;

  // Render a single day cell — shared between week and month views
  function DayCell({ day, idx, totalInRow }: { day: Date; idx: number; totalInRow: number }) {
    const isSelected = isSameDay(day, selectedDate);
    const dateStr = format(day, "yyyy-MM-dd");
    const hasStreak = activeStreakDates.includes(dateStr);
    const isCurrentMonth = isSameMonth(day, selectedDate);

    const prevDayStr = format(addDays(day, -1), "yyyy-MM-dd");
    const nextDayStr = format(addDays(day, 1), "yyyy-MM-dd");
    const colIdx = idx % 7;
    const hasLeftStreak = activeStreakDates.includes(prevDayStr) && colIdx > 0;
    const hasRightStreak = activeStreakDates.includes(nextDayStr) && colIdx < 6;

    if (isSelected) {
      return (
        <button
          key={day.toISOString()}
          onClick={() => onSelectDate(day)}
          className="relative flex h-[64px] w-[36px] mx-auto flex-col items-center justify-between rounded-full bg-black/20 py-2 focus:outline-none"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
          <span className="text-sm font-extrabold text-white">{format(day, "d")}</span>
        </button>
      );
    }

    return (
      <button
        key={day.toISOString()}
        onClick={() => onSelectDate(day)}
        className="relative flex h-[64px] w-full flex-col items-center justify-between pb-1 text-center focus:outline-none"
      >
        {/* Day label — only show in week view, hidden in month view */}
        {!isExpanded && (
          <span className="text-[10px] font-bold text-black/50">
            {format(day, "EE").slice(0, 2)}
          </span>
        )}
        {isExpanded && <span className="h-2" />}

        {/* Day number circle */}
        <span
          className={clsx(
            "relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-200",
            !isCurrentMonth && "opacity-30",
            hasStreak && isCurrentMonth
              ? "bg-[#D4FF5F] text-[#1a1a1a] shadow-sm"
              : isCurrentMonth
              ? isToday(day)
                ? "bg-white/40 text-white ring-2 ring-white/60"
                : "bg-white/15 text-white hover:bg-white/25"
              : "bg-white/10 text-white/40"
          )}
        >
          {format(day, "d")}
        </span>

        {/* Connector lines between streak days */}
        {hasStreak && isCurrentMonth && hasLeftStreak && (
          <div className="absolute left-0 right-1/2 top-[46px] h-[3px] -translate-y-1/2 bg-[#D4FF5F] z-0" />
        )}
        {hasStreak && isCurrentMonth && hasRightStreak && (
          <div className="absolute left-1/2 right-0 top-[46px] h-[3px] -translate-y-1/2 bg-[#D4FF5F] z-0" />
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">

      {/* ── Streaks Header Row ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-textSecondary lowercase select-none">
          {/* Lightning bolt SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-textSecondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
          </svg>
          <span>your streaks</span>
        </div>

        {/* Streak count badge */}
        {streakCount > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-[#D4FF5F] px-2.5 py-0.5 text-[11px] font-extrabold text-[#1a1a1a] shadow-sm">
            <span>🔥</span>
            <span>{streakCount} day{streakCount !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* ── Calendar Card ── */}
      <div className="rounded-card bg-accent shadow-sm relative overflow-hidden">

        {/* Month / Week nav row */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <button
            onClick={() => onSelectDate(addDays(isExpanded ? startOfMonth(selectedDate) : weekStart, -1))}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/10 text-black/60 transition-colors focus:outline-none"
            aria-label="Previous"
          >
            <svg className="h-4 w-4 stroke-[3px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <span className="text-sm font-extrabold text-black lowercase tracking-wide">
            {isExpanded
              ? format(selectedDate, "MMMM yyyy")
              : format(selectedDate, "MMMM yyyy")}
          </span>

          <button
            onClick={() => onSelectDate(addDays(isExpanded ? endOfMonth(selectedDate) : addDays(weekStart, 6), 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/10 text-black/60 transition-colors focus:outline-none"
            aria-label="Next"
          >
            <svg className="h-4 w-4 stroke-[3px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Day-of-week header labels (only in month view) */}
        {isExpanded && (
          <div className="grid grid-cols-7 gap-0 px-3 pb-1">
            {DAY_LABELS.map((label) => (
              <span
                key={label}
                className="text-center text-[9px] font-extrabold uppercase tracking-widest text-black/40"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Day Grid */}
        <div
          key={isExpanded ? "month" : "week"}
          className={clsx(
            "grid grid-cols-7 px-3 pb-2",
            isExpanded ? "gap-y-1 animate-expand-down" : "gap-1 items-center justify-items-center"
          )}
        >
          {days.map((day, idx) => (
            <DayCell key={day.toISOString()} day={day} idx={idx} totalInRow={days.length} />
          ))}
        </div>

        {/* Toggle Chevron Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Collapse to week view" : "Expand to month view"}
          className="flex w-full items-center justify-center gap-1.5 py-2.5 focus:outline-none group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={clsx(
              "h-4 w-4 stroke-[3px] text-white/70 transition-transform duration-300 ease-in-out group-hover:text-white",
              isExpanded ? "rotate-180" : "rotate-0"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-[10px] font-bold text-white/60 group-hover:text-white/80 transition-colors lowercase tracking-wide">
            {isExpanded ? "week view" : "month view"}
          </span>
        </button>
      </div>
    </div>
  );
}
