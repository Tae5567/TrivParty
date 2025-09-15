import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Explicit type for the route context
type RouteContext = {
  params: {
    quizId: string;
  };
};

export async function GET(request: NextRequest, context: RouteContext) {
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