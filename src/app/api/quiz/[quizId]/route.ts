import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  context: { params: Record<string, string> }
) {
  const { quizId } = context.params;

  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}