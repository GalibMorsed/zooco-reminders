import { ReminderInput } from "@/types/reminder";

export function validateReminderInput(body: Partial<ReminderInput>): string | null {
  if (!body.pet_id) return "Pet is required.";
  if (!body.category) return "Category is required.";
  if (!body.title || body.title.trim().length === 0) return "Reminder title is required.";
  if (body.title && body.title.length > 100) return "Title must be under 100 characters.";
  if (!body.start_date) return "Start date is required.";
  if (!body.time) return "Reminder time is required.";
  if (!body.frequency) return "Frequency is required.";
  return null;
}
