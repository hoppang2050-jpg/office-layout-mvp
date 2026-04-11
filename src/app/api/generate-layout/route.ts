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

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

type RequirementsJson = {
  [key: string]: JsonValue;
} | null;

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
  requirements_json: RequirementsJson;
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
  meta?: {
    capacity?: number;
    note?: string;
  };
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
    project_id: number;
    project_name: string | null;
    space_type: string | null;
    space_type_label: string;
    area: string | null;
    headcount: number | null;
    shape: string | null;
    input_mode: string | null;
  };
  space: LayoutSpace;
  zones: LayoutZone[];
  furniture: LayoutFurniture[];
  assumptions: string[];
  warnings: string[];
  requirements_snapshot: RequirementsJson;
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function parseArea(area: string | null): number | null {
  if (!area) return null;
  const num = Number(String(area).replace(/[^\d.]/g, ""));
  return Number.isNaN(num) ? null : num;
}

function getSpaceTypeLabel(
  spaceType: string | null,
  detail?: string | null
): string {
  switch (spaceType) {
    case "office":
      return "사무실";
    case "cafe":
      return "카페";
    case "restaurant":
      return "식당";
    case "fitness":
      return "피트니스";
    case "retail":
      return "리테일";
    case "other":
      return detail?.trim() || "기타";
    default:
      return detail?.trim() || "공간";
  }
}

function buildSpaceDimensions(
  areaValue: number | null,
  shape: string | null
): LayoutSpace {
  const safeArea = areaValue && areaValue > 0 ? areaValue : 120;

  let ratio = 1.4;
  if (shape?.includes("정사각")) ratio = 1.0;
  if (shape?.includes("직사각")) ratio = 1.6;
  if (shape?.includes("긴")) ratio = 2.0;

  const width = Math.sqrt(safeArea * ratio);
  const height = safeArea / width;

  return {
    width: round1(clamp(width, 8, 40)),
    height: round1(clamp(height, 6, 30)),
    unit: "m",
    shape: shape || "직사각형",
  };
}

function zoneColor(type: string): string {
  switch (type) {
    case "reception":
      return "#FDE68A";
    case "open_office":
      return "#BFDBFE";
    case "meeting_room":
      return "#C4B5FD";
    case "focus_room":
      return "#A7F3D0";
    case "pantry":
      return "#FBCFE8";
    case "counter":
      return "#FDE68A";
    case "bar":
      return "#FCA5A5";
    case "seating":
      return "#BFDBFE";
    case "pickup":
      return "#A7F3D0";
    case "kitchen":
      return "#FCA5A5";
    case "hall":
      return "#BFDBFE";
    case "waiting":
      return "#DDD6FE";
    case "cardio":
      return "#BFDBFE";
    case "weights":
      return "#FCA5A5";
    case "stretch":
      return "#A7F3D0";
    case "display":
      return "#BFDBFE";
    case "promo":
      return "#FDE68A";
    case "cashier":
      return "#FCA5A5";
    case "storage":
      return "#D1D5DB";
    default:
      return "#E5E7EB";
  }
}

function createZone(
  space: LayoutSpace,
  id: string,
  type: string,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  meta?: LayoutZone["meta"]
): LayoutZone {
  const safeX = round1(clamp(x, 0, Math.max(space.width - 1, 0)));
  const safeY = round1(clamp(y, 0, Math.max(space.height - 1, 0)));
  const safeWidth = round1(clamp(width, 1, Math.max(space.width - safeX, 1)));
  const safeHeight = round1(
    clamp(height, 1, Math.max(space.height - safeY, 1))
  );

  return {
    id,
    type,
    label,
    x: safeX,
    y: safeY,
    width: safeWidth,
    height: safeHeight,
    color: zoneColor(type),
    meta,
  };
}

function createFurniture(
  space: LayoutSpace,
  id: string,
  type: string,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation = 0
): LayoutFurniture {
  const safeX = round1(clamp(x, 0, Math.max(space.width - 0.5, 0)));
  const safeY = round1(clamp(y, 0, Math.max(space.height - 0.5, 0)));
  const safeWidth = round1(
    clamp(width, 0.4, Math.max(space.width - safeX, 0.4))
  );
  const safeHeight = round1(
    clamp(height, 0.4, Math.max(space.height - safeY, 0.4))
  );

  return {
    id,
    type,
    label,
    x: safeX,
    y: safeY,
    width: safeWidth,
    height: safeHeight,
    rotation,
  };
}

function buildOfficeLayout(project: OfficeProjectRow, space: LayoutSpace) {
  const pad = 0.6;
  const iw = space.width - pad * 2;
  const ih = space.height - pad * 2;
  const staff = project.headcount ?? 12;

  const zones: LayoutZone[] = [
    createZone(
      space,
      "zone-reception",
      "reception",
      "리셉션",
      pad,
      pad,
      iw * 0.22,
      ih * 0.18,
      { note: "방문객 응대" }
    ),
    createZone(
      space,
      "zone-meeting",
      "meeting_room",
      "회의실",
      pad + iw * 0.72,
      pad,
      iw * 0.28,
      ih * 0.24,
      { capacity: Math.max(4, Math.round(staff * 0.2)) }
    ),
    createZone(
      space,
      "zone-focus",
      "focus_room",
      "집중 업무실",
      pad,
      pad + ih * 0.72,
      iw * 0.24,
      ih * 0.28
    ),
    createZone(
      space,
      "zone-pantry",
      "pantry",
      "팬트리 / 라운지",
      pad + iw * 0.76,
      pad + ih * 0.78,
      iw * 0.24,
      ih * 0.22
    ),
    createZone(
      space,
      "zone-open-office",
      "open_office",
      "오픈 업무존",
      pad + iw * 0.26,
      pad + ih * 0.22,
      iw * 0.46,
      ih * 0.54,
      { capacity: staff }
    ),
  ];

  const deskCount = Math.max(4, Math.min(staff, 24));
  const deskCols = Math.max(2, Math.ceil(Math.sqrt(deskCount / 2)));
  const deskRows = Math.ceil(deskCount / deskCols);

  const openZone = zones.find((z) => z.id === "zone-open-office")!;
  const furniture: LayoutFurniture[] = [];

  let deskIndex = 1;
  for (let r = 0; r < deskRows; r += 1) {
    for (let c = 0; c < deskCols; c += 1) {
      if (deskIndex > deskCount) break;

      const fx =
        openZone.x + 0.6 + c * ((openZone.width - 1.2) / Math.max(deskCols, 1));
      const fy =
        openZone.y + 0.6 + r * ((openZone.height - 1.2) / Math.max(deskRows, 1));

      furniture.push(
        createFurniture(
          space,
          `desk-${deskIndex}`,
          "desk",
          `업무데스크 ${deskIndex}`,
          fx,
          fy,
          1.2,
          0.6
        )
      );

      deskIndex += 1;
    }
  }

  furniture.push(
    createFurniture(
      space,
      "meeting-table",
      "table",
      "회의 테이블",
      pad + iw * 0.8,
      pad + ih * 0.08,
      2.4,
      1.2
    ),
    createFurniture(
      space,
      "pantry-table",
      "table",
      "라운지 테이블",
      pad + iw * 0.82,
      pad + ih * 0.84,
      1.8,
      0.9
    )
  );

  return {
    zones,
    furniture,
    assumptions: [
      "사무실 유형 기준으로 오픈 업무존, 회의실, 집중실, 팬트리를 기본 배치했습니다.",
      "실제 출입문/창 위치 정보가 없으므로 일반적인 동선 기준으로 구성했습니다.",
    ],
  };
}

function buildCafeLayout(project: OfficeProjectRow, space: LayoutSpace) {
  const pad = 0.6;
  const iw = space.width - pad * 2;
  const ih = space.height - pad * 2;

  const zones: LayoutZone[] = [
    createZone(
      space,
      "zone-counter",
      "counter",
      "주문 카운터",
      pad,
      pad,
      iw * 0.28,
      ih * 0.22
    ),
    createZone(
      space,
      "zone-bar",
      "bar",
      "제조존",
      pad,
      pad + ih * 0.24,
      iw * 0.28,
      ih * 0.36
    ),
    createZone(
      space,
      "zone-pickup",
      "pickup",
      "픽업 / 대기존",
      pad + iw * 0.3,
      pad,
      iw * 0.22,
      ih * 0.2
    ),
    createZone(
      space,
      "zone-seating",
      "seating",
      "고객 좌석",
      pad + iw * 0.32,
      pad + ih * 0.24,
      iw * 0.68,
      ih * 0.76
    ),
  ];

  const seating = zones.find((z) => z.id === "zone-seating")!;
  const furniture: LayoutFurniture[] = [
    createFurniture(
      space,
      "counter-desk",
      "counter",
      "카운터",
      pad + 0.3,
      pad + 0.4,
      2.4,
      0.8
    ),
    createFurniture(
      space,
      "espresso-bar",
      "bar",
      "제조 바",
      pad + 0.4,
      pad + ih * 0.34,
      2.2,
      0.8
    ),
  ];

  let tableIndex = 1;
  const cols = Math.max(2, Math.floor(seating.width / 2.5));
  const rows = Math.max(2, Math.floor(seating.height / 2.2));

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = seating.x + 0.5 + c * 2.2;
      const y = seating.y + 0.5 + r * 2.0;

      if (
        x + 1.2 > seating.x + seating.width ||
        y + 1.2 > seating.y + seating.height
      ) {
        continue;
      }

      furniture.push(
        createFurniture(
          space,
          `cafe-table-${tableIndex}`,
          "table",
          `테이블 ${tableIndex}`,
          x,
          y,
          1.0,
          1.0
        )
      );
      tableIndex += 1;
    }
  }

  return {
    zones,
    furniture,
    assumptions: [
      "카페 유형 기준으로 주문 카운터, 제조존, 픽업존, 좌석을 분리 배치했습니다.",
      "실제 급배수/전기 위치가 없으므로 일반적인 운영 동선 기준입니다.",
    ],
  };
}

function buildRestaurantLayout(project: OfficeProjectRow, space: LayoutSpace) {
  const pad = 0.6;
  const iw = space.width - pad * 2;
  const ih = space.height - pad * 2;

  const zones: LayoutZone[] = [
    createZone(
      space,
      "zone-wait",
      "waiting",
      "대기존",
      pad,
      pad,
      iw * 0.18,
      ih * 0.18
    ),
    createZone(
      space,
      "zone-cashier",
      "cashier",
      "카운터",
      pad + iw * 0.2,
      pad,
      iw * 0.18,
      ih * 0.18
    ),
    createZone(
      space,
      "zone-kitchen",
      "kitchen",
      "주방",
      pad,
      pad + ih * 0.24,
      iw * 0.34,
      ih * 0.76
    ),
    createZone(
      space,
      "zone-hall",
      "hall",
      "홀 좌석",
      pad + iw * 0.38,
      pad,
      iw * 0.62,
      ih
    ),
  ];

  const hall = zones.find((z) => z.id === "zone-hall")!;
  const furniture: LayoutFurniture[] = [
    createFurniture(
      space,
      "cashier-desk",
      "counter",
      "결제 카운터",
      pad + iw * 0.23,
      pad + 0.35,
      1.8,
      0.8
    ),
    createFurniture(
      space,
      "kitchen-line",
      "kitchen",
      "조리 라인",
      pad + 0.5,
      pad + ih * 0.4,
      2.4,
      0.8
    ),
  ];

  let idx = 1;
  const cols = Math.max(2, Math.floor(hall.width / 2.4));
  const rows = Math.max(2, Math.floor(hall.height / 2.2));

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = hall.x + 0.4 + c * 2.1;
      const y = hall.y + 0.5 + r * 2.0;

      if (x + 1.2 > hall.x + hall.width || y + 1.2 > hall.y + hall.height) {
        continue;
      }

      furniture.push(
        createFurniture(
          space,
          `hall-table-${idx}`,
          "table",
          `홀 테이블 ${idx}`,
          x,
          y,
          1.2,
          1.2
        )
      );
      idx += 1;
    }
  }

  return {
    zones,
    furniture,
    assumptions: [
      "식당 유형 기준으로 홀과 주방을 분리하고 대기/결제 흐름을 입구 측에 배치했습니다.",
      "실제 배기/설비 위치가 반영되지 않은 기본안입니다.",
    ],
  };
}

function buildFitnessLayout(project: OfficeProjectRow, space: LayoutSpace) {
  const pad = 0.6;
  const iw = space.width - pad * 2;
  const ih = space.height - pad * 2;

  const zones: LayoutZone[] = [
    createZone(
      space,
      "zone-reception",
      "reception",
      "리셉션",
      pad,
      pad,
      iw * 0.22,
      ih * 0.18
    ),
    createZone(
      space,
      "zone-cardio",
      "cardio",
      "유산소존",
      pad + iw * 0.24,
      pad,
      iw * 0.38,
      ih * 0.42
    ),
    createZone(
      space,
      "zone-weights",
      "weights",
      "웨이트존",
      pad,
      pad + ih * 0.22,
      iw * 0.36,
      ih * 0.78
    ),
    createZone(
      space,
      "zone-stretch",
      "stretch",
      "스트레칭존",
      pad + iw * 0.64,
      pad + ih * 0.48,
      iw * 0.36,
      ih * 0.52
    ),
  ];

  const furniture: LayoutFurniture[] = [
    createFurniture(
      space,
      "desk-reception",
      "counter",
      "리셉션 데스크",
      pad + 0.4,
      pad + 0.4,
      1.8,
      0.8
    ),
    createFurniture(
      space,
      "treadmill-1",
      "machine",
      "런닝머신 1",
      pad + iw * 0.3,
      pad + 0.6,
      1.8,
      0.9
    ),
    createFurniture(
      space,
      "treadmill-2",
      "machine",
      "런닝머신 2",
      pad + iw * 0.45,
      pad + 0.6,
      1.8,
      0.9
    ),
    createFurniture(
      space,
      "rack-1",
      "weights",
      "웨이트 랙",
      pad + 0.8,
      pad + ih * 0.4,
      2.0,
      0.9
    ),
    createFurniture(
      space,
      "mat-1",
      "mat",
      "스트레칭 매트",
      pad + iw * 0.72,
      pad + ih * 0.62,
      1.6,
      0.8
    ),
  ];

  return {
    zones,
    furniture,
    assumptions: [
      "피트니스 유형 기준으로 리셉션, 유산소, 웨이트, 스트레칭 구역을 구분했습니다.",
      "안전 거리와 기구 간격은 실제 장비 스펙에 맞게 재조정이 필요합니다.",
    ],
  };
}

function buildRetailLayout(project: OfficeProjectRow, space: LayoutSpace) {
  const pad = 0.6;
  const iw = space.width - pad * 2;
  const ih = space.height - pad * 2;

  const zones: LayoutZone[] = [
    createZone(
      space,
      "zone-promo",
      "promo",
      "프로모션존",
      pad,
      pad,
      iw * 0.24,
      ih * 0.22
    ),
    createZone(
      space,
      "zone-display-main",
      "display",
      "메인 진열존",
      pad + iw * 0.26,
      pad,
      iw * 0.48,
      ih * 0.72
    ),
    createZone(
      space,
      "zone-display-sub",
      "display",
      "보조 진열존",
      pad,
      pad + ih * 0.26,
      iw * 0.22,
      ih * 0.6
    ),
    createZone(
      space,
      "zone-cashier",
      "cashier",
      "계산대",
      pad + iw * 0.78,
      pad,
      iw * 0.22,
      ih * 0.2
    ),
    createZone(
      space,
      "zone-storage",
      "storage",
      "재고 / 수납",
      pad + iw * 0.78,
      pad + ih * 0.24,
      iw * 0.22,
      ih * 0.3
    ),
  ];

  const furniture: LayoutFurniture[] = [
    createFurniture(
      space,
      "promo-table",
      "display",
      "프로모션 테이블",
      pad + 0.6,
      pad + 0.6,
      1.6,
      1.0
    ),
    createFurniture(
      space,
      "cashier-desk",
      "counter",
      "계산대",
      pad + iw * 0.82,
      pad + 0.4,
      1.8,
      0.8
    ),
    createFurniture(
      space,
      "display-rack-1",
      "rack",
      "진열 랙 1",
      pad + iw * 0.34,
      pad + 0.8,
      0.8,
      3.0
    ),
    createFurniture(
      space,
      "display-rack-2",
      "rack",
      "진열 랙 2",
      pad + iw * 0.48,
      pad + 0.8,
      0.8,
      3.0
    ),
    createFurniture(
      space,
      "display-rack-3",
      "rack",
      "진열 랙 3",
      pad + iw * 0.62,
      pad + 0.8,
      0.8,
      3.0
    ),
  ];

  return {
    zones,
    furniture,
    assumptions: [
      "리테일 유형 기준으로 진입 시야와 메인 진열 흐름을 우선 고려했습니다.",
      "실제 상품 크기와 카테고리에 따라 랙 수량은 조정이 필요합니다.",
    ],
  };
}

function buildOtherLayout(project: OfficeProjectRow, space: LayoutSpace) {
  const pad = 0.6;
  const iw = space.width - pad * 2;
  const ih = space.height - pad * 2;

  const zones: LayoutZone[] = [
    createZone(
      space,
      "zone-main",
      "display",
      "메인 사용 구역",
      pad,
      pad,
      iw * 0.62,
      ih * 0.72
    ),
    createZone(
      space,
      "zone-support",
      "storage",
      "보조 기능 구역",
      pad + iw * 0.66,
      pad,
      iw * 0.34,
      ih * 0.42
    ),
    createZone(
      space,
      "zone-service",
      "reception",
      "응대 / 전면 구역",
      pad + iw * 0.66,
      pad + ih * 0.48,
      iw * 0.34,
      ih * 0.24
    ),
    createZone(
      space,
      "zone-storage",
      "storage",
      "수납 구역",
      pad,
      pad + ih * 0.76,
      iw * 0.36,
      ih * 0.24
    ),
  ];

  const furniture: LayoutFurniture[] = [
    createFurniture(
      space,
      "main-table",
      "table",
      "메인 테이블",
      pad + 1.0,
      pad + 1.0,
      2.2,
      1.2
    ),
    createFurniture(
      space,
      "support-shelf",
      "shelf",
      "보조 수납",
      pad + iw * 0.74,
      pad + 0.8,
      1.2,
      2.4
    ),
  ];

  return {
    zones,
    furniture,
    assumptions: [
      "기타 유형은 범용 공간으로 가정해 메인 구역과 보조 구역 중심으로 배치했습니다.",
      "업종 특성이 명확해지면 맞춤 zoning으로 다시 생성하는 것이 좋습니다.",
    ],
  };
}

function buildMockLayout3D(project: OfficeProjectRow): Layout3DJson {
  const areaValue = parseArea(project.area);
  const space = buildSpaceDimensions(areaValue, project.shape);

  let result:
    | ReturnType<typeof buildOfficeLayout>
    | ReturnType<typeof buildCafeLayout>
    | ReturnType<typeof buildRestaurantLayout>
    | ReturnType<typeof buildFitnessLayout>
    | ReturnType<typeof buildRetailLayout>
    | ReturnType<typeof buildOtherLayout>;

  switch (project.space_type) {
    case "office":
      result = buildOfficeLayout(project, space);
      break;
    case "cafe":
      result = buildCafeLayout(project, space);
      break;
    case "restaurant":
      result = buildRestaurantLayout(project, space);
      break;
    case "fitness":
      result = buildFitnessLayout(project, space);
      break;
    case "retail":
      result = buildRetailLayout(project, space);
      break;
    default:
      result = buildOtherLayout(project, space);
      break;
  }

  return {
    version: "1.0",
    generated_at: new Date().toISOString(),
    project_summary: {
      project_id: project.id,
      project_name: project.project_name,
      space_type: project.space_type,
      space_type_label: getSpaceTypeLabel(
        project.space_type,
        project.space_type_detail
      ),
      area: project.area,
      headcount: project.headcount,
      shape: project.shape,
      input_mode: project.input_mode,
    },
    space,
    zones: result.zones,
    furniture: result.furniture,
    assumptions: result.assumptions,
    warnings: [
      "현재 배치는 MVP용 자동 생성 예시입니다.",
      "실제 출입문, 창호, 기둥, 설비 위치 정보는 반영되지 않았습니다.",
    ],
    requirements_snapshot: project.requirements_json,
  };
}

export async function POST(request: NextRequest) {
  let projectId: number | null = null;

  try {
    const body = await request.json();
    projectId = Number(body?.projectId);

    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "올바른 projectId가 필요합니다." },
        { status: 400 }
      );
    }

    const { data: project, error: fetchError } = await supabase
      .from("office_projects")
      .select(
        `
        id,
        project_name,
        area,
        headcount,
        shape,
        notes,
        space_type,
        space_type_detail,
        input_mode,
        requirements_json
        `
      )
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: fetchError?.message || "프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { error: processingError } = await supabase
      .from("office_projects")
      .update({
        layout_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (processingError) {
      return NextResponse.json(
        {
          error:
            processingError.message || "3D 배치 상태 업데이트에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    const layout3D = buildMockLayout3D(project as OfficeProjectRow);

    const { error: updateError } = await supabase
      .from("office_projects")
      .update({
        layout_status: "completed",
        layout_3d_json: layout3D,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "3D 배치 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "3D 배치 생성이 완료되었습니다.",
      layout: layout3D,
    });
  } catch (error: any) {
    if (projectId) {
      await supabase
        .from("office_projects")
        .update({
          layout_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);
    }

    return NextResponse.json(
      { error: error?.message || "3D 배치 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
