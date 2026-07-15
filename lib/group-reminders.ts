import { GroupedReminders, Reminder, TimeSlot } from "@/types/reminder";

function getSlot(time: string): TimeSlot {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

export function groupReminders(reminders: Reminder[]): GroupedReminders[] {
  const slots: TimeSlot[] = ["Morning", "Afternoon", "Evening"];

  return slots
    .map((slot) => {
      const inSlot = reminders.filter((r) => getSlot(r.time) === slot);
      return {
        slot,
        pending: inSlot.filter((r) => r.status === "pending"),
        completed: inSlot.filter((r) => r.status === "completed"),
      };
    })
    .filter((group) => group.pending.length > 0 || group.completed.length > 0);
}
