import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { ReminderInput } from "@/types/reminder";
import { validateReminderInput } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

type ReminderRow = Record<string, unknown> & {
  reminder_completions?: { completed_date: string }[] | null;
};

function normalizeReminder(row: ReminderRow) {
  const { reminder_completions, ...reminder } = row;
  return {
    ...reminder,
    completion_dates: reminder_completions?.map((item) => item.completed_date) ?? [],
  };
}

// GET /api/reminders?petId=...&category=...&status=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const petId = searchParams.get("petId");
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  let query = supabaseServer
    .from("reminders")
    .select("*, reminder_completions(completed_date)")
    .order("time", { ascending: true });

  if (petId) query = query.eq("pet_id", petId);
  if (category) query = query.eq("category", category);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }

  return NextResponse.json(
    { reminders: (data ?? []).map((row) => normalizeReminder(row as ReminderRow)) },
    { status: 200, headers: noStoreHeaders }
  );
}

// POST /api/reminders  - create a new reminder
export async function POST(request: NextRequest) {
  const body = (await request.json()) as ReminderInput;

  const validationError = validateReminderInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("reminders")
    .insert({
      id: body.id,
      pet_id: body.pet_id,
      category: body.category,
      title: body.title.trim(),
      notes: body.notes?.trim() || null,
      start_date: body.start_date,
      end_date: body.end_date || null,
      time: body.time,
      frequency: body.frequency,
      status: "pending",
    })
    .select("*, reminder_completions(completed_date)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
  return NextResponse.json(
    { reminder: normalizeReminder(data as ReminderRow) },
    { status: 201, headers: noStoreHeaders }
  );
}
