import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectId = Number(body.projectId);

    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "올바른 projectId가 필요합니다." },
        { status: 400 }
      );
    }

    const mockAnalysis = {
      boundary_shape: "rectangle",
      entrances: [{ wall: "south", count: 1 }],
      windows: [{ wall: "east", count: 2 }],
      columns: [],
      fixed_rooms: ["회의실 필요"],
      seat_zone_suggestion: "open office",
      confidence: 0.72,
      needs_confirmation: true,
    };

    const { error } = await supabase
      .from("office_projects")
      .update({
        analysis_status: "completed",
        floorplan_analysis: mockAnalysis,
      })
      .eq("id", projectId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "가짜 AI 분석 결과가 저장되었습니다.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "분석 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
