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

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
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

function getRequirements(project: any): JsonObject {
  return isObject(project?.requirements_json) ? project.requirements_json : {};
}

function getAnalysis(project: any): JsonObject {
  return isObject(project?.analysis_json) ? project.analysis_json : {};
}

function getAnalysisFlowNotes(project: any): string[] {
  const analysis = getAnalysis(project);

  const direct = toStringArray(analysis.flow_notes);
  if (direct.length > 0) return direct;

  const alternatives = [
    analysis.flow,
    analysis.customer_flow,
    analysis.operation_flow,
  ];

  for (const item of alternatives) {
    const arr = toStringArray(item);
    if (arr.length > 0) return arr;
  }

  return [];
}

function getAnalysisRisks(project: any): string[] {
  const analysis = getAnalysis(project);

  const direct = toStringArray(analysis.risks);
  if (direct.length > 0) return direct;

  const alt = toStringArray(analysis.issues);
  if (alt.length > 0) return alt;

  return [];
}

function buildCafeConcept(project: any) {
  const flowNotes = getAnalysisFlowNotes(project);
  const risks = getAnalysisRisks(project);

  const summaryParts: string[] = [
    "카페는 첫인상과 체류감이 중요합니다.",
    "주문-대기-픽업 흐름을 명확히 하고 좌석 밀도는 과하지 않게 조정해 편안한 체류 경험을 만드는 방향으로 컨셉을 제안합니다.",
  ];

  if (flowNotes.length > 0) {
    summaryParts.push(`분석된 주요 동선 포인트: ${flowNotes.slice(0, 2).join(", ")}`);
  }

  if (risks.length > 0) {
    summaryParts.push(`주의 포인트: ${risks.slice(0, 2).join(", ")}`);
  }

  return {
    source: "mock-concept-generator-mvp",
    concept_name: "Warm Community Café",
    title: "Warm Community Café",
    name: "Warm Community Café",
    mood: "따뜻하고 머무르고 싶은 카페 무드",
    summary: summaryParts.join(" "),
    keywords: [
      "따뜻한 체류감",
      "명확한 주문 동선",
      "편안한 좌석 구성",
      "감성 조명",
      "운영 효율",
    ],
    color_palette: [
      "#F5E6C8",
      "#D7BFA8",
      "#8C5E3C",
      "#6F7D6A",
      "#F8F5EF",
    ],
    recommended_zones: [
      "주문 카운터",
      "제조존",
      "픽업 / 대기존",
      "메인 좌석존",
      "창가 / 포인트 좌석",
    ],
    styling_points: [
      "우드 톤과 패브릭 질감으로 체류감을 강화합니다.",
      "카운터 전면의 시인성을 높여 첫 진입 인지를 쉽게 만듭니다.",
      "대기와 픽업 구간을 짧고 명확하게 구성합니다.",
    ],
  };
}

function buildOfficeConcept(project: any) {
  const flowNotes = getAnalysisFlowNotes(project);
  const risks = getAnalysisRisks(project);

  const summaryParts: string[] = [
    "오피스는 집중과 협업의 균형이 중요합니다.",
    "개방형 업무 구역과 회의/커뮤니케이션 공간의 밀도를 조절해 생산성과 브랜딩 이미지를 함께 확보하는 방향으로 제안합니다.",
  ];

  if (flowNotes.length > 0) {
    summaryParts.push(`동선 포인트: ${flowNotes.slice(0, 2).join(", ")}`);
  }

  if (risks.length > 0) {
    summaryParts.push(`주의 포인트: ${risks.slice(0, 2).join(", ")}`);
  }

  return {
    source: "mock-concept-generator-mvp",
    concept_name: "Balanced Smart Office",
    title: "Balanced Smart Office",
    name: "Balanced Smart Office",
    mood: "집중감과 개방감을 함께 주는 스마트 오피스 무드",
    summary: summaryParts.join(" "),
    keywords: [
      "집중과 협업의 균형",
      "정돈된 브랜드 인상",
      "유연한 회의 공간",
      "조용한 컬러감",
      "효율적 수납",
    ],
    color_palette: [
      "#E8EEF2",
      "#C9D6DF",
      "#52616B",
      "#1E2022",
      "#F0F5F9",
    ],
    recommended_zones: [
      "오픈 오피스",
      "미팅룸",
      "포커스존",
      "라운지",
      "팬트리",
    ],
    styling_points: [
      "메인 동선은 단순하고 직관적으로 설계합니다.",
      "협업 공간은 투명감 있는 파티션으로 개방성을 확보합니다.",
      "뉴트럴 톤에 포인트 컬러를 제한적으로 사용합니다.",
    ],
  };
}

function buildRestaurantConcept(project: any) {
  const flowNotes = getAnalysisFlowNotes(project);
  const risks = getAnalysisRisks(project);

  const summaryParts: string[] = [
    "레스토랑은 고객 경험과 운영 동선이 동시에 중요합니다.",
    "입구-안내-착석-식사-결제 흐름을 부드럽게 연결하고 주방/서비스 동선은 겹치지 않도록 구성하는 방향으로 제안합니다.",
  ];

  if (flowNotes.length > 0) {
    summaryParts.push(`동선 포인트: ${flowNotes.slice(0, 2).join(", ")}`);
  }

  if (risks.length > 0) {
    summaryParts.push(`주의 포인트: ${risks.slice(0, 2).join(", ")}`);
  }

  return {
    source: "mock-concept-generator-mvp",
    concept_name: "Layered Dining Experience",
    title: "Layered Dining Experience",
    name: "Layered Dining Experience",
    mood: "차분하면서도 몰입감 있는 다이닝 무드",
    summary: summaryParts.join(" "),
    keywords: [
      "입구 경험 강화",
      "홀-주방 동선 분리",
      "테이블 밀도 최적화",
      "분위기 조명",
      "체류 경험",
    ],
    color_palette: [
      "#EADBC8",
      "#C7A17A",
      "#8B5E3C",
      "#2F2A25",
      "#F7F3EE",
    ],
    recommended_zones: [
      "입구 / 대기존",
      "메인 홀 좌석",
      "프라이빗 좌석",
      "주방",
      "서비스 / 수납존",
    ],
    styling_points: [
      "입구에서 내부 분위기가 자연스럽게 느껴지도록 구성합니다.",
      "테이블 간 간격을 안정적으로 유지합니다.",
      "재료감이 드러나는 조명과 마감으로 식사 경험을 강화합니다.",
    ],
  };
}

function buildFitnessConcept(project: any) {
  const flowNotes = getAnalysisFlowNotes(project);
  const risks = getAnalysisRisks(project);

  const summaryParts: string[] = [
    "피트니스 공간은 활력과 동선 분리가 중요합니다.",
    "체크인부터 유산소-웨이트-스트레칭까지 흐름이 자연스럽고 에너지감이 살아나는 방향으로 제안합니다.",
  ];

  if (flowNotes.length > 0) {
    summaryParts.push(`동선 포인트: ${flowNotes.slice(0, 2).join(", ")}`);
  }

  if (risks.length > 0) {
    summaryParts.push(`주의 포인트: ${risks.slice(0, 2).join(", ")}`);
  }

  return {
    source: "mock-concept-generator-mvp",
    concept_name: "Active Flow Fitness",
    title: "Active Flow Fitness",
    name: "Active Flow Fitness",
    mood: "에너지가 느껴지는 다이내믹 피트니스 무드",
    summary: summaryParts.join(" "),
    keywords: [
      "활력 있는 분위기",
      "기능별 존 분리",
      "직관적 동선",
      "밝은 조명",
      "청결한 인상",
    ],
    color_palette: [
      "#EAF4F4",
      "#BEE3DB",
      "#5C7AEA",
      "#2D3748",
      "#F7FAFC",
    ],
    recommended_zones: [
      "리셉션",
      "유산소존",
      "웨이트존",
      "스트레칭존",
      "락커 / 샤워존",
    ],
    styling_points: [
      "고객 진입 후 체크인 위치를 쉽게 인지할 수 있어야 합니다.",
      "기구별 간섭이 적도록 운동 구역을 분리합니다.",
      "활동성을 살리는 색 대비를 제한적으로 사용합니다.",
    ],
  };
}

function buildRetailConcept(project: any) {
  const flowNotes = getAnalysisFlowNotes(project);
  const risks = getAnalysisRisks(project);

  const summaryParts: string[] = [
    "리테일 공간은 주목도와 회유 동선이 중요합니다.",
    "전면 주목 진열과 중앙 체류 포인트를 두고 결제/재고 구역은 운영 효율 중심으로 정리하는 방향을 제안합니다.",
  ];

  if (flowNotes.length > 0) {
    summaryParts.push(`동선 포인트: ${flowNotes.slice(0, 2).join(", ")}`);
  }

  if (risks.length > 0) {
    summaryParts.push(`주의 포인트: ${risks.slice(0, 2).join(", ")}`);
  }

  return {
    source: "mock-concept-generator-mvp",
    concept_name: "Curated Retail Journey",
    title: "Curated Retail Journey",
    name: "Curated Retail Journey",
    mood: "정돈되고 감각적인 큐레이션 리테일 무드",
    summary: summaryParts.join(" "),
    keywords: [
      "주목 진열",
      "회유 동선",
      "브랜드 인상 강화",
      "포인트 조명",
      "정리된 결제존",
    ],
    color_palette: [
      "#F6F1EB",
      "#D6CCC2",
      "#A68A64",
      "#3C3C3C",
      "#FFFFFF",
    ],
    recommended_zones: [
      "전면 디스플레이",
      "메인 진열존",
      "체험 / 포인트존",
      "결제대",
      "재고 / 창고존",
    ],
    styling_points: [
      "입구에서 핵심 상품이 보이도록 전면 시야를 정리합니다.",
      "고객 동선을 자연스럽게 유도하는 진열 리듬을 만듭니다.",
      "브랜드 톤을 반영한 포인트 소재를 적용합니다.",
    ],
  };
}

function buildOtherConcept(project: any) {
  const requirements = getRequirements(project);
  const requirementKeywords = toStringArray(
    requirements.keywords ?? requirements.tags ?? requirements.focus_points
  );

  return {
    source: "mock-concept-generator-mvp",
    concept_name: "Flexible Modern Space",
    title: "Flexible Modern Space",
    name: "Flexible Modern Space",
    mood: "유연하고 정돈된 현대적 공간 무드",
    summary:
      "공간 유형 정보가 제한적이어서 범용적으로 적용 가능한 현대적이고 유연한 컨셉으로 제안합니다.",
    keywords:
      requirementKeywords.length > 0
        ? requirementKeywords.slice(0, 5)
        : ["유연한 활용", "정돈된 인상", "기본 동선 최적화", "밝은 개방감"],
    color_palette: ["#F3F4F6", "#D1D5DB", "#9CA3AF", "#4B5563", "#FFFFFF"],
    recommended_zones: ["메인 공간", "보조 공간", "수납존"],
    styling_points: [
      "과도한 장식보다 활용성과 정돈감을 우선합니다.",
      "기본 동선이 막히지 않도록 중심 공간을 비워둡니다.",
      "중립적인 톤으로 시작해 포인트 요소를 추가합니다.",
    ],
  };
}

function buildConcept(project: any) {
  const type = getSpaceTypeKey(project?.space_type);

  switch (type) {
    case "cafe":
      return buildCafeConcept(project);
    case "office":
      return buildOfficeConcept(project);
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
  let projectId: string | null = null;

  try {
    const url = new URL(request.url);

    let body: any = {};
    try {
      const rawText = await request.text();
      body = rawText ? JSON.parse(rawText) : {};
    } catch {
      body = {};
    }

    projectId =
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
        concept_status: "processing",
      })
      .eq("id", projectId);

    if (processingError) {
      return NextResponse.json(
        { error: "concept_status를 processing으로 업데이트하지 못했습니다." },
        { status: 500 }
      );
    }

    const concept = buildConcept(project);

    const { error: updateError } = await supabase
      .from("office_projects")
      .update({
        concept_status: "completed",
        design_concept_json: concept,
      })
      .eq("id", projectId);

    if (updateError) {
      await supabase
        .from("office_projects")
        .update({
          concept_status: "failed",
        })
        .eq("id", projectId);

      return NextResponse.json(
        { error: "design_concept_json 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      projectId,
      concept,
    });
  } catch (error) {
    if (projectId) {
      await supabase
        .from("office_projects")
        .update({
          concept_status: "failed",
        })
        .eq("id", projectId);
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "컨셉 추천 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
