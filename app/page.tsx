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
    upsertReminder(reminder);
    try {
      const updated = await api.updateReminder(reminder.id, { status: reminder.status });
      upsertReminder(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update reminder.");
      void loadData(); // revert on failure
    }
  }

  // 1. Filter reminders by date (only show reminders starting on or before selectedDate, or recurring everyday)
  // For simplicity and matching mockups, we show all reminders of selected filters, partitioned by status & type.
  const completed = reminders.filter((r) => r.status === "completed");
  const pending = reminders.filter((r) => r.status === "pending");

  // Pending routine vs pending one-time goals
  const pendingRoutine = pending.filter((r) => r.frequency !== "Once");
  const pendingOneTime = pending.filter((r) => r.frequency === "Once");

  // Group pending routine by time slot (Morning, Afternoon, Evening)
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
        <button className="text-sm font-semibold text-textSecondary hover:text-textPrimary transition-colors lowercase">
          view all
        </button>
      </header>

      {/* Streaks Strip */}
      <section>
        <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
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

      {/* Reminders List */}
      {!isLoading && reminders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-textSecondary">
            no reminders yet — tap + to add your first one.
          </p>
        </div>
      )}

      {!isLoading && reminders.length > 0 && (
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
                
                {/* Sliders filter icon (rendered on the first group/slot section header) */}
                {idx === 0 && (
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    aria-label="Toggle Filters"
                    className="focus:outline-none p-1 rounded hover:bg-black/5 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4.5 w-4.5 text-textPrimary stroke-[2.5px]"
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
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-3xl font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 focus:outline-none"
      >
        +
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
