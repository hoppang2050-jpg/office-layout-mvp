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

type JsonObject = { [key: string]: JsonValue };

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
  file_url: string | null;
  file_name: string | null;
  requirements_json: JsonObject | null;
  analysis_json: JsonObject | null;
};

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

function getInputModeLabel(inputMode: string | null): string {
  switch (inputMode) {
    case "floorplan":
      return "정식 도면";
    case "sketch":
      return "손그림 스케치";
    case "no_drawing":
      return "도면 없음";
    default:
      return "입력 방식 미지정";
  }
}

function normalizeStringArray(values: string[]): string[] {
  return values.filter((item) => item && item.trim().length > 0);
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function buildSharedMeta(project: OfficeProjectRow) {
  const areaValue = parseArea(project.area);
  const headcount = project.headcount ?? 0;
  const notesText = (project.notes ?? "").trim();
  const spaceTypeLabel = getSpaceTypeLabel(
    project.space_type,
    project.space_type_detail
  );
  const inputModeLabel = getInputModeLabel(project.input_mode);

  return {
    areaValue,
    headcount,
    notesText,
    spaceTypeLabel,
    inputModeLabel,
  };
}

function pickMoodByNotes(notesText: string, fallback: string) {
  const text = notesText.toLowerCase();

  if (
    includesAny(text, [
      "편안",
      "따뜻",
      "안락",
      "휴식",
      "웜",
      "cozy",
      "calm",
      "relax",
    ])
  ) {
    return "따뜻하고 편안한 무드";
  }

  if (
    includesAny(text, [
      "고급",
      "프리미엄",
      "세련",
      "럭셔리",
      "elegant",
      "premium",
      "luxury",
    ])
  ) {
    return "정돈되고 고급스러운 무드";
  }

  if (
    includesAny(text, [
      "활기",
      "밝",
      "에너지",
      "역동",
      "dynamic",
      "active",
      "energetic",
    ])
  ) {
    return "활기차고 에너지 있는 무드";
  }

  if (
    includesAny(text, [
      "미니멀",
      "깔끔",
      "심플",
      "simple",
      "minimal",
      "clean",
    ])
  ) {
    return "미니멀하고 정제된 무드";
  }

  return fallback;
}

function buildOfficeConcept(project: OfficeProjectRow) {
  const { areaValue, headcount, notesText, spaceTypeLabel, inputModeLabel } =
    buildSharedMeta(project);

  const baseMood = pickMoodByNotes(notesText, "집중과 협업이 균형 잡힌 스마트 오피스 무드");
  const conceptName =
    headcount >= 30 ? "Collaborative Flow Office" : "Balanced Focus Office";

  return {
    concept_name: conceptName,
    title: conceptName,
    summary:
      `${spaceTypeLabel}의 핵심은 집중 업무와 협업 공간의 균형입니다. ` +
      `오픈 업무존을 중심으로 회의/집중/휴게 구역을 명확히 분리하고, ` +
      `동선은 단순하게 유지하는 방향의 컨셉을 제안합니다.`,
    concept_summary:
      "업무 효율성과 직원 체감 편안함을 동시에 높이는 방향의 오피스 컨셉입니다.",
    mood: baseMood,
    mood_line: baseMood,
    keywords: normalizeStringArray([
      "집중과 협업의 균형",
      "깔끔한 동선",
      "편안한 업무 환경",
      areaValue && areaValue >= 200 ? "확장감 있는 레이아웃" : "밀도 조절형 레이아웃",
      headcount >= 20 ? "팀 단위 협업" : "소규모 집중 업무",
    ]),
    recommended_zones: normalizeStringArray([
      "오픈 업무존",
      "회의실",
      "집중 업무실",
      "팬트리 / 라운지",
      headcount >= 25 ? "소규모 폰부스 / 1인 미팅존" : "",
    ]),
    color_palette: [
      { label: "Soft Ivory", hex: "#F8F5EF" },
      { label: "Slate Gray", hex: "#64748B" },
      { label: "Muted Blue", hex: "#AFC8E8" },
      { label: "Warm Wood", hex: "#C89F7A" },
      { label: "Calm Green", hex: "#B7D7C2" },
    ],
    spatial_direction: [
      "입구에서 메인 업무존까지 직관적인 접근 흐름을 유지합니다.",
      "회의/커뮤니케이션 공간은 공용 동선과 가깝게 배치합니다.",
      "집중 업무 구역은 상대적으로 조용한 후면 영역에 배치합니다.",
    ],
    materials: [
      "우드 텍스처 포인트 마감",
      "무광 메탈 또는 매트 블랙 디테일",
      "패브릭 흡음 패널",
      "관리 쉬운 바닥 마감재",
    ],
    lighting_direction: [
      "업무존은 균일하고 눈부심이 적은 베이스 조명",
      "라운지/팬트리는 따뜻한 색온도 포인트 조명",
      "회의실은 집중감 있는 중성광",
    ],
    furniture_direction: [
      "직선형 데스크 배치와 이동성 좋은 보조 가구 구성",
      "공용 라운지에는 가벼운 소파/테이블 조합",
      "회의실은 심플한 대형 테이블 중심 구성",
    ],
    project_context: {
      project_name: project.project_name,
      area: project.area,
      parsed_area: areaValue,
      headcount,
      shape: project.shape,
      input_mode: project.input_mode,
      input_mode_label: inputModeLabel,
      file_name: project.file_name,
      notes: project.notes,
    },
    generated_at: new Date().toISOString(),
    source: "mock-concept-generator-mvp",
  };
}

function buildCafeConcept(project: OfficeProjectRow) {
  const { areaValue, headcount, notesText, spaceTypeLabel, inputModeLabel } =
    buildSharedMeta(project);

  const baseMood = pickMoodByNotes(notesText, "따뜻하고 머무르고 싶은 카페 무드");
  const conceptName =
    areaValue && areaValue >= 120 ? "Warm Community Café" : "Compact Cozy Café";

  return {
    concept_name: conceptName,
    title: conceptName,
    summary:
      `${spaceTypeLabel}는 첫인상과 체류감이 중요합니다. ` +
      `주문-대기-픽업 흐름을 명확히 하고, 좌석 밀도는 과하지 않게 조정하여 ` +
      `편안한 체류 경험을 만드는 방향으로 컨셉을 제안합니다.`,
    concept_summary:
      "고객이 자연스럽게 머물고 재방문하고 싶어지는 따뜻한 카페 컨셉입니다.",
    mood: baseMood,
    mood_line: baseMood,
    keywords: normalizeStringArray([
      "따뜻한 체류감",
      "명확한 주문 동선",
      "편안한 좌석 구성",
      "감성 조명",
      headcount >= 5 ? "운영 효율" : "소형 매장 최적화",
    ]),
    recommended_zones: [
      "주문 카운터",
      "제조존",
      "픽업 / 대기존",
      "메인 좌석존",
      "창가 / 포인트 좌석",
    ],
    color_palette: [
      { label: "Cream", hex: "#F6EFE5" },
      { label: "Terracotta", hex: "#C97C5D" },
      { label: "Espresso Brown", hex: "#6F4E37" },
      { label: "Sage Green", hex: "#B7C4A8" },
      { label: "Soft Charcoal", hex: "#4B5563" },
    ],
    spatial_direction: [
      "입구 진입 후 주문 위치가 바로 인지되도록 구성합니다.",
      "대기와 좌석 흐름이 충돌하지 않도록 픽업 동선을 분리합니다.",
      "벽면/창가 좌석에 체류 포인트를 줍니다.",
    ],
    materials: [
      "우드 베니어 또는 오크 계열 마감",
      "따뜻한 질감의 타일 또는 스톤 포인트",
      "패브릭 또는 가죽 느낌의 좌석 마감",
    ],
    lighting_direction: [
      "카운터는 선명한 작업 조명",
      "좌석은 따뜻한 색온도의 펜던트/간접 조명",
      "포인트 벽면은 브랜드 감성이 드러나는 연출 조명",
    ],
    furniture_direction: [
      "2인석과 4인석을 혼합해 좌석 유연성 확보",
      "바 좌석 또는 창가 포인트 좌석 배치",
      "대기 공간은 시각적으로 답답하지 않게 최소 구성",
    ],
    project_context: {
      project_name: project.project_name,
      area: project.area,
      parsed_area: areaValue,
      headcount,
      shape: project.shape,
      input_mode: project.input_mode,
      input_mode_label: inputModeLabel,
      file_name: project.file_name,
      notes: project.notes,
    },
    generated_at: new Date().toISOString(),
    source: "mock-concept-generator-mvp",
  };
}

function buildRestaurantConcept(project: OfficeProjectRow) {
  const { areaValue, headcount, notesText, spaceTypeLabel, inputModeLabel } =
    buildSharedMeta(project);

  const baseMood = pickMoodByNotes(notesText, "정돈되고 식사 경험이 편안한 다이닝 무드");
  const conceptName =
    areaValue && areaValue >= 150 ? "Modern Dining Balance" : "Efficient Warm Dining";

  return {
    concept_name: conceptName,
    title: conceptName,
    summary:
      `${spaceTypeLabel}는 홀과 주방의 운영 효율이 핵심입니다. ` +
      `메인 홀 좌석의 쾌적함을 유지하면서 서빙 동선을 짧게 만들고, ` +
      `입구-대기-결제 흐름이 자연스럽도록 컨셉을 제안합니다.`,
    concept_summary:
      "운영 효율과 고객 경험의 균형을 맞춘 다이닝 컨셉입니다.",
    mood: baseMood,
    mood_line: baseMood,
    keywords: normalizeStringArray([
      "쾌적한 홀 구성",
      "효율적인 서빙 동선",
      "명확한 입구 경험",
      "따뜻한 다이닝 분위기",
      headcount >= 8 ? "피크타임 운영 대응" : "소형 홀 최적화",
    ]),
    recommended_zones: [
      "홀 좌석",
      "주방",
      "카운터 / 결제",
      "대기존",
      "서빙 스테이션",
    ],
    color_palette: [
      { label: "Warm Beige", hex: "#E8DCCB" },
      { label: "Walnut", hex: "#7C5A43" },
      { label: "Deep Olive", hex: "#6B7A5A" },
      { label: "Brick Accent", hex: "#B8604D" },
      { label: "Charcoal", hex: "#374151" },
    ],
    spatial_direction: [
      "입구에서 홀의 첫인상이 바로 보이도록 시야를 확보합니다.",
      "주방과 홀 사이 연결 동선을 짧게 유지합니다.",
      "대기 공간은 식사 구역과 시각적으로 너무 섞이지 않게 구성합니다.",
    ],
    materials: [
      "우드와 스톤 계열의 조합",
      "내구성 높은 의자/테이블 마감",
      "브랜드 포인트가 되는 벽면 소재",
    ],
    lighting_direction: [
      "테이블 상부 중심의 따뜻한 조명",
      "동선과 결제 구역은 식별성이 높은 조명",
      "벽면 포인트 조명으로 분위기 연출",
    ],
    furniture_direction: [
      "2인/4인 테이블 모듈을 유연하게 조합",
      "메인 통로는 여유 있게 확보",
      "벽면 좌석과 중앙 좌석의 밸런스 유지",
    ],
    project_context: {
      project_name: project.project_name,
      area: project.area,
      parsed_area: areaValue,
      headcount,
      shape: project.shape,
      input_mode: project.input_mode,
      input_mode_label: inputModeLabel,
      file_name: project.file_name,
      notes: project.notes,
    },
    generated_at: new Date().toISOString(),
    source: "mock-concept-generator-mvp",
  };
}

function buildFitnessConcept(project: OfficeProjectRow) {
  const { areaValue, headcount, notesText, spaceTypeLabel, inputModeLabel } =
    buildSharedMeta(project);

  const baseMood = pickMoodByNotes(notesText, "에너지와 집중감이 살아 있는 피트니스 무드");
  const conceptName =
    areaValue && areaValue >= 180 ? "Active Performance Gym" : "Compact Energy Studio";

  return {
    concept_name: conceptName,
    title: conceptName,
    summary:
      `${spaceTypeLabel}는 운동 몰입감과 안전 동선이 중요합니다. ` +
      `유산소/웨이트/스트레칭 구역을 명확히 나누고, ` +
      `입구에서 리셉션과 메인 운동 영역이 자연스럽게 연결되는 방향으로 컨셉을 제안합니다.`,
    concept_summary:
      "활기와 정돈감을 함께 주는 피트니스 공간 컨셉입니다.",
    mood: baseMood,
    mood_line: baseMood,
    keywords: normalizeStringArray([
      "에너지 있는 공간",
      "안전 거리 확보",
      "운동 구역 명확화",
      "강한 브랜드 인상",
      "동선 효율",
    ]),
    recommended_zones: [
      "리셉션",
      "유산소존",
      "웨이트존",
      "스트레칭존",
      "상담 / PT 존",
    ],
    color_palette: [
      { label: "Graphite", hex: "#1F2937" },
      { label: "Concrete Gray", hex: "#6B7280" },
      { label: "Neon Lime", hex: "#B7FF3C" },
      { label: "Deep Blue", hex: "#1D4ED8" },
      { label: "White", hex: "#F8FAFC" },
    ],
    spatial_direction: [
      "입구에서 리셉션 인지가 쉽도록 배치합니다.",
      "고중량 웨이트존은 벽면 또는 코너 중심으로 안정적으로 구성합니다.",
      "초보 사용자도 쉽게 이해할 수 있는 순환 동선을 만듭니다.",
    ],
    materials: [
      "고내구성 바닥재",
      "러버/비닐 계열 운동 바닥 마감",
      "메탈과 매트 질감 마감 포인트",
    ],
    lighting_direction: [
      "메인 운동존은 밝고 선명한 조명",
      "스트레칭존은 상대적으로 부드러운 조명",
      "브랜드 포인트 컬러를 강조하는 라인 조명",
    ],
    furniture_direction: [
      "리셉션은 직관적인 카운터 중심 구성",
      "운동 기구 배치는 안전 간격 우선",
      "거울과 보조 수납은 동선 방해가 적은 벽면 위주 배치",
    ],
    project_context: {
      project_name: project.project_name,
      area: project.area,
      parsed_area: areaValue,
      headcount,
      shape: project.shape,
      input_mode: project.input_mode,
      input_mode_label: inputModeLabel,
      file_name: project.file_name,
      notes: project.notes,
    },
    generated_at: new Date().toISOString(),
    source: "mock-concept-generator-mvp",
  };
}

function buildRetailConcept(project: OfficeProjectRow) {
  const { areaValue, headcount, notesText, spaceTypeLabel, inputModeLabel } =
    buildSharedMeta(project);

  const baseMood = pickMoodByNotes(notesText, "브랜드 인상이 선명한 리테일 무드");
  const conceptName =
    areaValue && areaValue >= 120 ? "Brand Focus Retail" : "Compact Discovery Store";

  return {
    concept_name: conceptName,
    title: conceptName,
    summary:
      `${spaceTypeLabel}는 입구 첫인상과 상품 탐색 흐름이 중요합니다. ` +
      `메인 진열 존을 중심으로 시선 유도 포인트를 만들고, ` +
      `계산대 접근성과 체류 흐름을 함께 고려하는 방향의 컨셉을 제안합니다.`,
    concept_summary:
      "브랜드 경험과 상품 노출 효율을 함께 높이는 리테일 컨셉입니다.",
    mood: baseMood,
    mood_line: baseMood,
    keywords: normalizeStringArray([
      "브랜드 시인성",
      "상품 탐색 흐름",
      "입구 첫인상",
      "프로모션 강조",
      "계산대 접근성",
    ]),
    recommended_zones: [
      "메인 진열존",
      "프로모션존",
      "보조 진열존",
      "계산대",
      "재고 / 수납",
    ],
    color_palette: [
      { label: "Soft White", hex: "#F8FAFC" },
      { label: "Stone Gray", hex: "#94A3B8" },
      { label: "Brand Black", hex: "#111827" },
      { label: "Accent Beige", hex: "#D6C3A1" },
      { label: "Muted Green", hex: "#9DB5A3" },
    ],
    spatial_direction: [
      "입구에서 메인 진열 포인트가 보이도록 시야를 설계합니다.",
      "주력 상품은 메인 동선 위에 배치합니다.",
      "계산대는 출구와 가까우면서도 전체 시야 확보가 가능한 위치가 좋습니다.",
    ],
    materials: [
      "브랜드 아이덴티티를 보여주는 포인트 마감",
      "상품이 돋보이는 뉴트럴 배경 소재",
      "관리 용이한 진열 선반/랙 시스템",
    ],
    lighting_direction: [
      "상품 강조용 스팟 조명",
      "입구 및 메인 진열 존의 시인성 강화 조명",
      "계산대는 밝고 명확한 조도 확보",
    ],
    furniture_direction: [
      "주력 상품용 낮은 진열과 보조 랙을 혼합",
      "시선 차단이 심하지 않은 중앙 진열 구성",
      "대기줄이 동선을 막지 않는 계산대 설계",
    ],
    project_context: {
      project_name: project.project_name,
      area: project.area,
      parsed_area: areaValue,
      headcount,
      shape: project.shape,
      input_mode: project.input_mode,
      input_mode_label: inputModeLabel,
      file_name: project.file_name,
      notes: project.notes,
    },
    generated_at: new Date().toISOString(),
    source: "mock-concept-generator-mvp",
  };
}

function buildOtherConcept(project: OfficeProjectRow) {
  const { areaValue, headcount, notesText, spaceTypeLabel, inputModeLabel } =
    buildSharedMeta(project);

  const baseMood = pickMoodByNotes(notesText, "기능과 분위기가 균형 잡힌 범용 공간 무드");
  const conceptName = "Flexible Signature Space";

  return {
    concept_name: conceptName,
    title: conceptName,
    summary:
      `${spaceTypeLabel}의 핵심 기능을 중심으로 메인 공간과 보조 기능 공간을 정리하고, ` +
      `입구에서 주요 사용 영역이 자연스럽게 인지되는 방향의 범용 컨셉을 제안합니다.`,
    concept_summary:
      "다양한 용도에 대응 가능한 유연하고 정돈된 공간 컨셉입니다.",
    mood: baseMood,
    mood_line: baseMood,
    keywords: normalizeStringArray([
      "유연한 운영",
      "명확한 메인 존",
      "정돈된 동선",
      "브랜드 포인트",
      headcount > 0 ? `이용 인원 ${headcount}명 대응` : "",
    ]),
    recommended_zones: [
      "메인 사용 구역",
      "보조 기능 구역",
      "응대 / 전면 구역",
      "수납 / 지원 구역",
    ],
    color_palette: [
      { label: "Ivory", hex: "#F8F5F0" },
      { label: "Taupe", hex: "#B8A89A" },
      { label: "Slate", hex: "#64748B" },
      { label: "Forest Accent", hex: "#6E8B74" },
      { label: "Charcoal", hex: "#334155" },
    ],
    spatial_direction: [
      "가장 중요한 기능을 메인 존으로 명확히 설정합니다.",
      "보조 기능은 후면 또는 측면에 정리합니다.",
      "입구에서 주요 활동이 인지되도록 시선 흐름을 만듭니다.",
    ],
    materials: [
      "뉴트럴 톤 기반 마감",
      "따뜻한 우드 또는 패브릭 포인트",
      "관리 쉬운 범용 바닥재",
    ],
    lighting_direction: [
      "메인 구역은 밝고 균일한 조명",
      "포인트 존은 강조 조명으로 구분",
      "보조 기능 공간은 실용 조명 중심",
    ],
    furniture_direction: [
      "유연한 모듈형 가구 제안",
      "메인 활동 중심의 배치",
      "이동 동선을 방해하지 않는 보조 가구 구성",
    ],
    project_context: {
      project_name: project.project_name,
      area: project.area,
      parsed_area: areaValue,
      headcount,
      shape: project.shape,
      input_mode: project.input_mode,
      input_mode_label: inputModeLabel,
      file_name: project.file_name,
      notes: project.notes,
    },
    generated_at: new Date().toISOString(),
    source: "mock-concept-generator-mvp",
  };
}

function buildConcept(project: OfficeProjectRow) {
  switch (project.space_type) {
    case "office":
      return buildOfficeConcept(project);
    case "cafe":
      return buildCafeConcept(project);
    case "restaurant":
      return buildRestaurantConcept(project);
    case "fitness":
      return buildFitnessConcept(project);
    case "retail":
      return buildRetailConcept(project);
    default:
      return buildOtherConcept(project);
  }
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
        file_url,
        file_name,
        requirements_json,
        analysis_json
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
        concept_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (processingError) {
      return NextResponse.json(
        { error: processingError.message || "컨셉 상태 업데이트에 실패했습니다." },
        { status: 500 }
      );
    }

    const concept = buildConcept(project as OfficeProjectRow);

    const { error: updateError } = await supabase
      .from("office_projects")
      .update({
        concept_status: "completed",
        design_concept_json: concept,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "컨셉 결과 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "AI 컨셉 추천이 완료되었습니다.",
      concept,
    });
  } catch (error: any) {
    if (projectId) {
      await supabase
        .from("office_projects")
        .update({
          concept_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);
    }

    return NextResponse.json(
      { error: error?.message || "AI 컨셉 추천 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
