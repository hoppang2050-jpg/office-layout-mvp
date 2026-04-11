"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import LayoutPreview2D from "@/components/LayoutPreview2D";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? "";

const supabase = createClient(supabaseUrl, supabaseKey);

type StatusType = "pending" | "processing" | "completed" | "failed";

type JsonObject = Record<string, any> | null;

type OfficeProject = {
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
  requirements_json: JsonObject;
  analysis_status: StatusType | null;
  analysis_json: JsonObject;
  concept_status: StatusType | null;
  design_concept_json: JsonObject;
  layout_status: StatusType | null;
  layout_3d_json: JsonObject;
  created_at?: string | null;
  updated_at?: string | null;
};

function formatJson(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

function getStatusLabel(status: StatusType | null | undefined) {
  switch (status) {
    case "completed":
      return "완료";
    case "processing":
      return "생성 중";
    case "failed":
      return "실패";
    case "pending":
    default:
      return "대기";
  }
}

function getStatusClassName(status: StatusType | null | undefined) {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "processing":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "failed":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "pending":
    default:
      return "bg-slate-100 text-slate-600 border border-slate-200";
  }
}

function getInputModeLabel(inputMode: string | null) {
  switch (inputMode) {
    case "floorplan":
      return "정식 도면";
    case "sketch":
      return "손그림 스케치";
    case "no_drawing":
      return "도면 없음";
    default:
      return "-";
  }
}

function getSpaceTypeLabel(spaceType: string | null, detail?: string | null) {
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
      return detail?.trim() || "-";
  }
}

function isPdfFile(url?: string | null, fileName?: string | null) {
  const target = `${url ?? ""} ${fileName ?? ""}`.toLowerCase();
  return target.includes(".pdf");
}

function isImageFile(url?: string | null, fileName?: string | null) {
  const target = `${url ?? ""} ${fileName ?? ""}`.toLowerCase();
  return (
    target.includes(".png") ||
    target.includes(".jpg") ||
    target.includes(".jpeg") ||
    target.includes(".webp") ||
    target.includes(".gif")
  );
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item == null) return "";
      if (typeof item === "object") return JSON.stringify(item);
      return String(item);
    })
    .filter((item) => item.trim().length > 0);
}

function pickString(data: JsonObject, keys: string[]) {
  if (!data) return null;
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

function pickArray(data: JsonObject, keys: string[]) {
  if (!data) return [];
  for (const key of keys) {
    const value = data[key];
    const normalized = normalizeStringArray(value);
    if (normalized.length > 0) {
      return normalized;
    }
  }
  return [];
}

function pickPalette(data: JsonObject) {
  if (!data) return [];
  const raw = data.color_palette ?? data.palette ?? data.colors ?? [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (typeof item === "string") {
        return { label: item, color: item };
      }

      if (item && typeof item === "object") {
        const label =
          typeof item.label === "string"
            ? item.label
            : typeof item.name === "string"
            ? item.name
            : typeof item.hex === "string"
            ? item.hex
            : "색상";

        const color =
          typeof item.hex === "string"
            ? item.hex
            : typeof item.color === "string"
            ? item.color
            : typeof item.value === "string"
            ? item.value
            : "#CBD5E1";

        return { label, color };
      }

      return null;
    })
    .filter(Boolean) as { label: string; color: string }[];
}

function safeFileNameFromUrl(url: string | null) {
  if (!url) return null;
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").pop();
    return last ? decodeURIComponent(last) : null;
  } catch {
    return null;
  }
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">
        {value !== null && value !== undefined && String(value).trim() !== ""
          ? String(value)
          : "-"}
      </div>
    </div>
  );
}

function ListBlock({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (!items.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-violet-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const projectId = Number(rawId);

  const [project, setProject] = useState<OfficeProject | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);

  const [showRequirementsJson, setShowRequirementsJson] = useState(false);
  const [showAnalysisJson, setShowAnalysisJson] = useState(false);
  const [showConceptJson, setShowConceptJson] = useState(false);
  const [showLayoutJson, setShowLayoutJson] = useState(false);

  async function loadProject(id: number) {
    try {
      setPageError(null);
      setIsPageLoading(true);

      const { data, error } = await supabase
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
          analysis_status,
          analysis_json,
          concept_status,
          design_concept_json,
          layout_status,
          layout_3d_json,
          created_at,
          updated_at
        `
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        throw new Error(error?.message || "프로젝트를 불러오지 못했습니다.");
      }

      setProject(data as OfficeProject);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "프로젝트를 불러오는 중 오류가 발생했습니다."
      );
    } finally {
      setIsPageLoading(false);
    }
  }

  useEffect(() => {
    if (!projectId || Number.isNaN(projectId)) {
      setPageError("올바르지 않은 프로젝트 ID입니다.");
      setIsPageLoading(false);
      return;
    }

    loadProject(projectId);
  }, [projectId]);

  async function handleAnalyze() {
    if (!project?.id || isAnalyzing) return;

    setActionError(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze-floorplan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId: project.id }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          (result as any)?.error || "AI 분석 실행에 실패했습니다."
        );
      }

      await loadProject(project.id);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "AI 분석 실행 중 오류가 발생했습니다.";
      setActionError(message);
      alert(message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleGenerateConcept() {
    if (!project?.id || isGeneratingConcept) return;

    setActionError(null);
    setIsGeneratingConcept(true);

    try {
      const response = await fetch("/api/generate-concept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId: project.id }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          (result as any)?.error || "AI 컨셉 추천에 실패했습니다."
        );
      }

      await loadProject(project.id);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "AI 컨셉 추천 중 오류가 발생했습니다.";
      setActionError(message);
      alert(message);
    } finally {
      setIsGeneratingConcept(false);
    }
  }

  async function handleGenerateLayout() {
    if (!project?.id || isGeneratingLayout) return;

    setActionError(null);
    setIsGeneratingLayout(true);

    try {
      const response = await fetch("/api/generate-layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId: project.id }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          (result as any)?.error || "3D 배치 생성에 실패했습니다."
        );
      }

      await loadProject(project.id);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "3D 배치 생성 중 오류가 발생했습니다.";
      setActionError(message);
      alert(message);
    } finally {
      setIsGeneratingLayout(false);
    }
  }

  if (isPageLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-lg font-semibold text-slate-900">
              프로젝트 정보를 불러오는 중...
            </div>
            <p className="mt-2 text-sm text-slate-500">
              잠시만 기다려 주세요.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (pageError || !project) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
            <div className="text-lg font-bold text-rose-700">
              프로젝트를 불러올 수 없습니다.
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {pageError || "알 수 없는 오류가 발생했습니다."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                이전으로
              </button>
              <button
                type="button"
                onClick={() => {
                  if (projectId && !Number.isNaN(projectId)) {
                    loadProject(projectId);
                  }
                }}
                className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
              >
                다시 불러오기
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const fileUrl = project.file_url ?? null;
  const fileName =
    project.file_name ?? safeFileNameFromUrl(project.file_url) ?? "첨부 파일";
  const hasFile = Boolean(fileUrl);

  const analysis = project.analysis_json ?? null;
  const concept = project.design_concept_json ?? null;
  const layout = project.layout_3d_json ?? null;

  const analysisSummary =
    pickString(analysis, ["summary", "analysis_summary"]) ?? null;

  const analysisDetectedFeatures = pickArray(analysis, ["detected_features"]);
  const analysisZoningSuggestions = pickArray(analysis, ["zoning_suggestions"]);
  const analysisFlowNotes = pickArray(analysis, ["flow_notes"]);
  const analysisRisks = pickArray(analysis, ["risks"]);
  const analysisRecommendations = pickArray(analysis, ["recommendations"]);
  const analysisInputNote =
    analysis?.input_interpretation?.note &&
    typeof analysis.input_interpretation.note === "string"
      ? analysis.input_interpretation.note
      : null;

  const conceptTitle =
    pickString(concept, ["concept_name", "title", "name"]) ?? "AI 제안 컨셉";
  const conceptSummary =
    pickString(concept, ["summary", "description", "concept_summary"]) ?? null;
  const conceptMood = pickString(concept, ["mood", "mood_line"]);
  const conceptKeywords = pickArray(concept, [
    "keywords",
    "key_keywords",
    "tags",
  ]);
  const conceptRecommendedZones = pickArray(concept, [
    "recommended_zones",
    "recommended_spaces",
    "space_program",
    "zones",
  ]);
  const conceptPalette = pickPalette(concept);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-3 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ← 이전으로
            </button>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {project.project_name || "프로젝트 상세"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              프로젝트 상세 정보, 첨부 도면/스케치, AI 분석, 디자인 컨셉,
              3D 배치 결과를 한 번에 확인할 수 있습니다.
            </p>
          </div>
        </div>

        {actionError ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}

        <div className="grid gap-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">기본 정보</h2>
                <p className="mt-1 text-sm text-slate-500">
                  프로젝트 생성 시 입력한 기본 제원과 업종 정보를 확인합니다.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  업종:{" "}
                  {getSpaceTypeLabel(
                    project.space_type,
                    project.space_type_detail
                  )}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  입력 방식: {getInputModeLabel(project.input_mode)}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoRow label="프로젝트명" value={project.project_name} />
              <InfoRow label="면적" value={project.area} />
              <InfoRow label="인원" value={project.headcount} />
              <InfoRow label="공간 형태" value={project.shape} />
              <InfoRow
                label="업종"
                value={getSpaceTypeLabel(
                  project.space_type,
                  project.space_type_detail
                )}
              />
              <InfoRow
                label="입력 방식"
                value={getInputModeLabel(project.input_mode)}
              />
              <InfoRow label="생성일" value={project.created_at ?? "-"} />
              <InfoRow label="수정일" value={project.updated_at ?? "-"} />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-sm font-semibold text-slate-900">
                추가 요청 사항
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {project.notes?.trim() || "추가 요청 사항이 없습니다."}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  도면 / 스케치
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  업로드한 도면, 손그림 스케치, 사진 파일을 확인합니다.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {getInputModeLabel(project.input_mode)}
              </span>
            </div>

            {hasFile ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div>
                    <div className="text-sm font-medium text-slate-500">
                      업로드 파일
                    </div>
                    <div className="mt-1 break-all text-base font-semibold text-slate-900">
                      {fileName}
                    </div>
                  </div>

                  <a
                    href={fileUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    파일 열기
                  </a>
                </div>

                {isPdfFile(fileUrl, fileName) ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <iframe
                      src={fileUrl ?? ""}
                      title="첨부 PDF 미리보기"
                      className="h-[720px] w-full"
                    />
                  </div>
                ) : isImageFile(fileUrl, fileName) ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <img
                      src={fileUrl ?? ""}
                      alt={fileName ?? "첨부 이미지"}
                      className="max-h-[720px] w-full object-contain bg-slate-50"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                    이 파일 형식은 화면 내 미리보기를 지원하지 않습니다. 위의
                    <span className="mx-1 font-semibold text-slate-900">
                      파일 열기
                    </span>
                    버튼으로 확인해 주세요.
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                업로드된 도면/스케치 파일이 없습니다.
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">AI 분석</h2>
                <p className="mt-1 text-sm text-slate-500">
                  업종, 제원, 첨부파일 정보를 바탕으로 공간 분석 결과를
                  확인합니다.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusClassName(
                    project.analysis_status
                  )}`}
                >
                  {getStatusLabel(project.analysis_status)}
                </span>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAnalyzing
                    ? "AI 분석 실행 중..."
                    : project.analysis_status === "completed"
                    ? "AI 분석 다시 실행"
                    : "AI 분석 실행"}
                </button>
              </div>
            </div>

            {analysis ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-5">
                  <div className="text-sm font-semibold text-violet-800">
                    AI 분석 요약
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {analysisSummary || "분석 요약이 아직 없습니다."}
                  </p>

                  {analysisInputNote ? (
                    <div className="mt-3 rounded-xl bg-white px-4 py-3 text-sm text-slate-600">
                      {analysisInputNote}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <ListBlock title="감지된 특징" items={analysisDetectedFeatures} />
                  <ListBlock
                    title="추천 공간 구성"
                    items={analysisZoningSuggestions}
                  />
                  <ListBlock title="동선 메모" items={analysisFlowNotes} />
                  <ListBlock title="리스크" items={analysisRisks} />
                  <ListBlock
                    title="추천 사항"
                    items={analysisRecommendations}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                아직 AI 분석 결과가 없습니다. 상단 버튼으로 분석을 실행해
                주세요.
              </div>
            )}

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowAnalysisJson((prev) => !prev)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {showAnalysisJson
                  ? "AI 분석 원본 JSON 닫기"
                  : "AI 분석 원본 JSON 보기"}
              </button>
            </div>

            {showAnalysisJson ? (
              <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                {formatJson(project.analysis_json)}
              </pre>
            ) : null}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  디자인 컨셉
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  프로젝트 정보와 분석 결과를 바탕으로 AI가 추천한 디자인
                  방향입니다.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusClassName(
                    project.concept_status
                  )}`}
                >
                  {getStatusLabel(project.concept_status)}
                </span>

                <button
                  type="button"
                  onClick={handleGenerateConcept}
                  disabled={isGeneratingConcept}
                  className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGeneratingConcept
                    ? "AI 컨셉 추천 중..."
                    : project.concept_status === "completed"
                    ? "AI 컨셉 다시 추천받기"
                    : "AI 컨셉 추천 받기"}
                </button>
              </div>
            </div>

            {concept ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                    디자인 컨셉
                  </div>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">
                    {conceptTitle}
                  </h3>

                  {conceptSummary ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {conceptSummary}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      업종:{" "}
                      {getSpaceTypeLabel(
                        project.space_type,
                        project.space_type_detail
                      )}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      입력 방식: {getInputModeLabel(project.input_mode)}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      무드: {conceptMood || "-"}
                    </span>
                  </div>
                </div>

                {conceptKeywords.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="text-sm font-semibold text-slate-900">
                      키워드
                    </h4>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {conceptKeywords.map((keyword, index) => (
                        <span
                          key={`keyword-${index}`}
                          className="rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {conceptPalette.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="text-sm font-semibold text-slate-900">
                      컬러 팔레트
                    </h4>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {conceptPalette.map((item, index) => (
                        <div
                          key={`palette-${index}`}
                          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2"
                        >
                          <span
                            className="h-5 w-5 rounded-full border border-slate-300"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-slate-700">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <ListBlock
                  title="추천 공간 구성"
                  items={conceptRecommendedZones}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                아직 디자인 컨셉 결과가 없습니다. 상단 버튼으로 추천을 실행해
                주세요.
              </div>
            )}

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowConceptJson((prev) => !prev)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {showConceptJson
                  ? "컨셉 원본 JSON 닫기"
                  : "컨셉 원본 JSON 보기"}
              </button>
            </div>

            {showConceptJson ? (
              <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                {formatJson(project.design_concept_json)}
              </pre>
            ) : null}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  3D 배치 / 2D 미리보기
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  업종별 조건과 제원을 바탕으로 mock 3D 배치 결과를 확인합니다.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusClassName(
                    project.layout_status
                  )}`}
                >
                  {getStatusLabel(project.layout_status)}
                </span>

                <button
                  type="button"
                  onClick={handleGenerateLayout}
                  disabled={isGeneratingLayout}
                  className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGeneratingLayout
                    ? "3D 배치 생성 중..."
                    : "3D 배치 다시 생성"}
                </button>
              </div>
            </div>

            <LayoutPreview2D layoutData={project.layout_3d_json ?? null} />

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowLayoutJson((prev) => !prev)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {showLayoutJson
                  ? "3D 배치 원본 JSON 닫기"
                  : "3D 배치 원본 JSON 보기"}
              </button>
            </div>

            {showLayoutJson ? (
              <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                {formatJson(layout)}
              </pre>
            ) : null}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                입력 제원 JSON
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                프로젝트 생성 시 저장된 업종별 요구사항과 입력값입니다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRequirementsJson((prev) => !prev)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {showRequirementsJson
                ? "입력 제원 JSON 닫기"
                : "입력 제원 JSON 보기"}
            </button>

            {showRequirementsJson ? (
              <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                {formatJson(project.requirements_json)}
              </pre>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
