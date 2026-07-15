"use client";

import { useEffect, useState } from "react";
import { Pet, Reminder, ReminderInput } from "@/types/reminder";
import clsx from "clsx";

interface ReminderFormProps {
  pets: Pet[];
  initialValue?: Reminder; // present when editing
  onSave: (input: ReminderInput) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>; // present when editing
}

const CATEGORY_OPTIONS = [
  { value: "General", label: "General" },
  { value: "Lifestyle", label: "Lifestyle" },
  { value: "Health", label: "Health" },
] as const;

const FREQUENCY_OPTIONS = [
  { value: "Once", label: "Once" },
  { value: "Everyday", label: "Everyday" },
  { value: "Weekdays", label: "Weekdays" },
  { value: "Weekly", label: "Weekly" },
] as const;

type FormErrors = Partial<Record<keyof ReminderInput, string>>;

function isSingleDayRange(startDate: string, endDate: string, hasEndDate: boolean) {
  return hasEndDate && !!startDate && !!endDate && startDate === endDate;
}

export function ReminderForm({
  pets,
  initialValue,
  onSave,
  onCancel,
  onDelete,
}: ReminderFormProps) {
  const [petId, setPetId] = useState(initialValue?.pet_id ?? (pets[0]?.id || ""));
  const [category, setCategory] = useState(initialValue?.category ?? "General");
  const [title, setTitle] = useState(initialValue?.title ?? "");
  const [notes, setNotes] = useState(initialValue?.notes ?? "");
  const [startDate, setStartDate] = useState(
    initialValue?.start_date ?? new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(initialValue?.end_date ?? "");
  const [showEndDateInput, setShowEndDateInput] = useState(!!initialValue?.end_date);
  const [time, setTime] = useState(initialValue?.time ?? "12:00");
  const [frequency, setFrequency] = useState<ReminderInput["frequency"]>(
    initialValue?.frequency ?? "Everyday"
  );

  // Dropdown open states
  const [isPetDropdownOpen, setIsPetDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  // Notes visibility toggle
  const [showNotesInput, setShowNotesInput] = useState(!!initialValue?.notes);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedPet = pets.find((p) => p.id === petId) || pets[0];
  const isSingleDayReminder = isSingleDayRange(startDate, endDate, showEndDateInput);
  const availableFrequencyOptions = isSingleDayReminder
    ? FREQUENCY_OPTIONS.filter((opt) => opt.value === "Once")
    : FREQUENCY_OPTIONS;

  useEffect(() => {
    if (!petId && pets[0]?.id) {
      setPetId(pets[0].id);
    }
  }, [petId, pets]);

  useEffect(() => {
    if (showEndDateInput && endDate && startDate && endDate < startDate) {
      setEndDate(startDate);
    }
  }, [endDate, showEndDateInput, startDate]);

  useEffect(() => {
    if (isSingleDayReminder && frequency !== "Once") {
      setFrequency("Once");
    }
  }, [frequency, isSingleDayReminder]);

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!petId) next.pet_id = "Please select a pet.";
    if (!category) next.category = "Please select a category.";
    if (!title.trim()) next.title = "Reminder title is required.";
    else if (title.length > 100) next.title = "Title must be under 100 characters.";
    if (!startDate) next.start_date = "Start date is required.";
    if (showEndDateInput && endDate && endDate < startDate) {
      next.end_date = "End date cannot be before start date.";
    }
    if (isSingleDayReminder && frequency !== "Once") {
      next.frequency = "Single-day reminders can only use Once.";
    }
    if (!time) next.time = "Reminder time is required.";
    if (!frequency) next.frequency = "Please choose a frequency.";
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    setSubmitError(null);
    try {
      await onSave({
        pet_id: petId,
        category: category as ReminderInput["category"],
        title: title.trim(),
        notes: notes.trim() || undefined,
        start_date: startDate,
        end_date: showEndDateInput && endDate ? endDate : null,
        time,
        frequency,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save reminder.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between pb-2">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-textSecondary shadow-sm hover:bg-black/5 active:scale-95 transition-all focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 stroke-[2.5px]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        
        <h2 className="text-base font-extrabold text-textPrimary">
          {initialValue ? "Edit Reminder" : "Add Reminder"}
        </h2>

        {initialValue ? (
          <div className="h-10 w-10" aria-hidden="true" />
        ) : (
          <button
            type="submit"
            disabled={isSaving}
            className="text-sm font-extrabold text-accent hover:text-accent/80 disabled:opacity-50 active:scale-95 transition-all focus:outline-none"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        )}
      </header>

      {/* Side-by-side Select Pet & Select Category */}
      <div className="grid grid-cols-2 gap-4">
        {/* Pet Dropdown */}
        <div className="relative">
          <label className="mb-1.5 block text-xs font-bold text-textSecondary/90">
            Select Pet
          </label>
          <div
            onClick={() => {
              setIsPetDropdownOpen(!isPetDropdownOpen);
              setIsCategoryDropdownOpen(false);
            }}
            className="bg-white border border-border rounded-xl px-3 py-2.5 flex items-center justify-between cursor-pointer select-none shadow-sm"
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accentMuted text-[11px]">
                🐶
              </span>
              <span className="text-sm font-bold text-textPrimary truncate">
                {selectedPet?.name || "Choose Pet"}
              </span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-textSecondary shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
          {errors.pet_id && <p className="mt-1 text-xs text-danger font-medium">{errors.pet_id}</p>}

          {/* Options Menu */}
          {isPetDropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border bg-white p-1 shadow-lg max-h-40 overflow-y-auto">
              {pets.map((pet) => (
                <div
                  key={pet.id}
                  onClick={() => {
                    setPetId(pet.id);
                    setIsPetDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-bold text-textPrimary hover:bg-black/5 cursor-pointer transition-colors"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accentMuted text-[11px]">
                    🐶
                  </span>
                  <span>{pet.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="relative">
          <label className="mb-1.5 block text-xs font-bold text-textSecondary/90">
            Select Category
          </label>
          <div
            onClick={() => {
              setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
              setIsPetDropdownOpen(false);
            }}
            className="bg-white border border-border rounded-xl px-3 py-2.5 flex items-center justify-between cursor-pointer select-none shadow-sm"
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accentMuted text-[11px]">
                {category === "General" ? "🏔️" : category === "Lifestyle" ? "🐾" : "🏥"}
              </span>
              <span className="text-sm font-bold text-textPrimary truncate">{category}</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-textSecondary shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
          {errors.category && (
            <p className="mt-1 text-xs text-danger font-medium">{errors.category}</p>
          )}

          {/* Options Menu */}
          {isCategoryDropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border bg-white p-1 shadow-lg">
              {CATEGORY_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    setCategory(opt.value);
                    setIsCategoryDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-bold text-textPrimary hover:bg-black/5 cursor-pointer transition-colors"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accentMuted text-[11px]">
                    {opt.value === "General" ? "🏔️" : opt.value === "Lifestyle" ? "🐾" : "🏥"}
                  </span>
                  <span>{opt.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card 1: Reminder Info */}
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        {/* Black Title Header */}
        <div className="bg-[#121212] px-4 py-3 text-sm font-bold text-white flex items-center">
          Reminder Info
        </div>
        
        <div className="divide-y divide-border">
          {/* Section 1: Reminder Title */}
          <div className="p-4 flex flex-col gap-2">
            <label className="text-sm font-bold text-textPrimary">Set a reminder for...</label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Type here..."
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-border bg-[#F5F6F8] pl-3.5 pr-16 py-3 text-sm font-bold text-textPrimary placeholder:text-textSecondary/60 focus:outline-none focus:border-accent transition-colors"
              />
              <span className="absolute right-3.5 text-xs font-bold text-textSecondary/50 select-none">
                {title.length}/100
              </span>
            </div>
            {errors.title && <p className="mt-1 text-xs text-danger font-medium">{errors.title}</p>}
          </div>

          {/* Section 2: Add Notes Section */}
          <div className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-textPrimary">Add Notes (Optional)</span>
              {!showNotesInput && (
                <button
                  type="button"
                  onClick={() => setShowNotesInput(true)}
                  className="text-xs font-bold text-accent bg-accentMuted rounded-full px-3 py-1.5 hover:bg-accent/15 transition-all focus:outline-none active:scale-95"
                >
                  Add
                </button>
              )}
            </div>
            
            {showNotesInput && (
              <textarea
                placeholder="Type notes here..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-border bg-[#F5F6F8] px-3.5 py-3 text-sm font-semibold text-textPrimary placeholder:text-textSecondary/60 focus:outline-none focus:border-accent mt-1 transition-all"
              />
            )}
          </div>
        </div>
      </div>

      {/* Card 2: Reminder Settings */}
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        {/* Clickable Black Title Header */}
        <div
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="bg-[#121212] px-4 py-3 text-sm font-bold text-white flex justify-between items-center cursor-pointer select-none"
        >
          <span>Reminder Settings</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={clsx(
              "h-4 w-4 text-white/70 transition-transform duration-200",
              isSettingsOpen ? "rotate-0" : "rotate-180"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
          </svg>
        </div>

        {isSettingsOpen && (
          <div className="divide-y divide-border">
            {/* Start Date Section */}
            <div className="p-4 flex flex-col gap-2.5">
              <label className="text-sm font-bold text-textPrimary">Start Date</label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-[#F5F6F8] px-3.5 py-3 text-sm font-bold text-textPrimary focus:outline-none focus:border-accent relative z-10"
                />
                <div className="absolute right-3.5 pointer-events-none z-0 text-textSecondary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 stroke-[2px]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                    />
                  </svg>
                </div>
              </div>
              {errors.start_date && (
                <p className="mt-1 text-xs text-danger font-medium">{errors.start_date}</p>
              )}

              {showEndDateInput ? (
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-textPrimary">End Date</label>
                    <button
                      type="button"
                      onClick={() => {
                        setEndDate("");
                        setShowEndDateInput(false);
                      }}
                      className="text-xs font-bold text-textSecondary hover:text-textPrimary transition-colors focus:outline-none"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-[#F5F6F8] px-3.5 py-3 text-sm font-bold text-textPrimary focus:outline-none focus:border-accent relative z-10"
                    />
                    <div className="absolute right-3.5 pointer-events-none z-0 text-textSecondary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 stroke-[2px]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                        />
                      </svg>
                    </div>
                  </div>
                  {errors.end_date && (
                    <p className="mt-1 text-xs text-danger font-medium">{errors.end_date}</p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEndDate(startDate);
                    setShowEndDateInput(true);
                  }}
                  className="text-xs font-bold text-textSecondary hover:text-textPrimary transition-colors flex items-center gap-1 mt-2 self-start focus:outline-none"
                >
                  <span>+</span>
                  <span>Add End Date</span>
                </button>
              )}
            </div>

            {/* Reminder Time Section */}
            <div className="p-4 flex flex-col gap-2.5">
              <label className="text-sm font-bold text-textPrimary">Reminder Time</label>
              <div className="relative flex items-center">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-[#F5F6F8] px-3.5 py-3 text-sm font-bold text-textPrimary focus:outline-none focus:border-accent relative z-10"
                />
                <div className="absolute right-3.5 pointer-events-none z-0 text-textSecondary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 stroke-[2px]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </div>
              </div>
              {errors.time && <p className="mt-1 text-xs text-danger font-medium">{errors.time}</p>}
            </div>

            {/* Reminder Frequency Section */}
            <div className="p-4 flex flex-col gap-2">
              <label className="text-sm font-bold text-textPrimary">Reminder Frequency</label>
              <span className="text-xs text-textSecondary">
                How often should this reminder repeat?
              </span>
              <div className="relative mt-1">
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as ReminderInput["frequency"])}
                  onFocus={() => {
                    setIsPetDropdownOpen(false);
                    setIsCategoryDropdownOpen(false);
                  }}
                  className="w-full appearance-none rounded-xl border border-border bg-[#F5F6F8] px-3.5 py-3 pr-10 text-sm font-bold text-textPrimary shadow-sm cursor-pointer focus:outline-none focus:border-accent"
                >
                  {availableFrequencyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-textSecondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
              {errors.frequency && (
                <p className="mt-1 text-xs text-danger font-medium">{errors.frequency}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {submitError && <p className="text-sm font-medium text-danger">{submitError}</p>}

      {initialValue && onDelete && (
        <div className="mt-2 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={onDelete}
            className="w-full rounded-xl border border-danger bg-white py-3 text-sm font-extrabold text-danger shadow-sm hover:bg-danger/5 active:scale-95 disabled:opacity-50 transition-all focus:outline-none"
          >
            Delete Reminder
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-xl bg-accent py-3 text-sm font-extrabold text-white shadow-sm hover:bg-accent/90 active:scale-95 disabled:opacity-50 transition-all focus:outline-none"
          >
            {isSaving ? "Updating..." : "Update Reminder"}
          </button>
        </div>
      )}
    </form>
  );
}
