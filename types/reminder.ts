export type Category = "General" | "Lifestyle" | "Health";
export type Frequency = "Once" | "Everyday" | "Weekdays" | "Weekly";
export type Status = "pending" | "completed";

export interface Pet {
  id: string;
  name: string;
  pet_type: string;
  avatar_url: string | null;
}

export interface PetInput {
  id?: string;
  name: string;
  pet_type: string;
  avatar_url?: string | null;
}

export interface Reminder {
  id: string;
  pet_id: string;
  category: Category;
  title: string;
  notes: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD
  time: string; // HH:mm
  frequency: Frequency;
  status: Status;
  streak_count: number;
  completion_dates?: string[];
  created_at: string;
  updated_at: string;
}

// Shape used when creating/editing a reminder via the form
export interface ReminderInput {
  id?: string;
  pet_id: string;
  category: Category;
  title: string;
  notes?: string;
  start_date: string;
  end_date?: string | null;
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
