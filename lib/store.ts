import { create } from "zustand";
import { Pet, Reminder } from "@/types/reminder";

interface ReminderStore {
  pets: Pet[];
  reminders: Reminder[];
  selectedPetId: string | null; // null = "All pets"
  selectedCategory: string | null; // null = "All categories"
  isLoading: boolean;
  error: string | null;

  setPets: (pets: Pet[]) => void;
  setReminders: (reminders: Reminder[]) => void;
  setSelectedPetId: (petId: string | null) => void;
  setSelectedCategory: (category: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  upsertReminder: (reminder: Reminder) => void;
  removeReminder: (id: string) => void;
}

export const useReminderStore = create<ReminderStore>((set) => ({
  pets: [],
  reminders: [],
  selectedPetId: null,
  selectedCategory: null,
  isLoading: false,
  error: null,

  setPets: (pets) => set({ pets }),
  setReminders: (reminders) => set({ reminders }),
  setSelectedPetId: (petId) => set({ selectedPetId: petId }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  upsertReminder: (reminder) =>
    set((state) => {
      const exists = state.reminders.some((r) => r.id === reminder.id);
      return {
        reminders: exists
          ? state.reminders.map((r) => (r.id === reminder.id ? reminder : r))
          : [...state.reminders, reminder],
      };
    }),

  removeReminder: (id) =>
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id),
    })),
}));
