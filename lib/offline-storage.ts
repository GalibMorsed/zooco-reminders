import { Pet, PetInput, Reminder, ReminderInput } from "@/types/reminder";

const PETS_KEY = "zooco:pets";
const REMINDERS_KEY = "zooco:reminders";
const QUEUE_KEY = "zooco:offline-queue";

type QueuedOperation =
  | { type: "createPet"; payload: PetInput }
  | { type: "createReminder"; payload: ReminderInput }
  | { type: "updateReminder"; id: string; payload: Partial<ReminderInput> & { status?: "pending" | "completed"; completed_on?: string } }
  | { type: "deleteReminder"; id: string };

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function makeLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const offlineStorage = {
  getPets() {
    return readJson<Pet[]>(PETS_KEY, []);
  },

  setPets(pets: Pet[]) {
    writeJson(PETS_KEY, pets);
  },

  getReminders() {
    return readJson<Reminder[]>(REMINDERS_KEY, []);
  },

  setReminders(reminders: Reminder[]) {
    writeJson(REMINDERS_KEY, reminders);
  },

  queue(operation: QueuedOperation) {
    writeJson(QUEUE_KEY, [...this.getQueue(), operation]);
  },

  getQueue() {
    return readJson<QueuedOperation[]>(QUEUE_KEY, []);
  },

  clearQueue() {
    writeJson(QUEUE_KEY, []);
  },

  makePet(input: PetInput): Pet {
    return {
      id: input.id ?? makeLocalId("local-pet"),
      name: input.name,
      pet_type: input.pet_type,
      avatar_url: input.avatar_url ?? null,
    };
  },

  makeReminder(input: ReminderInput): Reminder {
    const now = new Date().toISOString();
    return {
      id: input.id ?? makeLocalId("local-reminder"),
      pet_id: input.pet_id,
      category: input.category,
      title: input.title,
      notes: input.notes ?? null,
      start_date: input.start_date,
      end_date: input.end_date ?? null,
      time: input.time,
      frequency: input.frequency,
      status: "pending",
      streak_count: 0,
      completion_dates: [],
      created_at: now,
      updated_at: now,
    };
  },
};
