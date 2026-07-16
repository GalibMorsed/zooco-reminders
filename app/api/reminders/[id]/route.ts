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

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function calculateCurrentStreak(completedDates: string[]) {
  const completed = new Set(completedDates);
  const cursor = new Date();
  let streak = 0;

  while (completed.has(toDateString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

interface Params {
  params: { id: string };
}

// GET /api/reminders/:id
export async function GET(_request: NextRequest, { params }: Params) {
  const { data, error } = await supabaseServer
    .from("reminders")
    .select("*, reminder_completions(completed_date)")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Reminder not found." },
      { status: 404, headers: noStoreHeaders }
    );
  }

  return NextResponse.json(
    { reminder: normalizeReminder(data as ReminderRow) },
    { status: 200, headers: noStoreHeaders }
  );
}

// PUT /api/reminders/:id
// Accepts either a full ReminderInput (edit form save) or a partial
// { status: "completed" | "pending" } payload (mark-as-done toggle).
export async function PUT(request: NextRequest, { params }: Params) {
  const body = (await request.json()) as Partial<ReminderInput> & {
    status?: "pending" | "completed";
    completed_on?: string;
  };

  // Status-only toggle (mark as done / undo) skips full field validation
  const isStatusOnlyUpdate =
    body.status && Object.keys(body).every((key) => key === "status" || key === "completed_on");

  if (!isStatusOnlyUpdate) {
    const validationError = validateReminderInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
  }

  const { completed_on: completedOn, ...bodyWithoutCompletedOn } = body;
  const updatePayload: Record<string, unknown> = { ...bodyWithoutCompletedOn };
  if (body.title) updatePayload.title = body.title.trim();
  if (body.notes !== undefined) updatePayload.notes = body.notes?.trim() || null;
  if (body.end_date !== undefined) updatePayload.end_date = body.end_date || null;

  if (body.status) {
    const completionDate = completedOn || toDateString(new Date());

    if (body.status === "completed") {
      const { error: completionError } = await supabaseServer
        .from("reminder_completions")
        .upsert(
          {
            reminder_id: params.id,
            completed_date: completionDate,
          },
          { onConflict: "reminder_id,completed_date" }
        );

      if (completionError) {
        return NextResponse.json(
          { error: completionError.message },
          { status: 500, headers: noStoreHeaders }
        );
      }
    } else {
      const { error: completionError } = await supabaseServer
        .from("reminder_completions")
        .delete()
        .eq("reminder_id", params.id)
        .eq("completed_date", completionDate);

      if (completionError) {
        return NextResponse.json(
          { error: completionError.message },
          { status: 500, headers: noStoreHeaders }
        );
      }
    }

    const { data: completionRows } = await supabaseServer
      .from("reminder_completions")
      .select("completed_date")
      .eq("reminder_id", params.id);

    updatePayload.streak_count = calculateCurrentStreak(
      completionRows?.map((row) => row.completed_date) ?? []
    );
  }

  const { data, error } = await supabaseServer
    .from("reminders")
    .update(updatePayload)
    .eq("id", params.id)
    .select("*, reminder_completions(completed_date)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }

  return NextResponse.json(
    { reminder: normalizeReminder(data as ReminderRow) },
    { status: 200, headers: noStoreHeaders }
  );
}

// DELETE /api/reminders/:id
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error } = await supabaseServer
    .from("reminders")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }

  return NextResponse.json({ success: true }, { status: 200, headers: noStoreHeaders });
}
