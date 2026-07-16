import { Pet, PetInput, Reminder, ReminderInput } from "@/types/reminder";

async function handle<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || "Something went wrong. Please try again.");
  }
  return body as T;
}

export interface ReminderFilters {
  petId?: string;
  category?: string;
  status?: string;
}

export const api = {
  async getPets(): Promise<Pet[]> {
    const res = await fetch("/api/pets");
    const body = await handle<{ pets: Pet[] }>(res);
    return body.pets;
  },

  async createPet(input: PetInput): Promise<Pet> {
    const res = await fetch("/api/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await handle<{ pet: Pet }>(res);
    return body.pet;
  },

  async getReminders(filters: ReminderFilters = {}): Promise<Reminder[]> {
    const params = new URLSearchParams();
    if (filters.petId) params.set("petId", filters.petId);
    if (filters.category) params.set("category", filters.category);
    if (filters.status) params.set("status", filters.status);

    const res = await fetch(`/api/reminders?${params.toString()}`);
    const body = await handle<{ reminders: Reminder[] }>(res);
    return body.reminders;
  },

  async createReminder(input: ReminderInput): Promise<Reminder> {
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await handle<{ reminder: Reminder }>(res);
    return body.reminder;
  },

  async updateReminder(
    id: string,
    input: Partial<ReminderInput> & { status?: "pending" | "completed" }
  ): Promise<Reminder> {
    const res = await fetch(`/api/reminders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await handle<{ reminder: Reminder }>(res);
    return body.reminder;
  },

  async deleteReminder(id: string): Promise<void> {
    const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    await handle<{ success: boolean }>(res);
  },
};
