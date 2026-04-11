import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

type JsonObject = Record<string, any>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "");
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function getSpaceTypeKey(raw?: string | null) {
  const value = (raw || "").toLowerCase();

  if (value.includes("cafe") || value.includes("coffee") || value.includes("카페")) {
    return "cafe";
  }

  if (
    value.includes("office") ||
    value.includes("work") ||
    value.includes("사무실") ||
    value.includes("오피스")
  ) {
    return "office";
  }

  if (
    value.includes("restaurant") ||
    value.includes("식당") ||
    value.includes("레스토랑")
  ) {
    return "restaurant";
  }

  if (
    value.includes("fitness") ||
    value.includes("gym") ||
    value.includes("헬스") ||
    value.includes("피트니스")
  ) {
    return "fitness";
  }

  if (
    value.includes("retail") ||
    value.includes("shop") ||
    value.includes("store") ||
    value.includes("매장")
  ) {
    return "retail";
  }

  return "other";
}

function buildMockLayout3D(project: any) {
  const requirements = isObject(project?.requirements_json)
    ? project.requirements_json
    : {};

  const dimensions = isObject(requirements.dimensions)
    ? requirements.dimensions
    : {};

  const widthFromRequirements =
    toNumber(requirements.width, NaN) ||
    toNumber(requirements.space_width, NaN) ||
    toNumber(dimensions.width, NaN);

  const heightFromRequirements =
    toNumber(requirements.height, NaN) ||
    toNumber(requirements.space_height, NaN) ||
    toNumber(dimensions.height, NaN);

  const area =
    toNumber(project?.area_size, NaN) ||
    toNumber(requirements.area_size, NaN) ||
    toNumber(requirements.area, NaN) ||
    toNumber(requirements.total_area, NaN) ||
    80;

  const finalWidth =
    Number.isFinite(widthFromRequirements) && widthFromRequirements > 0
      ? round1(widthFromRequirements)
      : round1(Math.sqrt(area * 1.4));

  const finalHeight =
    Number.isFinite(heightFromRequirements) && heightFromRequirements > 0
      ? round1(heightFromRequirements)
      : round1(area / finalWidth);

  const type = getSpaceTypeKey(project?.space_type);

  if (type === "cafe") {
    return {
      version: "1.0.0",
      generated_at: new Date().toISOString(),
      project_summary: {
        project_id: String(project.id),
        project_name: project.project_name || "이름 없는 프로젝트",
        space_type: project.space_type || "카페",
      },
      space: {
        width: finalWidth,
        height: finalHeight,
        unit: "m",
        shape: "rectangular",
      },
      zones: [
        {
          id: "zone-order",
          type: "service_bar",
          label: "주문 카운터",
          x: 0,
          y: 0,
          width: round1(finalWidth * 0.28),
          height: 3.8,
          color: "#FDE68A",
        },
        {
          id: "zone-pickup",
          type: "pickup",
          label: "픽업 / 대기존",
          x: round1(finalWidth * 0.3),
          y: 0,
          width: round1(finalWidth * 0.22),
          height: 3.8,
          color: "#A7F3D0",
        },
        {
          id: "zone-prep",
          type: "prep",
          label: "제조존",
          x: 0,
          y: 4.3,
          width: round1(finalWidth * 0.28),
          height: round1(finalHeight - 4.3),
          color: "#FCA5A5",
        },
        {
          id: "zone-seating",
          type: "seating",
          label: "좌석존",
          x: round1(finalWidth * 0.33),
          y: 4.3,
          width: round1(finalWidth * 0.67),
          height: round1(finalHeight - 4.3),
          color: "#BFDBFE",
        },
      ],
      furniture: Array.from({ length: 24 }).map((_, i) => ({
        id: `chair-${i + 1}`,
        type: "chair",
        label: "좌석",
        x: round1(6 + (i % 6) * 1.8),
        y: round1(5.8 + Math.floor(i / 6) * 1.3),
        width: 0.5,
        height: 0.5,
      })),
      assumptions: ["카페 기준 기본 동선형 레이아웃입니다."],
      warnings: [],
      requirements_snapshot: requirements,
    };
  }

  if (type === "office") {
    return {
      version: "1.0.0",
      generated_at: new Date().toISOString(),
      project_summary: {
        project_id: String(project.id),
        project_name: project.project_name || "이름 없는 프로젝트",
        space_type: project.space_type || "오피스",
      },
      space: {
        width: finalWidth,
        height: finalHeight,
        unit: "m",
        shape: "rectangular",
      },
      zones: [
        {
          id: "zone-open-office",
          type: "open_office",
          label: "오픈 오피스",
          x: 0,
          y: 0,
          width: round1(finalWidth * 0.65),
          height: finalHeight,
          color: "#A7F3D0",
        },
        {
          id: "zone-meeting",
          type: "meeting_room",
          label: "미팅룸",
          x: round1(finalWidth * 0.67),
          y: 0,
          width: round1(finalWidth * 0.33),
          height: round1(finalHeight * 0.4),
          color: "#FDE68A",
        },
        {
          id: "zone-pantry",
          type: "pantry",
          label: "팬트리",
          x: round1(finalWidth * 0.67),
          y: round1(finalHeight * 0.42),
          width: round1(finalWidth * 0.33),
          height: round1(finalHeight * 0.25),
          color: "#FED7AA",
        },
        {
          id: "zone-lounge",
          type: "lounge",
          label: "라운지",
          x: round1(finalWidth * 0.67),
          y: round1(finalHeight * 0.69),
          width: round1(finalWidth * 0.33),
          height: round1(finalHeight * 0.31),
          color: "#FBCFE8",
        },
      ],
      furniture: [
        {
          id: "meeting-table-1",
          type: "table",
          label: "회의 테이블",
          x: round1(finalWidth * 0.74),
          y: 0.8,
          width: 2,
          height: 1,
        },
      ],
      assumptions: ["오피스 기준 기본 레이아웃입니다."],
      warnings: [],
      requirements_snapshot: requirements,
    };
  }

  return {
    version: "1.0.0",
    generated_at: new Date().toISOString(),
    project_summary: {
      project_id: String(project.id),
      project_name: project.project_name || "이름 없는 프로젝트",
      space_type: project.space_type || "일반 공간",
    },
    space: {
      width: finalWidth,
      height: finalHeight,
      unit: "m",
      shape: "rectangular",
    },
    zones: [
      {
        id: "zone-main",
        type: "main",
        label: "메인 공간",
        x: 0,
        y: 0,
        width: finalWidth,
        height: finalHeight,
        color: "#BFDBFE",
      },
    ],
    furniture: [],
    assumptions: ["공간 유형 정보가 제한적이어서 기본 레이아웃으로 생성했습니다."],
    warnings: [],
    requirements_snapshot: requirements,
  };
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);

    let body: any = {};
    try {
      const rawText = await request.text();
      body = rawText ? JSON.parse(rawText) : {};
    } catch {
      body = {};
    }

    const projectId =
      url.searchParams.get("projectId") ||
      url.searchParams.get("id") ||
      body?.projectId ||
      body?.id;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "projectId가 필요합니다." },
        { status: 400 }
      );
    }

    const { data: project, error: projectError } = await supabase
      .from("office_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { error: processingError } = await supabase
      .from("office_projects")
      .update({
        layout_status: "processing",
      })
      .eq("id", projectId);

    if (processingError) {
      return NextResponse.json(
        { error: "layout_status를 processing으로 업데이트하지 못했습니다." },
        { status: 500 }
      );
    }

    const layout3D = buildMockLayout3D(project);

    const { error: updateError } = await supabase
      .from("office_projects")
      .update({
        layout_status: "completed",
        layout_3d_json: layout3D,
      })
      .eq("id", projectId);

    if (updateError) {
      await supabase
        .from("office_projects")
        .update({
          layout_status: "failed",
        })
        .eq("id", projectId);

      return NextResponse.json(
        { error: "layout_3d_json 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      projectId,
      layout: layout3D,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "3D 배치 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
