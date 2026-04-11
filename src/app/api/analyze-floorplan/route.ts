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
  requirements_json: { [key: string]: JsonValue } | null;
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
      return "도면 파일";
    case "sketch":
      return "손그림 스케치";
    case "no_drawing":
      return "도면 없음";
    default:
      return "입력 방식 미지정";
  }
}

function guessFileType(fileName: string | null, fileUrl: string | null): string {
  const target = `${fileName || ""} ${fileUrl || ""}`.toLowerCase();

  if (
    target.includes(".png") ||
    target.includes(".jpg") ||
    target.includes(".jpeg") ||
    target.includes(".webp")
  ) {
    return "image";
  }

  if (target.includes(".pdf")) {
    return "pdf";
  }

  return "unknown";
}

function safeStringArray(values: string[]): string[] {
  return values.filter(Boolean);
}

function buildSpaceAnalysis(project: OfficeProjectRow) {
  const areaValue = parseArea(project.area);
  const headcount = project.headcount ?? 0;
  const spaceType = project.space_type ?? "other";
  const spaceTypeLabel = getSpaceTypeLabel(
    project.space_type,
    project.space_type_detail
  );
  const inputModeLabel = getInputModeLabel(project.input_mode);
  const fileType = guessFileType(project.file_name, project.file_url);

  const base = {
    project_summary: {
      project_id: project.id,
      project_name: project.project_name ?? "이름 없는 프로젝트",
      space_type: spaceType,
      space_type_label: spaceTypeLabel,
      input_mode: project.input_mode ?? null,
      input_mode_label: inputModeLabel,
      area: project.area ?? null,
      parsed_area: areaValue,
      headcount,
      shape: project.shape ?? null,
      file_url: project.file_url ?? null,
      file_name: project.file_name ?? null,
    },
    generated_at: new Date().toISOString(),
    source: "mock-floorplan-analysis-mvp",
    input_interpretation: {
      file_uploaded: Boolean(project.file_url),
      file_type_guess: fileType,
      confidence: project.file_url ? "medium" : "low",
      note: project.file_url
        ? "업로드된 파일 및 프로젝트 입력값을 기준으로 기본 공간 분석을 생성했습니다."
        : "도면 없이 입력된 프로젝트 정보만 기준으로 기본 공간 분석을 생성했습니다.",
    },
  };

  if (spaceType === "office") {
    return {
      ...base,
      summary: `${spaceTypeLabel} 기준으로 업무 집중도와 협업 동선을 함께 고려한 기본 분석을 완료했습니다.`,
      analysis_summary:
        "집중 업무 영역, 회의 영역, 공용 지원 공간의 균형이 중요한 사무실 유형으로 판단됩니다.",
      detected_features: safeStringArray([
        areaValue ? `면적 약 ${areaValue}㎡` : "",
        headcount ? `인원 ${headcount}명 기준` : "",
        project.shape ? `공간 형태: ${project.shape}` : "",
        project.file_name ? `첨부 파일: ${project.file_name}` : "",
      ]),
      zoning_suggestions: [
        "오픈 업무 구역",
        "회의실 또는 미팅존",
        "집중 업무 구역",
        "팬트리/라운지",
      ],
      flow_notes: [
        "입구에서 업무존까지의 동선을 단순하게 유지하는 것이 좋습니다.",
        "회의실은 공용 접근성이 좋으면서도 업무 집중 구역과 직접 충돌하지 않도록 배치하는 것이 좋습니다.",
        "팬트리/라운지는 소음 영향을 줄 수 있으므로 집중 업무 구역과 완충이 필요합니다.",
      ],
      risks: [
        "업무존과 회의존이 과도하게 혼재되면 소음 간섭이 발생할 수 있습니다.",
        "인원 수 대비 면적이 작을 경우 개인 집중 좌석 부족 가능성이 있습니다.",
      ],
      recommendations: [
        "업무석 밀도와 회의실 수를 인원 기준으로 재조정하세요.",
        "채광이 좋은 위치에는 공용 업무석 또는 라운지를 배치하는 것을 권장합니다.",
        "대표 동선을 기준으로 출입구·회의실·팬트리의 충돌 여부를 확인하세요.",
      ],
    };
  }

  if (spaceType === "cafe") {
    return {
      ...base,
      summary: `${spaceTypeLabel} 기준으로 고객 동선과 운영 동선을 함께 고려한 기본 분석을 완료했습니다.`,
      analysis_summary:
        "주문, 제조, 좌석, 대기 흐름이 자연스럽게 이어지는 구성이 중요합니다.",
      detected_features: safeStringArray([
        areaValue ? `면적 약 ${areaValue}㎡` : "",
        headcount ? `운영 인원 ${headcount}명 기준` : "",
        project.file_name ? `첨부 파일: ${project.file_name}` : "",
      ]),
      zoning_suggestions: ["주문 카운터", "제조존", "고객 좌석", "대기/픽업존"],
      flow_notes: [
        "입구에서 주문까지의 경로가 명확해야 합니다.",
        "제조 동선과 고객 대기 동선은 분리할수록 운영 효율이 좋아집니다.",
      ],
      risks: [
        "카운터 전면 공간이 좁으면 피크 시간대 혼잡이 커질 수 있습니다.",
        "좌석과 제조존이 너무 가까우면 소음과 시각적 혼란이 발생할 수 있습니다.",
      ],
      recommendations: [
        "픽업존을 별도로 두어 주문 대기 줄과 분리하세요.",
        "대표 좌석 유형을 2~3가지로 단순화해 밀도를 관리하세요.",
      ],
    };
  }

  if (spaceType === "restaurant") {
    return {
      ...base,
      summary: `${spaceTypeLabel} 기준으로 홀 운영과 주방 효율을 고려한 기본 분석을 완료했습니다.`,
      analysis_summary:
        "고객 홀, 주방, 서빙 동선, 대기 및 결제 흐름의 연결이 핵심입니다.",
      detected_features: safeStringArray([
        areaValue ? `면적 약 ${areaValue}㎡` : "",
        headcount ? `운영 인원 ${headcount}명 기준` : "",
        project.file_name ? `첨부 파일: ${project.file_name}` : "",
      ]),
      zoning_suggestions: ["홀 좌석", "주방", "카운터", "대기존"],
      flow_notes: [
        "서빙 동선이 홀 한가운데에서 꼬이지 않도록 메인 통로를 확보해야 합니다.",
        "주방과 카운터의 연결성을 높이면 운영 효율이 좋아집니다.",
      ],
      risks: [
        "주방 접근 동선이 길면 운영 효율이 저하될 수 있습니다.",
        "대기 손님과 식사 손님 동선이 겹치면 혼잡도가 올라갑니다.",
      ],
      recommendations: [
        "2인/4인석 비율을 예상 고객 구성에 맞게 조정하세요.",
        "주방과 홀 사이에 서빙 포인트를 두면 회전 효율이 좋아집니다.",
      ],
    };
  }

  if (spaceType === "fitness") {
    return {
      ...base,
      summary: `${spaceTypeLabel} 기준으로 운동 존 분리와 안전 동선을 고려한 기본 분석을 완료했습니다.`,
      analysis_summary:
        "유산소, 웨이트, 스트레칭, 상담/리셉션 구역을 명확히 나누는 것이 중요합니다.",
      detected_features: safeStringArray([
        areaValue ? `면적 약 ${areaValue}㎡` : "",
        headcount ? `운영 인원 ${headcount}명 기준` : "",
        project.file_name ? `첨부 파일: ${project.file_name}` : "",
      ]),
      zoning_suggestions: ["리셉션", "유산소존", "웨이트존", "스트레칭존"],
      flow_notes: [
        "입구에서 리셉션 접근이 쉬워야 합니다.",
        "웨이트존 주변은 충분한 안전 여유 공간을 확보해야 합니다.",
      ],
      risks: [
        "기구 간 간격이 좁으면 안전 문제가 생길 수 있습니다.",
        "동선이 겹치면 피크 시간대 혼잡이 큽니다.",
      ],
      recommendations: [
        "고중량 기구 존은 벽면 또는 코너 중심으로 묶어 배치하세요.",
        "초보 사용자 동선을 고려해 스트레칭존을 입구 가까이에 배치하는 것도 좋습니다.",
      ],
    };
  }

  if (spaceType === "retail") {
    return {
      ...base,
      summary: `${spaceTypeLabel} 기준으로 진입 시선과 상품 탐색 흐름을 고려한 기본 분석을 완료했습니다.`,
      analysis_summary:
        "입구 시야, 메인 상품 노출, 계산대 접근성, 체류 흐름이 중요합니다.",
      detected_features: safeStringArray([
        areaValue ? `면적 약 ${areaValue}㎡` : "",
        headcount ? `운영 인원 ${headcount}명 기준` : "",
        project.file_name ? `첨부 파일: ${project.file_name}` : "",
      ]),
      zoning_suggestions: ["메인 진열존", "프로모션존", "계산대", "보조 진열존"],
      flow_notes: [
        "입구에서 메인 진열 영역이 바로 보이도록 구성하는 것이 좋습니다.",
        "계산대는 출구 접근성이 좋아야 합니다.",
      ],
      risks: [
        "중앙 진열이 과하면 시야 차단이 발생할 수 있습니다.",
        "계산대 대기줄이 동선을 막을 수 있습니다.",
      ],
      recommendations: [
        "메인 동선 1개를 먼저 정하고 보조 진열을 붙이는 방식이 안정적입니다.",
        "프로모션존은 입구와 계산대 사이 핵심 시야선에 두는 것이 좋습니다.",
      ],
    };
  }

  return {
    ...base,
    summary: `${spaceTypeLabel} 기준의 기본 공간 분석을 완료했습니다.`,
    analysis_summary:
      "입력된 프로젝트 정보와 첨부 파일을 바탕으로 기본적인 공간 구조 검토를 생성했습니다.",
    detected_features: safeStringArray([
      areaValue ? `면적 약 ${areaValue}㎡` : "",
      headcount ? `인원 ${headcount}명 기준` : "",
      project.shape ? `공간 형태: ${project.shape}` : "",
      project.file_name ? `첨부 파일: ${project.file_name}` : "",
    ]),
    zoning_suggestions: ["메인 사용 구역", "보조 기능 구역", "수납/지원 구역"],
    flow_notes: [
      "주요 사용 구역과 보조 기능 구역을 명확히 나누는 것이 좋습니다.",
      "출입구 기준 메인 동선을 우선 확보하는 것이 안정적입니다.",
    ],
    risks: [
      "기능별 영역이 섞이면 사용성이 떨어질 수 있습니다.",
      "면적 대비 기능 요구가 많으면 과밀 배치 위험이 있습니다.",
    ],
    recommendations: [
      "가장 중요한 2~3개의 기능을 우선 배치하세요.",
      "주요 동선을 먼저 정한 뒤 가구/기능 배치를 세부 조정하세요.",
    ],
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
        file_url,
        file_name,
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
        analysis_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (processingError) {
      return NextResponse.json(
        { error: processingError.message || "분석 상태 업데이트에 실패했습니다." },
        { status: 500 }
      );
    }

    const analysis = buildSpaceAnalysis(project as OfficeProjectRow);

    const { error: updateError } = await supabase
      .from("office_projects")
      .update({
        analysis_status: "completed",
        analysis_json: analysis,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "분석 결과 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "AI 분석이 완료되었습니다.",
      analysis,
    });
  } catch (error: any) {
    if (projectId) {
      await supabase
        .from("office_projects")
        .update({
          analysis_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);
    }

    return NextResponse.json(
      { error: error?.message || "AI 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
