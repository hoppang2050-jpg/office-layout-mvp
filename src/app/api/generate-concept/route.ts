import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

function getSpaceTypeLabel(spaceType: string | null) {
  switch (spaceType) {
    case "office":
      return "사무실";
    case "cafe":
      return "카페";
    case "restaurant":
      return "식당";
    case "fitness":
      return "헬스장 / 피트니스";
    case "retail":
      return "매장 / 쇼룸";
    case "other":
      return "기타";
    default:
      return "공간";
  }
}

function getInputModeLabel(inputMode: string | null) {
  switch (inputMode) {
    case "floorplan":
      return "정식 도면";
    case "sketch":
      return "손그림 스케치";
    case "no_drawing":
      return "텍스트 제원";
    default:
      return "입력값";
  }
}

function buildMockConcept(project: any) {
  const spaceType = project?.space_type;
  const inputMode = project?.input_mode;
  const area = project?.area || "-";
  const headcount = project?.headcount || 0;
  const detail = project?.space_type_detail || null;

  const commonMeta = {
    generated_from: {
      space_type: spaceType,
      space_type_label: getSpaceTypeLabel(spaceType),
      space_type_detail: detail,
      input_mode: inputMode,
      input_mode_label: getInputModeLabel(inputMode),
      area,
      headcount,
    },
  };

  switch (spaceType) {
    case "office":
      return {
        ...commonMeta,
        primary_concept: {
          name: "웰니스 중심 하이브리드 오피스",
          summary:
            "집중과 협업의 균형을 맞추고, 방문객 응대와 팀 효율을 동시에 고려한 프리미엄 사무실 컨셉입니다.",
          keywords: ["웰니스", "하이브리드", "집중존", "협업존", "프리미엄"],
          palette: ["Soft White", "Warm Gray", "Forest Green", "Oak Wood"],
          materials: ["오크 우드", "패브릭 흡음재", "유리 파티션", "간접조명"],
          mood: "밝고 안정적이며 생산성과 편안함을 동시에 주는 분위기",
          focal_points: ["웰컴 라운지", "집중 부스", "협업 테이블"],
          planning_principles: [
            "회의실과 오픈오피스의 소음 분리",
            "탕비와 휴게 기능을 중심부 또는 접근성 좋은 위치에 배치",
            "집중 업무용 존과 빠른 협업용 존 분리",
          ],
        },
        alternatives: [
          {
            name: "클라이언트 미팅 강화형 오피스",
            summary: "방문객 응대와 회의 동선을 최적화한 대외 업무형 사무실",
            keywords: ["리셉션", "회의 중심", "대외응대"],
          },
          {
            name: "스타트업 밀도 최적화 오피스",
            summary: "제한된 면적에서 좌석 효율과 유연성을 강화한 실용형 오피스",
            keywords: ["고밀도", "모듈형", "유연배치"],
          },
        ],
        recommended_zones: ["open_office", "meeting_room", "focus_room", "pantry"],
        brand_story:
          "일하기 좋은 분위기와 신뢰감 있는 방문 경험을 동시에 주는 업무 공간을 목표로 합니다.",
      };

    case "cafe":
      return {
        ...commonMeta,
        primary_concept: {
          name: "우드톤 체류형 브랜드 카페",
          summary:
            "체류감을 높이는 좌석 구성과 브랜드 감성을 살린 포토 포인트 중심의 카페 컨셉입니다.",
          keywords: ["우드톤", "체류형", "브랜딩", "포토존", "따뜻함"],
          palette: ["Cream", "Walnut Brown", "Muted Green", "Warm Black"],
          materials: ["월넛 우드", "텍스처 플라스터", "브론즈 금속", "포인트 타일"],
          mood: "따뜻하고 오래 머물고 싶은 감성 중심 분위기",
          focal_points: ["바 카운터", "윈도우 좌석", "브랜드 포토존"],
          planning_principles: [
            "주문/픽업 동선을 짧게 유지",
            "체류형 좌석과 빠른 이용 좌석을 혼합 구성",
            "브랜드 포인트가 되는 시선 집중 요소 배치",
          ],
        },
        alternatives: [
          {
            name: "도시형 회전형 카페",
            summary: "회전율과 효율성을 강화한 빠른 운영형 카페",
            keywords: ["회전율", "효율", "간결한동선"],
          },
          {
            name: "미니멀 스페셜티 카페",
            summary: "소재감과 커피 경험을 강조한 정제된 고급 카페",
            keywords: ["미니멀", "스페셜티", "정제된무드"],
          },
        ],
        recommended_zones: ["counter", "pickup", "window_seat", "photo_spot"],
        brand_story:
          "브랜드 감성과 체류 경험을 모두 전달하는, 사진 찍고 머물고 싶은 카페를 지향합니다.",
      };

    case "restaurant":
      return {
        ...commonMeta,
        primary_concept: {
          name: "도시형 운영 효율 다이닝",
          summary:
            "홀과 주방, 대기 공간의 흐름을 정리해 운영 효율과 분위기를 함께 챙기는 식당 컨셉입니다.",
          keywords: ["운영효율", "홀/주방분리", "대기공간", "회전율", "브랜드톤"],
          palette: ["Ivory", "Charcoal", "Dark Wood", "Muted Terracotta"],
          materials: ["다크우드", "스톤 상판", "포인트 타일", "간접조명"],
          mood: "도시적이고 정돈된, 식사 집중도가 높은 분위기",
          focal_points: ["입구 대기존", "메인 홀 좌석", "오픈 또는 반오픈 주방 포인트"],
          planning_principles: [
            "홀과 주방 동선 충돌 최소화",
            "2인/4인석 비율 최적화",
            "입구에서 대기와 착석 흐름이 자연스럽도록 설계",
          ],
        },
        alternatives: [
          {
            name: "프리미엄 코지 다이닝",
            summary: "체류감과 분위기를 강화한 고급 식사형 레스토랑",
            keywords: ["코지", "프리미엄", "분위기중심"],
          },
          {
            name: "고회전 캐주얼 다이닝",
            summary: "짧은 체류와 빠른 회전을 고려한 실용형 식당",
            keywords: ["고회전", "실용형", "빠른동선"],
          },
        ],
        recommended_zones: ["dining_hall", "kitchen", "waiting_area", "service_path"],
        brand_story:
          "맛과 서비스 속도를 함께 살리면서도, 첫인상과 식사 경험의 완성도를 높이는 식당을 목표로 합니다.",
      };

    case "fitness":
      return {
        ...commonMeta,
        primary_concept: {
          name: "퍼포먼스 중심 프리미엄 피트니스",
          summary:
            "운동 몰입감과 회원 동선을 고려해 머신존, 프리웨이트, PT 기능을 균형 있게 배치하는 컨셉입니다.",
          keywords: ["퍼포먼스", "프리웨이트", "PT", "락커동선", "에너지"],
          palette: ["Graphite", "White", "Electric Blue", "Rubber Black"],
          materials: ["고무바닥재", "거울월", "블랙메탈", "라인조명"],
          mood: "강한 에너지와 집중감을 주는 현대적 분위기",
          focal_points: ["리셉션", "프리웨이트존", "PT룸"],
          planning_principles: [
            "머신존과 자유중량존의 충돌 방지",
            "락커/샤워 동선의 프라이버시 확보",
            "초보 회원도 직관적으로 이용 가능한 존 구분",
          ],
        },
        alternatives: [
          {
            name: "부티크 PT 중심 스튜디오",
            summary: "개별 트레이닝 경험과 프라이버시를 강화한 컨셉",
            keywords: ["부티크", "PT중심", "프라이버시"],
          },
          {
            name: "고밀도 머신 최적화 피트니스",
            summary: "회원 수용 효율을 높이는 운영형 피트니스",
            keywords: ["고밀도", "머신효율", "운영중심"],
          },
        ],
        recommended_zones: ["reception", "machine_zone", "free_weight", "locker_room"],
        brand_story:
          "회원이 처음 들어오는 순간부터 운동 몰입, 이동 편의, 브랜드 신뢰감을 동시에 느끼게 하는 공간입니다.",
      };

    case "retail":
      return {
        ...commonMeta,
        primary_concept: {
          name: "체험형 프리미엄 쇼룸",
          summary:
            "진열과 체험, 브랜드 전달력을 함께 살리는 동선 중심 매장 컨셉입니다.",
          keywords: ["체험형", "진열", "쇼윈도", "브랜드몰입", "전환동선"],
          palette: ["Soft White", "Sand Beige", "Black", "Accent Blue"],
          materials: ["페인트 마감", "우드 선반", "메탈 프레임", "집중 조명"],
          mood: "브랜드 메시지가 분명하고 제품이 돋보이는 정돈된 분위기",
          focal_points: ["입구 쇼윈도", "체험존", "히어로 제품 디스플레이"],
          planning_principles: [
            "입구-체험-구매 전환 흐름 강화",
            "제품군별 구역 정리",
            "카운터와 재고 접근성 확보",
          ],
        },
        alternatives: [
          {
            name: "미니멀 갤러리형 매장",
            summary: "소수 제품을 강하게 보여주는 정제형 쇼룸",
            keywords: ["갤러리형", "미니멀", "전시중심"],
          },
          {
            name: "고회전 판매형 매장",
            summary: "진열 밀도와 구매 편의성을 중시하는 운영형 매장",
            keywords: ["판매효율", "진열밀도", "빠른회전"],
          },
        ],
        recommended_zones: ["show_window", "display_zone", "experience_zone", "checkout"],
        brand_story:
          "브랜드 첫인상과 체험 몰입을 극대화해 방문자가 자연스럽게 머물고 구매하도록 유도하는 공간입니다.",
      };

    default:
      return {
        ...commonMeta,
        primary_concept: {
          name: `${detail || "맞춤형"} 공간 컨셉 제안`,
          summary:
            "입력된 업종과 요구사항을 바탕으로 기능과 분위기를 균형 있게 정리하는 맞춤형 컨셉입니다.",
          keywords: ["맞춤형", "유연성", "기능성", "브랜드성"],
          palette: ["Neutral White", "Warm Gray", "Wood", "Accent Color"],
          materials: ["우드", "페인트", "패브릭", "포인트 금속"],
          mood: "기능과 인상이 균형 잡힌 유연한 분위기",
          focal_points: ["입구 인상 공간", "주요 운영 기능 구역", "브랜드 포인트"],
          planning_principles: [
            "운영 핵심 기능을 중심으로 존 구성",
            "입구에서 주요 기능까지 시선 흐름 정리",
            "제한된 정보에서는 유연한 기본 배치를 우선 제안",
          ],
        },
        alternatives: [
          {
            name: "실용 중심 기본안",
            summary: "기능 배치와 동선을 우선시한 안정형 안",
            keywords: ["실용형", "기본안", "안정적"],
          },
          {
            name: "브랜드 포인트 강화안",
            summary: "특정 시그니처 요소를 강조하는 차별화 안",
            keywords: ["브랜드포인트", "차별화", "인상강화"],
          },
        ],
        recommended_zones: ["core_zone", "support_zone", "welcome_zone"],
        brand_story:
          "세부 업종 특성을 반영해 기능과 분위기 모두를 놓치지 않는 맞춤 공간을 지향합니다.",
      };
  }
}

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

    const mockConcept = buildMockConcept(project);

    const { error: updateError } = await supabase
      .from("office_projects")
      .update({
        concept_status: "completed",
        design_concept_json: mockConcept,
      })
      .eq("id", projectId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: "AI 컨셉 추천 결과가 저장되었습니다.",
      concept: mockConcept,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "컨셉 추천 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
