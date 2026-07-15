import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { ReminderInput } from "@/types/reminder";
import { validateReminderInput } from "@/lib/validation";

// GET /api/reminders?petId=...&category=...&status=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const petId = searchParams.get("petId");
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  let query = supabaseServer
    .from("reminders")
    .select("*")
    .order("time", { ascending: true });

  if (petId) query = query.eq("pet_id", petId);
  if (category) query = query.eq("category", category);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reminders: data }, { status: 200 });
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
      pet_id: body.pet_id,
      category: body.category,
      title: body.title.trim(),
      notes: body.notes?.trim() || null,
      start_date: body.start_date,
      time: body.time,
      frequency: body.frequency,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ reminder: data }, { status: 201 });
}
