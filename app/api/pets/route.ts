import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// GET /api/pets
export async function GET() {
  const { data, error } = await supabaseServer
    .from("pets")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pets: data }, { status: 200 });
}
