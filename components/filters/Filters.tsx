"use client";

import clsx from "clsx";
import { Pet } from "@/types/reminder";

const CATEGORIES = ["General", "Lifestyle", "Health"] as const;

interface FiltersProps {
  pets: Pet[];
  selectedPetId: string | null;
  selectedCategory: string | null;
  onSelectPet: (petId: string | null) => void;
  onSelectCategory: (category: string | null) => void;
}

export function Filters({
  pets,
  selectedPetId,
  selectedCategory,
  onSelectPet,
  onSelectCategory,
}: FiltersProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip
          label="All Pets"
          active={selectedPetId === null}
          onClick={() => onSelectPet(null)}
        />
        {pets.map((pet) => (
          <Chip
            key={pet.id}
            label={pet.name}
            active={selectedPetId === pet.id}
            onClick={() => onSelectPet(pet.id)}
          />
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip
          label="All Categories"
          active={selectedCategory === null}
          onClick={() => onSelectCategory(null)}
        />
        {CATEGORIES.map((category) => (
          <Chip
            key={category}
            label={category}
            active={selectedCategory === category}
            onClick={() => onSelectCategory(category)}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "shrink-0 rounded-pill border px-3.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-accent bg-accentMuted text-accent"
          : "border-border text-textSecondary hover:text-textPrimary"
      )}
    >
      {label}
    </button>
  );
}
