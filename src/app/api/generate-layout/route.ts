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

type OfficeProjectRow = {
  id: number;
  project_name: string | null;
  area: string | null;
  headcount: number | null;
  shape: string | null;
  notes: string | null;
  space_type: string | null;
  space_type_detail: string | null;
  input_mode: string | null;
};

type LayoutZone = {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  seats?: number;
};

type LayoutFurniture = {
  type: string;
  count?: number;
};

type Layout3DJson = {
  version: number;
  unit: "meter";
  project_context: {
    project_id: number;
    project_name: string | null;
    space_type: string | null;
    space_type_detail: string | null;
    input_mode: string | null;
    area: string | null;
    headcount: number | null;
    shape: string | null;
  };
  space: {
    width: number;
    height: number;
    shape: string;
  };
  zones: LayoutZone[];
  furniture: LayoutFurniture[];
  assumptions: string[];
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function parseArea(area: string | null) {
  if (!area) return null;
  const numeric = Number(String(area).replace(/[^\d.]/g, ""));
  return Number.isNaN(numeric) ? null : numeric;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildSpaceDimensions(spaceType: string | null, areaValue: number | null) {
  const fallbackMap: Record<string, { width: number; height: number }> = {
    office: { width: 12, height: 8 },
    cafe: { width: 10, height: 8 },
    restaurant: { width: 14, height: 9 },
    fitness: { width: 16, height: 10 },
    retail: { width: 13, height: 9 },
    other: { width: 12, height: 8 },
  };

  const aspectRatioMap: Record<string, number> = {
    office: 1.5,
    cafe: 1.3,
    restaurant: 1.45,
    fitness: 1.6,
    retail: 1.4,
    other: 1.5,
  };

  const fallback = fallbackMap[spaceType || "other"] || fallbackMap.other;
  const aspectRatio = aspectRatioMap[spaceType || "other"] || aspectRatioMap.other;

  if (!areaValue || areaValue <= 0) {
    return fallback;
  }

  const width = round1(Math.sqrt(areaValue * aspectRatio));
  const height = round1(areaValue / width);

  return {
    width: clamp(width, 8, 30),
    height: clamp(height, 6, 20),
  };
}

function buildOfficeLayout(
  width: number,
  height: number,
  headcount: number
): { zones: LayoutZone[]; furniture: LayoutFurniture[]; assumptions: string[] } {
  const seatCount = headcount > 0 ? headcount : 12;
  const meetingSeats = clamp(Math.round(seatCount * 0.35), 4, 10);

  const zones: LayoutZone[] = [
    {
      type: "reception",
      x: round1(width * 0.05),
      y: round1(height * 0.06),
      width: round1(width * 0.18),
      height: round1(height * 0.14),
      seats: 2,
    },
    {
      type: "open_office",
      x: round1(width * 0.05),
      y: round1(height * 0.26),
      width: round1(width * 0.56),
      height: round1(height * 0.46),
      seats: seatCount,
    },
    {
      type: "meeting_room",
      x: round1(width * 0.66),
      y: round1(height * 0.08),
      width: round1(width * 0.27),
      height: round1(height * 0.24),
      seats: meetingSeats,
    },
    {
      type: "focus_room",
      x: round1(width * 0.66),
      y: round1(height * 0.37),
      width: round1(width * 0.12),
      height: round1(height * 0.18),
      seats: 2,
    },
    {
      type: "pantry",
      x: round1(width * 0.80),
      y: round1(height * 0.37),
      width: round1(width * 0.13),
      height: round1(height * 0.18),
    },
    {
      type: "lounge",
      x: round1(width * 0.34),
      y: round1(height * 0.76),
      width: round1(width * 0.28),
      height: round1(height * 0.16),
      seats: clamp(Math.round(seatCount * 0.25), 4, 8),
    },
  ];

  const furniture: LayoutFurniture[] = [
    { type: "desk", count: seatCount },
    { type: "task_chair", count: seatCount },
    { type: "meeting_table", count: 1 },
    { type: "meeting_chair", count: meetingSeats },
    { type: "sofa", count: 2 },
    { type: "pantry_counter", count: 1 },
    { type: "storage_cabinet", count: 2 },
  ];

  const assumptions = [
    "사무실 기본 배치: 오픈오피스 중심 + 회의실 + 포커스룸 + 라운지 + 탕비존",
    "입구 근처에 리셉션을 두고 업무존은 상대적으로 안쪽에 배치",
    "실제 시공도면이 아닌 MVP용 mock 레이아웃이며 업종별 차별화에 초점을 둠",
  ];

  return { zones, furniture, assumptions };
}

function buildCafeLayout(
  width: number,
  height: number,
  headcount: number
): { zones: LayoutZone[]; furniture: LayoutFurniture[]; assumptions: string[] } {
  const seatCount = headcount > 0 ? headcount : 24;

  const zones: LayoutZone[] = [
    {
      type: "counter_bar",
      x: round1(width * 0.62),
      y: round1(height * 0.08),
      width: round1(width * 0.28),
      height: round1(height * 0.18),
      seats: 4,
    },
    {
      type: "pickup_zone",
      x: round1(width * 0.62),
      y: round1(height * 0.29),
      width: round1(width * 0.18),
      height: round1(height * 0.12),
    },
    {
      type: "communal_seating",
      x: round1(width * 0.10),
      y: round1(height * 0.22),
      width: round1(width * 0.42),
      height: round1(height * 0.34),
      seats: clamp(Math.round(seatCount * 0.45), 8, 16),
    },
    {
      type: "window_seating",
      x: round1(width * 0.10),
      y: round1(height * 0.64),
      width: round1(width * 0.50),
      height: round1(height * 0.18),
      seats: clamp(Math.round(seatCount * 0.35), 6, 12),
    },
    {
      type: "photo_spot",
      x: round1(width * 0.64),
      y: round1(height * 0.48),
      width: round1(width * 0.22),
      height: round1(height * 0.16),
      seats: 2,
    },
    {
      type: "back_prep",
      x: round1(width * 0.74),
      y: round1(height * 0.68),
      width: round1(width * 0.16),
      height: round1(height * 0.14),
    },
  ];

  const furniture: LayoutFurniture[] = [
    { type: "two_person_table", count: 4 },
    { type: "four_person_table", count: 2 },
    { type: "bar_stool", count: 4 },
    { type: "lounge_chair", count: 4 },
    { type: "service_counter", count: 1 },
    { type: "pendant_light_cluster", count: 2 },
  ];

  const assumptions = [
    "카페 기본 배치: 카운터/픽업/창가좌석/공용좌석/포토스팟 중심",
    "입구에서 카운터 인지성이 높고, 체류형 좌석과 회전형 좌석을 혼합",
    "브랜드 무드와 사진 포인트를 고려한 mock 레이아웃",
  ];

  return { zones, furniture, assumptions };
}

function buildRestaurantLayout(
  width: number,
  height: number,
  headcount: number
): { zones: LayoutZone[]; furniture: LayoutFurniture[]; assumptions: string[] } {
  const seatCount = headcount > 0 ? headcount : 32;

  const zones: LayoutZone[] = [
    {
      type: "waiting_area",
      x: round1(width * 0.05),
      y: round1(height * 0.08),
      width: round1(width * 0.16),
      height: round1(height * 0.14),
      seats: 4,
    },
    {
      type: "cashier",
      x: round1(width * 0.24),
      y: round1(height * 0.08),
      width: round1(width * 0.12),
      height: round1(height * 0.12),
    },
    {
      type: "dining_hall",
      x: round1(width * 0.06),
      y: round1(height * 0.28),
      width: round1(width * 0.54),
      height: round1(height * 0.56),
      seats: seatCount,
    },
    {
      type: "private_dining",
      x: round1(width * 0.64),
      y: round1(height * 0.28),
      width: round1(width * 0.22),
      height: round1(height * 0.18),
      seats: 8,
    },
    {
      type: "service_station",
      x: round1(width * 0.64),
      y: round1(height * 0.52),
      width: round1(width * 0.10),
      height: round1(height * 0.12),
    },
    {
      type: "kitchen",
      x: round1(width * 0.76),
      y: round1(height * 0.50),
      width: round1(width * 0.18),
      height: round1(height * 0.28),
    },
  ];

  const furniture: LayoutFurniture[] = [
    { type: "two_person_table", count: 4 },
    { type: "four_person_table", count: 4 },
    { type: "banquette_seat", count: 2 },
    { type: "host_stand", count: 1 },
    { type: "service_cart", count: 1 },
    { type: "kitchen_line", count: 1 },
  ];

  const assumptions = [
    "식당 기본 배치: 대기존 + 캐셔 + 홀 + 서비스 스테이션 + 주방",
    "입구 혼잡을 줄이기 위해 대기존을 분리하고 홀/주방 동선을 짧게 구성",
    "운영 효율과 분위기를 동시에 고려한 mock 레이아웃",
  ];

  return { zones, furniture, assumptions };
}

function buildFitnessLayout(
  width: number,
  height: number,
  headcount: number
): { zones: LayoutZone[]; furniture: LayoutFurniture[]; assumptions: string[] } {
  const activeUsers = headcount > 0 ? headcount : 20;

  const zones: LayoutZone[] = [
    {
      type: "reception",
      x: round1(width * 0.05),
      y: round1(height * 0.08),
      width: round1(width * 0.16),
      height: round1(height * 0.14),
      seats: 2,
    },
    {
      type: "cardio_zone",
      x: round1(width * 0.06),
      y: round1(height * 0.28),
      width: round1(width * 0.28),
      height: round1(height * 0.48),
      seats: clamp(Math.round(activeUsers * 0.35), 6, 12),
    },
    {
      type: "weight_zone",
      x: round1(width * 0.38),
      y: round1(height * 0.28),
      width: round1(width * 0.34),
      height: round1(height * 0.48),
      seats: clamp(Math.round(activeUsers * 0.4), 6, 14),
    },
    {
      type: "stretching_zone",
      x: round1(width * 0.76),
      y: round1(height * 0.28),
      width: round1(width * 0.16),
      height: round1(height * 0.22),
      seats: 6,
    },
    {
      type: "consultation",
      x: round1(width * 0.76),
      y: round1(height * 0.54),
      width: round1(width * 0.16),
      height: round1(height * 0.12),
      seats: 2,
    },
    {
      type: "locker_zone",
      x: round1(width * 0.76),
      y: round1(height * 0.70),
      width: round1(width * 0.16),
      height: round1(height * 0.14),
    },
  ];

  const furniture: LayoutFurniture[] = [
    { type: "treadmill", count: 4 },
    { type: "bike", count: 2 },
    { type: "weight_machine", count: 6 },
    { type: "bench", count: 3 },
    { type: "mirror_wall", count: 2 },
    { type: "locker", count: 16 },
  ];

  const assumptions = [
    "피트니스 기본 배치: 유산소존 + 웨이트존 + 스트레칭존 + 상담존 + 락커존",
    "운동 강도별로 존을 나누고, 입구 쪽에는 리셉션/상담을 배치",
    "안전 동선과 시선 개방감을 고려한 mock 레이아웃",
  ];

  return { zones, furniture, assumptions };
}

function buildRetailLayout(
  width: number,
  height: number,
  headcount: number
): { zones: LayoutZone[]; furniture: LayoutFurniture[]; assumptions: string[] } {
  const visitors = headcount > 0 ? headcount : 12;

  const zones: LayoutZone[] = [
    {
      type: "feature_display",
      x: round1(width * 0.10),
      y: round1(height * 0.10),
      width: round1(width * 0.28),
      height: round1(height * 0.20),
      seats: 2,
    },
    {
      type: "wall_display",
      x: round1(width * 0.08),
      y: round1(height * 0.38),
      width: round1(width * 0.22),
      height: round1(height * 0.40),
    },
    {
      type: "experience_zone",
      x: round1(width * 0.36),
      y: round1(height * 0.28),
      width: round1(width * 0.30),
      height: round1(height * 0.40),
      seats: clamp(Math.round(visitors * 0.35), 4, 8),
    },
    {
      type: "cashier",
      x: round1(width * 0.72),
      y: round1(height * 0.12),
      width: round1(width * 0.16),
      height: round1(height * 0.14),
    },
    {
      type: "consultation",
      x: round1(width * 0.72),
      y: round1(height * 0.34),
      width: round1(width * 0.16),
      height: round1(height * 0.16),
      seats: 3,
    },
    {
      type: "storage",
      x: round1(width * 0.72),
      y: round1(height * 0.58),
      width: round1(width * 0.16),
      height: round1(height * 0.18),
    },
  ];

  const furniture: LayoutFurniture[] = [
    { type: "display_rack", count: 6 },
    { type: "feature_table", count: 2 },
    { type: "cash_wrap", count: 1 },
    { type: "consultation_table", count: 1 },
    { type: "mirror", count: 2 },
    { type: "back_storage_shelf", count: 3 },
  ];

  const assumptions = [
    "매장/쇼룸 기본 배치: 메인 진열존 + 체험존 + 카운터 + 상담존 + 재고존",
    "입구에서 대표 상품이 보이도록 포컬 포인트를 앞쪽에 배치",
    "고객 체류 경험과 판매 동선을 함께 고려한 mock 레이아웃",
  ];

  return { zones, furniture, assumptions };
}

function buildOtherLayout(
  width: number,
  height: number,
  headcount: number,
  detail: string | null
): { zones: LayoutZone[]; furniture: LayoutFurniture[]; assumptions: string[] } {
  const users = headcount > 0 ? headcount : 10;

  const zones: LayoutZone[] = [
    {
      type: "main_area",
      x: round1(width * 0.08),
      y: round1(height * 0.18),
      width: round1(width * 0.46),
      height: round1(height * 0.52),
      seats: users,
    },
    {
      type: "service_area",
      x: round1(width * 0.60),
      y: round1(height * 0.18),
      width: round1(width * 0.24),
      height: round1(height * 0.22),
    },
    {
      type: "support_area",
      x: round1(width * 0.60),
      y: round1(height * 0.46),
      width: round1(width * 0.24),
      height: round1(height * 0.18),
    },
    {
      type: "lounge",
      x: round1(width * 0.24),
      y: round1(height * 0.76),
      width: round1(width * 0.28),
      height: round1(height * 0.14),
      seats: 4,
    },
  ];

  const furniture: LayoutFurniture[] = [
    { type: "modular_table", count: 4 },
    { type: "chair", count: users },
    { type: "storage_unit", count: 2 },
    { type: "sofa", count: 1 },
  ];

  const assumptions = [
    `기타 업종(${detail?.trim() || "세부 미입력"}) 기준의 범용 commercial mock 레이아웃`,
    "주요 활동 공간 + 서비스 공간 + 보조 공간 + 라운지로 단순화",
    "세부 업종이 정교해지면 향후 전용 배치 규칙으로 확장 가능",
  ];

  return { zones, furniture, assumptions };
}

function buildMockLayout3D(project: OfficeProjectRow): Layout3DJson {
  const areaValue = parseArea(project.area);
  const widthHeight = buildSpaceDimensions(project.space_type, areaValue);
  const width = widthHeight.width;
  const height = widthHeight.height;
  const headcount = project.headcount ?? 0;

  let layoutResult:
    | { zones: LayoutZone[]; furniture: LayoutFurniture[]; assumptions: string[] }
    | undefined;

  switch (project.space_type) {
    case "office":
      layoutResult = buildOfficeLayout(width, height, headcount);
      break;
    case "cafe":
      layoutResult = buildCafeLayout(width, height, headcount);
      break;
    case "restaurant":
      layoutResult = buildRestaurantLayout(width, height, headcount);
      break;
    case "fitness":
      layoutResult = buildFitnessLayout(width, height, headcount);
      break;
    case "retail":
      layoutResult = buildRetailLayout(width, height, headcount);
      break;
    default:
      layoutResult = buildOtherLayout(
        width,
        height,
        headcount,
        project.space_type_detail
      );
      break;
  }

  return {
    version: 2,
    unit: "meter",
    project_context: {
      project_id: project.id,
      project_name: project.project_name,
      space_type: project.space_type,
      space_type_detail: project.space_type_detail,
      input_mode: project.input_mode,
      area: project.area,
      headcount: project.headcount,
      shape: project.shape,
    },
    space: {
      width,
      height,
      shape: project.shape || "rectangle",
    },
    zones: layoutResult.zones,
    furniture: layoutResult.furniture,
    assumptions: [
      ...layoutResult.assumptions,
      project.input_mode
        ? `입력 방식(${project.input_mode})을 참고했지만 현재는 mock 배치 규칙 기반으로 생성`
        : "입력 방식 정보가 없어 기본 규칙 기반으로 생성",
      areaValue
        ? `입력 면적 ${areaValue} 기준으로 전체 공간 크기를 추정`
        : "면적 정보가 없어 업종별 기본 크기를 사용",
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectId = Number(body?.projectId);

    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "올바른 projectId가 필요합니다." },
        { status: 400 }
      );
    }

    const { data: project, error: fetchError } = await supabase
      .from("office_projects")
      .select(
        "id, project_name, area, headcount, shape, notes, space_type, space_type_detail, input_mode"
      )
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: fetchError?.message || "프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await supabase
      .from("office_projects")
      .update({ layout_status: "processing" })
      .eq("id", projectId);

    const mockLayout3D = buildMockLayout3D(project as OfficeProjectRow);

    const { error: updateError } = await supabase
      .from("office_projects")
      .update({
        layout_status: "completed",
        layout_3d_json: mockLayout3D,
      })
      .eq("id", projectId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "3D 배치 저장 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "업종별 mock 3D 배치 결과가 저장되었습니다.",
      layout: mockLayout3D,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "3D 배치 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
