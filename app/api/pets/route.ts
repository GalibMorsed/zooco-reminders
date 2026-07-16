import { NextRequest, NextResponse } from "next/server";
import { PetInput } from "@/types/reminder";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

// GET /api/pets
export async function GET() {
  const { data, error } = await supabaseServer
    .from("pets")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }

  return NextResponse.json({ pets: data }, { status: 200, headers: noStoreHeaders });
}

// POST /api/pets
export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<PetInput>;
  const name = body.name?.trim();
  const petType = body.pet_type?.trim();

  if (!name) {
    return NextResponse.json({ error: "Pet name is required." }, { status: 400 });
  }
  if (name.length > 60) {
    return NextResponse.json({ error: "Pet name must be under 60 characters." }, { status: 400 });
  }
  if (!petType) {
    return NextResponse.json({ error: "Pet type is required." }, { status: 400 });
  }
  if (petType.length > 40) {
    return NextResponse.json({ error: "Pet type must be under 40 characters." }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("pets")
    .insert({
      name,
      pet_type: petType,
      avatar_url: body.avatar_url || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }

  return NextResponse.json({ pet: data }, { status: 201, headers: noStoreHeaders });
}
