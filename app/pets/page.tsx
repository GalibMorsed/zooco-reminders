"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useReminderStore } from "@/lib/store";
import { BottomNav } from "@/components/ui/BottomNav";

const PET_TYPE_SUGGESTIONS = ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Hamster"];

export default function PetsPage() {
  const { pets, setPets, upsertPet } = useReminderStore();
  const [name, setName] = useState("");
  const [petType, setPetType] = useState("Dog");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPets() {
    setIsLoading(true);
    setError(null);
    try {
      const petsData = await api.getPets();
      setPets(petsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pets.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedType = petType.trim();

    if (!trimmedName) {
      setError("Pet name is required.");
      return;
    }
    if (!trimmedType) {
      setError("Pet type is required.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const created = await api.createPet({
        name: trimmedName,
        pet_type: trimmedType,
      });
      upsertPet(created);
      setName("");
      setPetType(trimmedType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add pet.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 px-4 pt-6 pb-28">
      <header className="flex items-center justify-between pb-2">
        {/* Left — Back Button */}
        <Link
          href="/"
          aria-label="Back to reminders"
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
        </Link>

        {/* Center — Page Title */}
        <h1 className="text-base font-extrabold text-textPrimary">My Pets</h1>

        {/* Right — Reminders Link */}
        <Link
          href="/"
          className="text-sm font-extrabold text-accent hover:text-accent/80 active:scale-95 transition-all focus:outline-none"
        >
          reminders
        </Link>
      </header>

      {/* ── Card: Add Pet ── */}
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        {/* Black title header */}
        <div className="bg-[#121212] px-4 py-3 text-sm font-bold text-white">
          Add Pet
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-border">
          {/* Pet Name */}
          <div className="flex flex-col gap-2 p-4">
            <label className="text-sm font-bold text-textPrimary">Pet Name</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Type pet name..."
                maxLength={60}
                className="w-full rounded-xl border border-border bg-[#F5F6F8] px-3.5 py-3 text-sm font-bold text-textPrimary placeholder:text-textSecondary/60 focus:border-accent focus:outline-none transition-colors"
              />
              {name.length > 0 && (
                <span className="absolute right-3.5 text-xs font-bold text-textSecondary/40 select-none">
                  {name.length}/60
                </span>
              )}
            </div>
          </div>

          {/* Pet Type */}
          <div className="flex flex-col gap-2.5 p-4">
            <label className="text-sm font-bold text-textPrimary">Pet Type</label>
            <input
              type="text"
              value={petType}
              onChange={(e) => setPetType(e.target.value)}
              placeholder="Dog, cat, turtle..."
              maxLength={40}
              list="pet-type-suggestions"
              className="w-full rounded-xl border border-border bg-[#F5F6F8] px-3.5 py-3 text-sm font-bold text-textPrimary placeholder:text-textSecondary/60 focus:border-accent focus:outline-none transition-colors"
            />
            <datalist id="pet-type-suggestions">
              {PET_TYPE_SUGGESTIONS.map((type) => (
                <option key={type} value={type} />
              ))}
            </datalist>

            {/* Quick-select chips */}
            <div className="flex flex-wrap gap-2 pt-0.5">
              {PET_TYPE_SUGGESTIONS.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPetType(type)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 focus:outline-none ${
                    petType === type
                      ? "border-accent bg-accentMuted text-accent"
                      : "border-border bg-[#F5F6F8] text-textSecondary hover:border-accent hover:bg-accentMuted hover:text-accent"
                  }`}
                >
                  {type === "Dog" ? "🐶" : type === "Cat" ? "🐱" : type === "Bird" ? "🐦" : type === "Rabbit" ? "🐰" : type === "Fish" ? "🐠" : "🐹"} {type}
                </button>
              ))}
            </div>
          </div>

          {/* Error + Submit */}
          <div className="flex flex-col gap-3 p-4">
            {error && <p className="text-xs font-medium text-danger">{error}</p>}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl bg-accent py-3 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-accent/90 active:scale-95 disabled:opacity-50 focus:outline-none"
            >
              {isSaving ? "Adding..." : "Add Pet"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Card: My Pets List ── */}
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        {/* Black title header with pet count */}
        <div className="bg-[#121212] px-4 py-3 text-sm font-bold text-white flex items-center justify-between">
          <span>My Pets</span>
          {pets.length > 0 && (
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold text-white/80">
              {pets.length}
            </span>
          )}
        </div>

        {isLoading && (
          <p className="px-4 py-5 text-sm text-textSecondary animate-pulse">Loading pets...</p>
        )}

        {!isLoading && pets.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <span className="text-3xl">🐾</span>
            <p className="text-sm font-semibold text-textSecondary">
              Add your first pet above to use it in reminders.
            </p>
          </div>
        )}

        {!isLoading && pets.length > 0 && (
          <div className="divide-y divide-border">
            {pets.map((pet) => (
              <div
                key={pet.id}
                className="flex items-center justify-between px-4 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {/* Avatar circle */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accentMuted text-lg">
                    {pet.pet_type?.toLowerCase().includes("cat")
                      ? "🐱"
                      : pet.pet_type?.toLowerCase().includes("bird")
                      ? "🐦"
                      : pet.pet_type?.toLowerCase().includes("rabbit")
                      ? "🐰"
                      : pet.pet_type?.toLowerCase().includes("fish")
                      ? "🐠"
                      : pet.pet_type?.toLowerCase().includes("hamster")
                      ? "🐹"
                      : "🐶"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-textPrimary">{pet.name}</p>
                    <p className="truncate text-xs font-semibold text-textSecondary">
                      {pet.pet_type || "Pet"}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-accentMuted px-3 py-1 text-xs font-bold text-accent">
                  active
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="pet" />
    </main>
  );
}

