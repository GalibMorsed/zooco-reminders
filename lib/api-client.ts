import { Pet, PetInput, Reminder, ReminderInput } from "@/types/reminder";
import { offlineStorage } from "@/lib/offline-storage";

async function handle<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || "Something went wrong. Please try again.");
  }
  return body as T;
}

async function replay(res: Response) {
  if (!res.ok) {
    throw new Error("Offline sync failed. Changes will be retried later.");
  }
}

export interface ReminderFilters {
  petId?: string;
  category?: string;
  status?: string;
}

export const api = {
  async getPets(): Promise<Pet[]> {
    try {
      const res = await fetch("/api/pets");
      const body = await handle<{ pets: Pet[] }>(res);
      offlineStorage.setPets(body.pets);
      return body.pets;
    } catch (err) {
      const cached = offlineStorage.getPets();
      if (cached.length > 0) return cached;
      throw err;
    }
  },

  async createPet(input: PetInput): Promise<Pet> {
    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await handle<{ pet: Pet }>(res);
      offlineStorage.setPets([...offlineStorage.getPets(), body.pet]);
      return body.pet;
    } catch (err) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const offlineInput = { ...input, id: crypto.randomUUID() };
        const pet = offlineStorage.makePet(offlineInput);
        offlineStorage.setPets([...offlineStorage.getPets(), pet]);
        offlineStorage.queue({ type: "createPet", payload: offlineInput });
        return pet;
      }
      throw err;
    }
  },

  async getReminders(filters: ReminderFilters = {}): Promise<Reminder[]> {
    const params = new URLSearchParams();
    if (filters.petId) params.set("petId", filters.petId);
    if (filters.category) params.set("category", filters.category);
    if (filters.status) params.set("status", filters.status);

    try {
      const res = await fetch(`/api/reminders?${params.toString()}`);
      const body = await handle<{ reminders: Reminder[] }>(res);
      offlineStorage.setReminders(body.reminders);
      return body.reminders;
    } catch (err) {
      const cached = offlineStorage.getReminders();
      if (cached.length > 0) {
        return cached.filter((reminder) => {
          if (filters.petId && reminder.pet_id !== filters.petId) return false;
          if (filters.category && reminder.category !== filters.category) return false;
          if (filters.status && reminder.status !== filters.status) return false;
          return true;
        });
      }
      throw err;
    }
  },

  async createReminder(input: ReminderInput): Promise<Reminder> {
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await handle<{ reminder: Reminder }>(res);
      offlineStorage.setReminders([...offlineStorage.getReminders(), body.reminder]);
      return body.reminder;
    } catch (err) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const offlineInput = { ...input, id: crypto.randomUUID() };
        const reminder = offlineStorage.makeReminder(offlineInput);
        offlineStorage.setReminders([...offlineStorage.getReminders(), reminder]);
        offlineStorage.queue({ type: "createReminder", payload: offlineInput });
        return reminder;
      }
      throw err;
    }
  },

  async updateReminder(
    id: string,
    input: Partial<ReminderInput> & { status?: "pending" | "completed"; completed_on?: string }
  ): Promise<Reminder> {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await handle<{ reminder: Reminder }>(res);
      offlineStorage.setReminders(
        offlineStorage.getReminders().map((reminder) =>
          reminder.id === id ? body.reminder : reminder
        )
      );
      return body.reminder;
    } catch (err) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const cached = offlineStorage.getReminders();
        const updated = cached.map((reminder) => {
          if (reminder.id !== id) return reminder;
          const completionDate = input.completed_on;
          const completionDates = new Set(reminder.completion_dates ?? []);
          if (input.status === "completed" && completionDate) completionDates.add(completionDate);
          if (input.status === "pending" && completionDate) completionDates.delete(completionDate);
          return {
            ...reminder,
            ...input,
            end_date: input.end_date !== undefined ? input.end_date : reminder.end_date,
            notes: input.notes !== undefined ? input.notes : reminder.notes,
            completion_dates: Array.from(completionDates),
            updated_at: new Date().toISOString(),
          };
        });
        const reminder = updated.find((item) => item.id === id);
        if (reminder) {
          offlineStorage.setReminders(updated);
          offlineStorage.queue({ type: "updateReminder", id, payload: input });
          return reminder;
        }
      }
      throw err;
    }
  },

  async deleteReminder(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      await handle<{ success: boolean }>(res);
      offlineStorage.setReminders(
        offlineStorage.getReminders().filter((reminder) => reminder.id !== id)
      );
    } catch (err) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        offlineStorage.setReminders(
          offlineStorage.getReminders().filter((reminder) => reminder.id !== id)
        );
        offlineStorage.queue({ type: "deleteReminder", id });
        return;
      }
      throw err;
    }
  },

  async syncOfflineQueue(): Promise<void> {
    const queue = offlineStorage.getQueue();
    if (queue.length === 0) return;

    for (const operation of queue) {
      if (operation.type === "createPet") {
        await replay(
          await fetch("/api/pets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(operation.payload),
          })
        );
      }
      if (operation.type === "createReminder") {
        await replay(
          await fetch("/api/reminders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(operation.payload),
          })
        );
      }
      if (operation.type === "updateReminder") {
        await replay(
          await fetch(`/api/reminders/${operation.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(operation.payload),
          })
        );
      }
      if (operation.type === "deleteReminder") {
        await replay(await fetch(`/api/reminders/${operation.id}`, { method: "DELETE" }));
      }
    }

    offlineStorage.clearQueue();
  },
};
