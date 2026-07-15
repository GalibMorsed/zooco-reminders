export type Category = "General" | "Lifestyle" | "Health";
export type Frequency = "Once" | "Everyday" | "Weekdays" | "Weekly";
export type Status = "pending" | "completed";

export interface Pet {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface Reminder {
  id: string;
  pet_id: string;
  category: Category;
  title: string;
  notes: string | null;
  start_date: string; // YYYY-MM-DD
  time: string; // HH:mm
  frequency: Frequency;
  status: Status;
  streak_count: number;
  created_at: string;
  updated_at: string;
}

// Shape used when creating/editing a reminder via the form
export interface ReminderInput {
  pet_id: string;
  category: Category;
  title: string;
  notes?: string;
  start_date: string;
  time: string;
  frequency: Frequency;
}

// Grouping used to render the Reminders Overview screen
export type TimeSlot = "Morning" | "Afternoon" | "Evening";

export interface GroupedReminders {
  slot: TimeSlot;
  pending: Reminder[];
  completed: Reminder[];
}
