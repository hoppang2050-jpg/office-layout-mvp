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

type OfficeProjectRow = {
  id: string;
  project_name?: string | null;
  client_name?: string | null;
  space_type?: string | null;
  area_size?: number | string | null;
  requirements_json?: JsonObject | null;
  analysis_json?: JsonObject | null;
  design_concept_json?: JsonObject | null;
  [key: string]: any;
};

type LayoutSpace = {
  width: number;
  height: number;
  unit: "m";
  shape: string;
};

type LayoutZone = {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  meta?: JsonObject;
};

type LayoutFurniture = {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

type Layout3DJson = {
  version: string;
  generated_at: string;
  project_summary: {
    project_id: string;
    project_name: string;
    client_name: string | null;
    space_type: string;
    estimated_area_m2: number;
    concept_name: string | null;
  };
  space: LayoutSpace;
  zones: LayoutZone[];
  furniture: LayoutFurniture[];
  assumptions: string[];
  warnings: string[];
  requirements_snapshot: JsonObject;
};

type LayoutBuildResult = {
  zones: LayoutZone[];
  furniture: LayoutFurniture[];
  assumptions: string[];
  warnings: string[];
};

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    if (cleaned) {
      const parsed = Number(cleaned[0]);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function getSpaceTypeKey(raw?: string | null): string {
  const value = (raw || "").toLowerCase();

  if (
    value.includes("office") ||
    value.includes("work") ||
    value.includes("사무실") ||
    value.includes("오피스")
  ) {
    return "office";
  }

  if (value.includes("cafe") || value.includes("coffee") || value.includes("카페")) {
    return "cafe";
  }

  if (
    value.includes("restaurant") ||
    value.includes("dining") ||
    value.includes("food") ||
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
    value.includes("매장") ||
    value.includes("리테일")
  ) {
    return "retail";
  }

  return "other";
}

function getSpaceTypeLabel(raw?: string | null): string {
  const key = getSpaceTypeKey(raw);

  switch (key) {
    case "office":
      return "오피스";
    case "cafe":
      return "카페";
    case "restaurant":
      return "레스토랑";
    case "fitness":
      return "피트니스";
    case "retail":
      return "리테일";
    default:
      return raw?.trim() || "일반 상업공간";
  }
}

function parseArea(project: OfficeProjectRow): number {
  const req = isObject(project.requirements_json) ? project.requirements_json : {};

  const candidates: unknown[] = [
    project.area_size,
    req.area_size,
    req.total_area,
    req.area,
    req.size,
    isObject(req.dimensions) ? req.dimensions.area : undefined,
  ];

  for (const value of candidates) {
    const num = toNumber(value, NaN);
    if (Number.isFinite(num) && num > 0) {
      return num;
    }
  }

  return 80;
}

function buildSpaceDimensions(project: OfficeProjectRow): LayoutSpace {
  const req = isObject(project.requirements_json) ? project.requirements_json : {};
  const dims = isObject(req.dimensions) ? req.dimensions : {};

  const directWidth = toNumber(
    req.width ?? req.space_width ?? dims.width,
    NaN
  );
  const directHeight = toNumber(
    req.height ?? req.space_height ?? dims.height,
    NaN
  );

  if (
    Number.isFinite(directWidth) &&
    directWidth > 0 &&
    Number.isFinite(directHeight) &&
    directHeight > 0
  ) {
    return {
      width: round1(directWidth),
      height: round1(directHeight),
      unit: "m",
      shape: typeof req.shape === "string" ? req.shape : "rectangular",
    };
  }

  const area = clamp(parseArea(project), 20, 2000);
  const typeKey = getSpaceTypeKey(project.space_type);

  const ratioMap: Record<string, number> = {
    office: 1.35,
    cafe: 1.5,
    restaurant: 1.3,
    fitness: 1.2,
    retail: 1.6,
    other: 1.4,
  };

  const ratio = ratioMap[typeKey] ?? 1.4;
  const width = Math.sqrt(area * ratio);
  const height = area / width;

  return {
    width: round1(width),
    height: round1(height),
    unit: "m",
    shape: typeof req.shape === "string" ? req.shape : "rectangular",
  };
}

function zoneColor(type: string): string {
  const map: Record<string, string> = {
    reception: "#BFDBFE",
    waiting: "#C7D2FE",
    open_office: "#A7F3D0",
    meeting_room: "#FDE68A",
    lounge: "#FBCFE8",
    pantry: "#FED7AA",
    service_bar: "#FCA5A5",
    pickup: "#DDD6FE",
    prep: "#A5F3FC",
    seating: "#86EFAC",
    dining: "#86EFAC",
    kitchen: "#FDBA74",
    cashier: "#F9A8D4",
    cardio: "#93C5FD",
    weights: "#FDE68A",
    studio: "#C4B5FD",
    locker: "#FCA5A5",
    display: "#A7F3D0",
    fitting: "#E9D5FF",
    stockroom: "#D1D5DB",
    support: "#D1FAE5",
    main: "#A7F3D0",
  };

  return map[type] ?? "#CBD5E1";
}

function createZone(params: {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  meta?: JsonObject;
}): LayoutZone {
  return {
    id: params.id,
    type: params.type,
    label: params.label,
    x: round1(params.x),
    y: round1(params.y),
    width: round1(params.width),
    height: round1(params.height),
    color: zoneColor(params.type),
    meta: params.meta ?? {},
  };
}

function createFurniture(params: {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}): LayoutFurniture {
  return {
    id: params.id,
    type: params.type,
    label: params.label,
    x: round1(params.x),
    y: round1(params.y),
    width: round1(params.width),
    height: round1(params.height),
    rotation: params.rotation ?? 0,
  };
}

function buildCafeLayout(space: LayoutSpace): LayoutBuildResult {
  const w = space.width;
  const h = space.height;
  const gap = 0.4;

  const serviceDepth = clamp(h * 0.24, 2.4, 3.4);
  const barWidth = clamp(w * 0.48, 4.5, 7.5);
  const pickupWidth = clamp(w * 0.18, 1.8, 3.2);
  const prepX = barWidth + pickupWidth + gap * 2;
  const prepWidth = Math.max(2.2, round1(w - prepX));
  const seatingY = serviceDepth + gap;

  const zones: LayoutZone[] = [
    createZone({
      id: "zone-service-bar",
      type: "service_bar",
      label: "주문 카운터",
      x: 0,
      y: 0,
      width: barWidth,
      height: serviceDepth,
      meta: { note: "주문 / 결제 / 음료 인도" },
    }),
    createZone({
      id: "zone-pickup",
      type: "pickup",
      label: "픽업 / 대기존",
      x: barWidth + gap,
      y: 0,
      width: pickupWidth,
      height: serviceDepth,
      meta: { note: "픽업 및 대기" },
    }),
    createZone({
      id: "zone-prep",
      type: "prep",
      label: "제조존",
      x: prepX,
      y: 0,
      width: prepWidth,
      height: serviceDepth,
      meta: { note: "제조 / 세척 / 준비" },
    }),
    createZone({
      id: "zone-seating",
      type: "seating",
      label: "좌석존",
      x: 0,
      y: seatingY,
      width: w,
      height: h - seatingY,
      meta: { note: "메인 고객 좌석" },
    }),
  ];

  const furniture: LayoutFurniture[] = [
    createFurniture({
      id: "f-bar-counter",
      type: "counter",
      label: "주문 카운터",
      x: 0.5,
      y: 0.6,
      width: Math.max(2.8, barWidth - 1),
      height: 0.8,
    }),
    createFurniture({
      id: "f-pickup-shelf",
      type: "shelf",
      label: "픽업 선반",
      x: barWidth + gap + 0.3,
      y: 0.7,
      width: Math.max(1, pickupWidth - 0.6),
      height: 0.5,
    }),
    createFurniture({
      id: "f-prep-counter",
      type: "counter",
      label: "준비대",
      x: prepX + 0.3,
      y: 0.5,
      width: Math.max(1.4, prepWidth - 0.6),
      height: 0.7,
    }),
  ];

  const seatZoneHeight = h - seatingY;
  const cols = Math.max(2, Math.min(5, Math.floor(w / 2.2)));
  const rows = Math.max(2, Math.min(6, Math.floor(seatZoneHeight / 1.8)));
  const stepX = w / cols;
  const stepY = seatZoneHeight / rows;

  let chairIndex = 1;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = 0.6 + c * stepX;
      const y = seatingY + 0.6 + r * stepY;
      if (x + 0.5 <= w - 0.2 && y + 0.5 <= h - 0.2) {
        furniture.push(
          createFurniture({
            id: `f-seat-${chairIndex}`,
            type: "chair",
            label: "좌석",
            x,
            y,
            width: 0.5,
            height: 0.5,
          })
        );
        chairIndex += 1;
      }
    }
  }

  return {
    zones,
    furniture,
    assumptions: [
      "주문-픽업-착석 흐름을 자연스럽게 이어지도록 전면 서비스 구역을 구성했습니다.",
      "제조존은 카운터와 인접하게 배치해 운영 동선을 단축했습니다.",
    ],
    warnings: [],
  };
}

function buildOfficeLayout(space: LayoutSpace): LayoutBuildResult {
  const w = space.width;
  const h = space.height;

  const zones: LayoutZone[] = [
    createZone({
      id: "zone-open-office",
      type: "open_office",
      label: "오픈 오피스",
      x: 0,
      y: 0,
      width: w * 0.65,
      height: h,
      meta: { note: "주 업무공간" },
    }),
    createZone({
      id: "zone-meeting",
      type: "meeting_room",
      label: "미팅룸",
      x: w * 0.67,
      y: 0,
      width: w * 0.33,
      height: h * 0.4,
      meta: { capacity: 6 },
    }),
    createZone({
      id: "zone-pantry",
      type: "pantry",
      label: "팬트리",
      x: w * 0.67,
      y: h * 0.42,
      width: w * 0.33,
      height: h * 0.25,
    }),
    createZone({
      id: "zone-lounge",
      type: "lounge",
      label: "라운지",
      x: w * 0.67,
      y: h * 0.69,
      width: w * 0.33,
      height: h * 0.31,
    }),
  ];

  const furniture: LayoutFurniture[] = [
    createFurniture({
      id: "f-meeting-table",
      type: "table",
      label: "회의 테이블",
      x: w * 0.73,
      y: 0.8,
      width: 2.0,
      height: 1.0,
    }),
  ];

  return {
    zones,
    furniture,
    assumptions: ["업무영역과 보조영역을 분리한 기본 오피스 레이아웃입니다."],
    warnings: [],
  };
}

function buildRestaurantLayout(space: LayoutSpace): LayoutBuildResult {
  const w = space.width;
  const h = space.height;

  const zones: LayoutZone[] = [
    createZone({
      id: "zone-dining",
      type: "dining",
      label: "홀 좌석",
      x: 0,
      y: 0,
      width: w * 0.7,
      height: h,
    }),
    createZone({
      id: "zone-kitchen",
      type: "kitchen",
      label: "주방",
      x: w * 0.72,
      y: 0,
      width: w * 0.28,
      height: h * 0.7,
    }),
    createZone({
      id: "zone-support",
      type: "support",
      label: "서비스 / 창고",
      x: w * 0.72,
      y: h * 0.72,
      width: w * 0.28,
      height: h * 0.28,
    }),
  ];

  return {
    zones,
    furniture: [],
    assumptions: ["주방과 홀을 분리한 기본 레스토랑 레이아웃입니다."],
    warnings: [],
  };
}

function buildFitnessLayout(space: LayoutSpace): LayoutBuildResult {
  const w = space.width;
  const h = space.height;

  const zones: LayoutZone[] = [
    createZone({
      id: "zone-cardio",
      type: "cardio",
      label: "유산소",
      x: 0,
      y: 0,
      width: w * 0.35,
      height: h,
    }),
    createZone({
      id: "zone-weights",
      type: "weights",
      label: "웨이트",
      x: w * 0.37,
      y: 0,
      width: w * 0.35,
      height: h,
    }),
    createZone({
      id: "zone-studio",
      type: "studio",
      label: "GX / 스트레칭",
      x: w * 0.74,
      y: 0,
      width: w * 0.26,
      height: h,
    }),
  ];

  return {
    zones,
    furniture: [],
    assumptions: ["운동 종류별로 구역을 분리한 기본 피트니스 레이아웃입니다."],
    warnings: [],
  };
}

function buildRetailLayout(space: LayoutSpace): LayoutBuildResult {
  const w = space.width;
  const h = space.height;

  const zones: LayoutZone[] = [
    createZone({
      id: "zone-display",
      type: "display",
      label: "메인 진열",
      x: 0,
      y: 0,
      width: w * 0.7,
      height: h,
    }),
    createZone({
      id: "zone-cashier",
      type: "cashier",
      label: "결제대",
      x: w * 0.72,
      y: 0,
      width: w * 0.28,
      height: h * 0.28,
    }),
    createZone({
      id: "zone-stock",
      type: "stockroom",
      label: "창고",
      x: w * 0.72,
      y: h * 0.3,
      width: w * 0.28,
      height: h * 0.7,
    }),
  ];

  return {
    zones,
    furniture: [],
    assumptions: ["판매공간과 운영공간을 나눈 기본 리테일 레이아웃입니다."],
    warnings: [],
  };
}

function buildOtherLayout(space: LayoutSpace): LayoutBuildResult {
  const w = space.width;
  const h = space.height;

  const zones: LayoutZone[] = [
    createZone({
      id: "zone-main",
      type: "main",
      label: "메인 공간",
      x: 0,
      y: 0,
      width: w,
      height: h,
    }),
  ];

  return {
    zones,
    furniture: [],
    assumptions: ["공간 유형 정보가 부족해 범용 레이아웃으로 생성했습니다."],
    warnings: ["space_type 정보가 제한적입니다."],
  };
}

function buildMockLayout3D(project: OfficeProjectRow): Layout3DJson {
  const space = buildSpaceDimensions(project);
  const typeKey = getSpaceTypeKey(project.space_type);

  let result: LayoutBuildResult;

  switch (typeKey) {
    case "office":
      result = buildOfficeLayout(space);
      break;
    case "cafe":
      result = buildCafeLayout(space);
      break;
    case "restaurant":
      result = buildRestaurantLayout(space);
      break;
    case "fitness":
      result = buildFitnessLayout(space);
      break;
    case "retail":
      result = buildRetailLayout(space);
      break;
    default:
      result = buildOtherLayout(space);
      break;
  }

  const conceptJson = isObject(project.design_concept_json)
    ? project.design_concept_json
    : {};

  const conceptName =
    typeof conceptJson.concept_name === "string"
      ? conceptJson.concept_name
      : typeof conceptJson.name === "string"
      ? conceptJson.name
      : typeof conceptJson.title === "string"
      ? conceptJson.title
      : null;

  const requirementsSnapshot = isObject(project.requirements_json)
    ? project.requirements_json
    : {};

  return {
    version: "1.0.1",
    generated_at: new Date().toISOString(),
    project_summary: {
      project_id: project.id,
      project_name: project.project_name || "이름 없는 프로젝트",
      client_name: project.client_name || null,
      space_type: getSpaceTypeLabel(project.space_type),
      estimated_area_m2: round1(space.width * space.height),
      concept_name: conceptName,
    },
    space,
    zones: result.zones,
    furniture: result.furniture,
    assumptions: result.assumptions,
    warnings: result.warnings,
    requirements_snapshot: requirementsSnapshot,
  };
}

export async function POST(request: NextRequest) {
  let projectId: string | null = null;

  try {
    let body: any = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const url = new URL(request.url);

    projectId =
      body?.projectId ||
      body?.id ||
      url.searchParams.get("projectId") ||
      url.searchParams.get("id");

    console.log("generate-layout received projectId:", projectId);
    console.log("generate-layout received body:", body);

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

    const typedProject = project as OfficeProjectRow;

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

    const layout3D = buildMockLayout3D(typedProject);

    const { error: saveError } = await supabase
      .from("office_projects")
      .update({
        layout_status: "completed",
        layout_3d_json: layout3D,
      })
      .eq("id", projectId);

    if (saveError) {
      await supabase
        .from("office_projects")
        .update({
          layout_status: "failed",
        })
        .eq("id", projectId);

      return NextResponse.json(
        { error: "생성된 layout_3d_json 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      layout: layout3D,
    });
  } catch (error) {
    console.error("generate-layout POST error:", error);

    if (projectId) {
      await supabase
        .from("office_projects")
        .update({
          layout_status: "failed",
        })
        .eq("id", projectId);
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "3D 배치 생성 중 알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
