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

    const mockLayout3D = {
      version: 1,
      unit: "meter",
      space: {
        width: 12,
        height: 8,
        shape: "rectangle",
      },
      zones: [
        {
          type: "open_office",
          x: 1,
          y: 1,
          width: 6,
          height: 4,
          seats: 12,
        },
        {
          type: "meeting_room",
          x: 8,
          y: 1,
          width: 3,
          height: 2.5,
          seats: 6,
        },
        {
          type: "manager_room",
          x: 8,
          y: 4,
          width: 3,
          height: 2.5,
          seats: 1,
        },
        {
          type: "lounge",
          x: 1,
          y: 5.5,
          width: 4,
          height: 1.5,
          seats: 4,
        },
      ],
      furniture: [
        { type: "desk", count: 12 },
        { type: "chair", count: 18 },
        { type: "meeting_table", count: 1 },
        { type: "sofa", count: 1 },
      ],
      assumptions: [
        "도면이 없거나 단순하다고 가정한 기본 직사각형 배치",
        "회의실 1개, 대표실 1개, 라운지 1개를 포함한 예시 배치",
      ],
    };

    const { error } = await supabase
      .from("office_projects")
      .update({
        layout_status: "completed",
        layout_3d_json: mockLayout3D,
      })
      .eq("id", projectId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "가짜 3D 배치 결과가 저장되었습니다.",
      layout: mockLayout3D,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "3D 배치 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
