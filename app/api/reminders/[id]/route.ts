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

interface Params {
  params: { id: string };
}

// GET /api/reminders/:id
export async function GET(_request: NextRequest, { params }: Params) {
  const { data, error } = await supabaseServer
    .from("reminders")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Reminder not found." },
      { status: 404, headers: noStoreHeaders }
    );
  }

  return NextResponse.json({ reminder: data }, { status: 200, headers: noStoreHeaders });
}

// PUT /api/reminders/:id
// Accepts either a full ReminderInput (edit form save) or a partial
// { status: "completed" | "pending" } payload (mark-as-done toggle).
export async function PUT(request: NextRequest, { params }: Params) {
  const body = (await request.json()) as Partial<ReminderInput> & {
    status?: "pending" | "completed";
  };

  // Status-only toggle (mark as done / undo) skips full field validation
  const isStatusOnlyUpdate =
    body.status && Object.keys(body).length === 1;

  if (!isStatusOnlyUpdate) {
    const validationError = validateReminderInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
  }

  const updatePayload: Record<string, unknown> = { ...body };
  if (body.title) updatePayload.title = body.title.trim();
  if (body.notes !== undefined) updatePayload.notes = body.notes?.trim() || null;
  if (body.end_date !== undefined) updatePayload.end_date = body.end_date || null;

  // When a reminder is marked completed, bump the streak counter
  if (body.status === "completed") {
    const { data: existing } = await supabaseServer
      .from("reminders")
      .select("streak_count")
      .eq("id", params.id)
      .single();

    updatePayload.streak_count = (existing?.streak_count ?? 0) + 1;
  }

  const { data, error } = await supabaseServer
    .from("reminders")
    .update(updatePayload)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }

  return NextResponse.json({ reminder: data }, { status: 200, headers: noStoreHeaders });
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
