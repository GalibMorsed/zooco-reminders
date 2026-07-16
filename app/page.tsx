"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { api } from "@/lib/api-client";
import { useReminderStore } from "@/lib/store";
import { CalendarStrip } from "@/components/calendar-strip/CalendarStrip";
import { Filters } from "@/components/filters/Filters";
import { ReminderCard } from "@/components/reminder-card/ReminderCard";
import { ReminderForm } from "@/components/reminder-form/ReminderForm";
import { Sheet } from "@/components/ui/Sheet";
import { BottomNav } from "@/components/ui/BottomNav";
import { Reminder, ReminderInput, TimeSlot } from "@/types/reminder";

function getSlot(time: string): TimeSlot {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function getDayFromDateString(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

function isReminderVisibleOnDate(reminder: Reminder, date: Date): boolean {
  const selectedDate = format(date, "yyyy-MM-dd");

  if (selectedDate < reminder.start_date) return false;
  if (reminder.end_date && selectedDate > reminder.end_date) return false;

  if (reminder.frequency === "Once") return selectedDate === reminder.start_date;
  if (reminder.frequency === "Weekdays") {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  }
  if (reminder.frequency === "Weekly") {
    return date.getDay() === getDayFromDateString(reminder.start_date);
  }

  return true;
}

function withStatusForDate(reminder: Reminder, dateKey: string): Reminder {
  return {
    ...reminder,
    status: reminder.completion_dates?.includes(dateKey) ? "completed" : "pending",
  };
}

function getCurrentStreakDates(reminders: Reminder[]) {
  const completedDates = new Set(reminders.flatMap((r) => r.completion_dates ?? []));
  const cursor = new Date();
  const streakDates: string[] = [];

  while (completedDates.has(format(cursor, "yyyy-MM-dd"))) {
    streakDates.push(format(cursor, "yyyy-MM-dd"));
    cursor.setDate(cursor.getDate() - 1);
  }

  return streakDates;
}

export default function ReminderOverviewPage() {
  const {
    pets,
    reminders,
    selectedPetId,
    selectedCategory,
    isLoading,
    error,
    setPets,
    setReminders,
    setSelectedPetId,
    setSelectedCategory,
    setLoading,
    setError,
    upsertReminder,
    removeReminder,
  } = useReminderStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    if (typeof window !== "undefined" && navigator.onLine) {
      void api.syncOfflineQueue().then(() => loadData()).catch(() => undefined);
    }

    function handleOnline() {
      setIsOnline(true);
      void api.syncOfflineQueue().then(() => loadData()).catch(() => undefined);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPetId, selectedCategory]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [petsData, remindersData] = await Promise.all([
        pets.length ? Promise.resolve(pets) : api.getPets(),
        api.getReminders({
          petId: selectedPetId ?? undefined,
          category: selectedCategory ?? undefined,
        }),
      ]);
      setPets(petsData);
      setReminders(remindersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reminders.");
    } finally {
      setLoading(false);
    }
  }

  function openAddSheet() {
    setEditingReminder(null);
    setIsSheetOpen(true);
  }

  function openEditSheet(reminder: Reminder) {
    setEditingReminder(reminder);
    setIsSheetOpen(true);
  }

  function handleViewAll() {
    setSelectedPetId(null);
    setSelectedCategory(null);
    setShowFilters(false);
  }

  async function handleSave(input: ReminderInput) {
    if (editingReminder) {
      const updated = await api.updateReminder(editingReminder.id, input);
      upsertReminder(updated);
    } else {
      const created = await api.createReminder(input);
      upsertReminder(created);
    }
    setIsSheetOpen(false);
  }

  async function handleDelete() {
    if (!editingReminder) return;
    await api.deleteReminder(editingReminder.id);
    removeReminder(editingReminder.id);
    setIsSheetOpen(false);
  }

  async function handleToggleComplete(reminder: Reminder) {
    const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
    const completionDates = new Set(reminder.completion_dates ?? []);
    if (reminder.status === "completed") {
      completionDates.add(selectedDateKey);
    } else {
      completionDates.delete(selectedDateKey);
    }

    upsertReminder({
      ...reminder,
      completion_dates: Array.from(completionDates),
    });
    try {
      const updated = await api.updateReminder(reminder.id, {
        status: reminder.status,
        completed_on: selectedDateKey,
      });
      upsertReminder(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update reminder.");
      void loadData();
    }
  }

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const streakDates = getCurrentStreakDates(reminders);
  const visibleReminders = reminders
    .filter((r) => isReminderVisibleOnDate(r, selectedDate))
    .map((r) => withStatusForDate(r, selectedDateKey));
  const completed = visibleReminders.filter((r) => r.status === "completed");
  const pending = visibleReminders.filter((r) => r.status === "pending");

  const pendingRoutine = pending.filter((r) => r.frequency !== "Once");
  const pendingOneTime = pending.filter((r) => r.frequency === "Once");

  const slots: TimeSlot[] = ["Morning", "Afternoon", "Evening"];
  const routineGroups = slots
    .map((slot) => ({
      slot,
      reminders: pendingRoutine.filter((r) => getSlot(r.time) === slot),
    }))
    .filter((g) => g.reminders.length > 0);

  return (
    <main className="flex flex-col gap-6 px-4 pt-6 pb-28">
      {/* Top Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-textPrimary lowercase">daily reminders</h1>
        <button
          type="button"
          onClick={handleViewAll}
          className="text-sm font-semibold text-textSecondary hover:text-textPrimary transition-colors lowercase"
        >
          view all
        </button>
      </header>

      {!isOnline && (
        <div className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-textSecondary shadow-sm">
          Offline mode: changes will sync when your connection returns.
        </div>
      )}

      {/* Streaks Strip */}
      <section>
        <CalendarStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          streakDates={streakDates}
        />
      </section>

      {/* Filter Toggle & Section */}
      {showFilters && (
        <section className="flex flex-col gap-2 rounded-xl bg-surface border border-border p-3 shadow-sm transition-all duration-300">
          <Filters
            pets={pets}
            selectedPetId={selectedPetId}
            selectedCategory={selectedCategory}
            onSelectPet={setSelectedPetId}
            onSelectCategory={setSelectedCategory}
          />
        </section>
      )}

      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      {isLoading && <p className="text-sm text-textSecondary animate-pulse">Loading reminders...</p>}

      {/* Empty state */}
      {!isLoading && visibleReminders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-textSecondary">
            {reminders.length === 0
              ? "no reminders yet — tap + to add your first one."
              : "no reminders scheduled for this date."}
          </p>
        </div>
      )}

      {/* Reminders List */}
      {!isLoading && visibleReminders.length > 0 && (
        <div className="flex flex-col gap-6">
          {/* 1. Pending Routine Reminders grouped by time slots */}
          {routineGroups.map((group, idx) => (
            <section key={group.slot} className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-textSecondary flex items-center gap-1.5 lowercase">
                  <span>
                    {group.slot === "Morning" ? "☀️" : group.slot === "Afternoon" ? "🌤️" : "🌙"}
                  </span>
                  <span>{group.slot.toLowerCase()}</span>
                </span>

                {/* Sliders filter icon on first slot header */}
                {idx === 0 && (
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    aria-label="Toggle Filters"
                    className="focus:outline-none p-1 rounded hover:bg-black/5 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-textPrimary stroke-[2.5px]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                {group.reminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    pet={pets.find((p) => p.id === reminder.pet_id)}
                    onToggleComplete={handleToggleComplete}
                    onClick={openEditSheet}
                  />
                ))}
              </div>
            </section>
          ))}

          {/* 2. Pending One-off Goals */}
          {pendingOneTime.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="border-b border-border/40 pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-textSecondary lowercase">
                  pending goals
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {pendingOneTime.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    pet={pets.find((p) => p.id === reminder.pet_id)}
                    onToggleComplete={handleToggleComplete}
                    onClick={openEditSheet}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 3. Completed Goals */}
          {completed.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="border-b border-border/40 pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-textSecondary lowercase">
                  completed goals
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {completed.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    pet={pets.find((p) => p.id === reminder.pet_id)}
                    onToggleComplete={handleToggleComplete}
                    onClick={openEditSheet}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={openAddSheet}
        aria-label="Add reminder"
        className="fixed bottom-24 right-6 md:right-[calc(50vw-384px+24px)] z-40 flex h-[60px] w-[60px] items-center justify-center rounded-[20px] bg-accent transition-all hover:scale-105 active:scale-95 focus:outline-none"
        style={{ boxShadow: "0 8px 24px rgba(34,197,94,0.45), 0 2px 8px rgba(0,0,0,0.18)" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Bottom Navigation */}
      <BottomNav active="reminders" />

      {/* Add / Edit Sheet */}
      <Sheet
        isOpen={isSheetOpen}
        title={editingReminder ? "Edit Reminder" : "Add Reminder"}
        onClose={() => setIsSheetOpen(false)}
      >
        <ReminderForm
          pets={pets}
          initialValue={editingReminder ?? undefined}
          onSave={handleSave}
          onCancel={() => setIsSheetOpen(false)}
          onDelete={editingReminder ? handleDelete : undefined}
        />
      </Sheet>
    </main>
  );
}
