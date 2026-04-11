"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import LayoutPreview2D from "../../../components/LayoutPreview2D";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

type JsonValue = Record<string, any> | null;

type OfficeProject = {
  id: string;
  project_name?: string | null;
  client_name?: string | null;
  space_type?: string | null;
  area_size?: number | string | null;
  file_url?: string | null;
  file_name?: string | null;
  requirements_json?: JsonValue;
  analysis_json?: JsonValue;
  design_concept_json?: JsonValue;
  layout_3d_json?: JsonValue;
  analysis_status?: string | null;
  concept_status?: string | null;
  layout_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
};

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value);
  }
}

function isPdfUrl(url?: string | null) {
  if (!url) return false;
  return /\.pdf($|\?)/i.test(url);
}

function isImageUrl(url?: string | null) {
  if (!url) return false;
  return /\.(png|jpg|jpeg|gif|webp|bmp|svg)($|\?)/i.test(url);
}

function getStatusLabel(status?: string | null) {
  switch (status) {
    case "completed":
      return "완료";
    case "processing":
      return "생성 중";
    case "failed":
      return "실패";
    default:
      return "대기";
  }
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "processing":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "failed":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function getAnalysisSummary(analysisJson?: JsonValue) {
  if (!isObject(analysisJson)) return null;

  const candidates = [
    analysisJson.summary,
    analysisJson.overview,
    analysisJson.result_summary,
    analysisJson.analysis_summary,
    analysisJson.description,
  ];

  for (const item of candidates) {
    if (typeof item === "string" && item.trim()) {
      return item.trim();
    }
  }

  return null;
}

function getConceptName(conceptJson?: JsonValue) {
  if (!isObject(conceptJson)) return null;

  const candidates = [
    conceptJson.concept_name,
    conceptJson.name,
    conceptJson.title,
  ];

  for (const item of candidates) {
    if (typeof item === "string" && item.trim()) {
      return item.trim();
    }
  }

  return null;
}

function getConceptMood(conceptJson?: JsonValue) {
  if (!isObject(conceptJson)) return null;

  const candidates = [conceptJson.mood, conceptJson.mood_description];

  for (const item of candidates) {
    if (typeof item === "string" && item.trim()) {
      return item.trim();
    }
  }

  return null;
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

function getConceptKeywords(conceptJson?: JsonValue): string[] {
  if (!isObject(conceptJson)) return [];
  return toStringArray(
    conceptJson.keywords ?? conceptJson.keyword_list ?? conceptJson.tags
  );
}

function getConceptPalette(conceptJson?: JsonValue): string[] {
  if (!isObject(conceptJson)) return [];
  return toStringArray(
    conceptJson.color_palette ?? conceptJson.palette ?? conceptJson.colors
  );
}

function getConceptZones(conceptJson?: JsonValue): string[] {
  if (!isObject(conceptJson)) return [];
  return toStringArray(
    conceptJson.recommended_zones ??
      conceptJson.zones ??
      conceptJson.recommended_zone_list
  );
}

function getAreaText(project: OfficeProject | null) {
  if (!project) return "-";

  const direct = project.area_size;
  if (direct !== undefined && direct !== null && String(direct).trim() !== "") {
    return String(direct);
  }

  const req = isObject(project.requirements_json) ? project.requirements_json : {};

  const candidates = [
    req.area_size,
    req.area,
    req.total_area,
    req.size,
    isObject(req.dimensions) ? req.dimensions.area : undefined,
  ];

  for (const item of candidates) {
    if (item !== undefined && item !== null && String(item).trim() !== "") {
      return String(item);
    }
  }

  return "-";
}

export default function ProjectDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const routeProjectId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [project, setProject] = useState<OfficeProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);

  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [conceptError, setConceptError] = useState<string | null>(null);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  const [showRequirementsJson, setShowRequirementsJson] = useState(false);
  const [showAnalysisJson, setShowAnalysisJson] = useState(false);
  const [showConceptJson, setShowConceptJson] = useState(false);
  const [showLayoutJson, setShowLayoutJson] = useState(false);

  async function loadProject(projectId: string) {
    if (!supabase) {
      setPageError("Supabase 환경변수를 확인해주세요.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError(null);

      const { data, error } = await supabase
        .from("office_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) {
        throw error;
      }

      setProject(data as OfficeProject);
    } catch (error: any) {
      console.error("loadProject error:", error);
      setPageError(error?.message || "프로젝트를 불러오지 못했습니다.");
      setProject(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!routeProjectId || typeof routeProjectId !== "string") {
      setLoading(false);
      setPageError("잘못된 프로젝트 경로입니다.");
      return;
    }

    loadProject(routeProjectId);
  }, [routeProjectId]);

  async function handleAnalyze() {
    if (!project?.id || isAnalyzing) {
      setAnalyzeError("project.id가 없습니다.");
      return;
    }

    setAnalyzeError(null);
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/analyze-floorplan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          id: project.id,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result?.error || "AI 분석 요청에 실패했습니다.");
      }

      await loadProject(project.id);
    } catch (error: any) {
      console.error("handleAnalyze error:", error);
      setAnalyzeError(error?.message || "AI 분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleGenerateConcept() {
    if (!project?.id || isGeneratingConcept) {
      setConceptError("project.id가 없습니다.");
      return;
    }

    setConceptError(null);
    setIsGeneratingConcept(true);

    try {
      const res = await fetch("/api/generate-concept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          id: project.id,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result?.error || "컨셉 추천 요청에 실패했습니다.");
      }

      await loadProject(project.id);
    } catch (error: any) {
      console.error("handleGenerateConcept error:", error);
      setConceptError(
        error?.message || "컨셉 추천 중 오류가 발생했습니다."
      );
    } finally {
      setIsGeneratingConcept(false);
    }
  }

  async function handleGenerateLayout() {
    if (!project?.id || isGeneratingLayout) {
      setLayoutError("project.id가 없습니다.");
      return;
    }

    setLayoutError(null);
    setIsGeneratingLayout(true);

    try {
      const url = `/api/generate-layout?projectId=${encodeURIComponent(
        project.id
      )}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          id: project.id,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result?.error || "3D 배치 생성에 실패했습니다.");
      }

      await loadProject(project.id);
    } catch (error: any) {
      console.error("handleGenerateLayout error:", error);
      setLayoutError(
        error?.message || "3D 배치 생성 중 오류가 발생했습니다."
      );
    } finally {
      setIsGeneratingLayout(false);
    }
  }

  const analysisSummary = useMemo(
    () => getAnalysisSummary(project?.analysis_json),
    [project?.analysis_json]
  );

  const conceptName = useMemo(
    () => getConceptName(project?.design_concept_json),
    [project?.design_concept_json]
  );

  const conceptMood = useMemo(
    () => getConceptMood(project?.design_concept_json),
    [project?.design_concept_json]
  );

  const conceptKeywords = useMemo(
    () => getConceptKeywords(project?.design_concept_json),
    [project?.design_concept_json]
  );

  const conceptPalette = useMemo(
    () => getConceptPalette(project?.design_concept_json),
    [project?.design_concept_json]
  );

  const conceptZones = useMemo(
    () => getConceptZones(project?.design_concept_json),
    [project?.design_concept_json]
  );

  const areaText = useMemo(() => getAreaText(project), [project]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-500">프로젝트를 불러오는 중입니다...</p>
        </div>
      </main>
    );
  }

  if (pageError) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">프로젝트 상세</h1>
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {pageError}
          </p>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-500">프로젝트 데이터를 찾을 수 없습니다.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-violet-600">Project Detail</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                {project.project_name || "이름 없는 프로젝트"}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  공간 유형: {project.space_type || "-"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  면적: {areaText}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  ID: {project.id}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${getStatusClass(
                  project.analysis_status
                )}`}
              >
                AI 분석: {getStatusLabel(project.analysis_status)}
              </div>
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${getStatusClass(
                  project.concept_status
                )}`}
              >
                컨셉 추천: {getStatusLabel(project.concept_status)}
              </div>
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${getStatusClass(
                  project.layout_status
                )}`}
              >
                3D 배치: {getStatusLabel(project.layout_status)}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">첨부 파일</h2>
              <p className="mt-1 text-sm text-slate-500">
                업로드된 도면 또는 참고 이미지를 확인합니다.
              </p>
            </div>
            {project.file_url ? (
              <a
                href={project.file_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                원본 파일 열기
              </a>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              파일명:{" "}
              <span className="font-semibold text-slate-900">
                {project.file_name || "-"}
              </span>
            </p>

            {project.file_url ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {isPdfUrl(project.file_url) ? (
                  <iframe
                    src={project.file_url}
                    className="h-[720px] w-full"
                    title="첨부 PDF 미리보기"
                  />
                ) : isImageUrl(project.file_url) ? (
                  <img
                    src={project.file_url}
                    alt={project.file_name || "첨부 이미지"}
                    className="max-h-[720px] w-full object-contain bg-white"
                  />
                ) : (
                  <div className="p-6 text-sm text-slate-500">
                    미리보기를 지원하지 않는 파일 형식입니다. 상단의
                    &quot;원본 파일 열기&quot; 버튼으로 확인해주세요.
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                업로드된 파일이 없습니다.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">요구사항 JSON</h2>
              <p className="mt-1 text-sm text-slate-500">
                프로젝트 생성 시 저장된 원본 요구사항 데이터입니다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRequirementsJson((prev) => !prev)}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {showRequirementsJson ? "요구사항 JSON 닫기" : "요구사항 JSON 보기"}
            </button>
          </div>

          {showRequirementsJson && (
            <pre className="overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
              {formatJson(project.requirements_json)}
            </pre>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">AI 분석</h2>
              <p className="mt-1 text-sm text-slate-500">
                업로드된 도면/요구사항을 기반으로 기본 분석 결과를 생성합니다.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-sm font-semibold ${getStatusClass(
                  project.analysis_status
                )}`}
              >
                {getStatusLabel(project.analysis_status)}
              </span>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !project?.id}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAnalyzing ? "AI 분석 중..." : "AI 분석 실행"}
              </button>
            </div>
          </div>

          {analyzeError && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {analyzeError}
            </div>
          )}

          {analysisSummary ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">분석 요약</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {analysisSummary}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              아직 분석 결과가 없습니다.
            </div>
          )}

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowAnalysisJson((prev) => !prev)}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {showAnalysisJson ? "AI 분석 원본 JSON 닫기" : "AI 분석 원본 JSON 보기"}
            </button>
          </div>

          {showAnalysisJson && (
            <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
              {formatJson(project.analysis_json)}
            </pre>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">AI 컨셉 추천</h2>
              <p className="mt-1 text-sm text-slate-500">
                공간 유형과 요구사항을 바탕으로 디자인 컨셉을 추천합니다.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-sm font-semibold ${getStatusClass(
                  project.concept_status
                )}`}
              >
                {getStatusLabel(project.concept_status)}
              </span>

              <button
                type="button"
                onClick={handleGenerateConcept}
                disabled={isGeneratingConcept || !project?.id}
                className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingConcept
                  ? "컨셉 생성 중..."
                  : project.concept_status === "completed"
                  ? "컨셉 다시 추천"
                  : project.concept_status === "failed"
                  ? "컨셉 재시도"
                  : "AI 컨셉 추천 받기"}
              </button>
            </div>
          </div>

          {conceptError && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {conceptError}
            </div>
          )}

          {project.design_concept_json ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-semibold text-slate-500">컨셉명</h3>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {conceptName || "컨셉명이 없습니다."}
                </p>

                <h3 className="mt-5 text-sm font-semibold text-slate-500">무드</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {conceptMood || "무드 정보가 없습니다."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-semibold text-slate-500">키워드</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {conceptKeywords.length > 0 ? (
                    conceptKeywords.map((item, index) => (
                      <span
                        key={`${item}-${index}`}
                        className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">키워드가 없습니다.</p>
                  )}
                </div>

                <h3 className="mt-5 text-sm font-semibold text-slate-500">
                  추천 존
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {conceptZones.length > 0 ? (
                    conceptZones.map((item, index) => (
                      <span
                        key={`${item}-${index}`}
                        className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">추천 존 정보가 없습니다.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:col-span-2">
                <h3 className="text-sm font-semibold text-slate-500">컬러 팔레트</h3>
                {conceptPalette.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {conceptPalette.map((color, index) => {
                      const isHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
                      return (
                        <div
                          key={`${color}-${index}`}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2"
                        >
                          <span
                            className="h-6 w-6 rounded-full border border-slate-300"
                            style={{
                              backgroundColor: isHex ? color : "#E2E8F0",
                            }}
                          />
                          <span className="text-sm font-medium text-slate-700">
                            {color}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    컬러 팔레트 정보가 없습니다.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              아직 컨셉 추천 결과가 없습니다.
            </div>
          )}

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowConceptJson((prev) => !prev)}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {showConceptJson ? "컨셉 원본 JSON 닫기" : "컨셉 원본 JSON 보기"}
            </button>
          </div>

          {showConceptJson && (
            <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
              {formatJson(project.design_concept_json)}
            </pre>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                className={`rounded-full border px-3 py-1 text-sm font-semibold ${getStatusClass(
                  project.layout_status
                )}`}
              >
                {getStatusLabel(project.layout_status)}
              </span>

              <button
                type="button"
                onClick={handleGenerateLayout}
                disabled={isGeneratingLayout || !project?.id}
                className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingLayout
                  ? "3D 배치 생성 중..."
                  : project.layout_status === "completed"
                  ? "3D 배치 다시 생성"
                  : project.layout_status === "failed"
                  ? "3D 배치 재시도"
                  : "3D 배치 생성"}
              </button>
            </div>
          </div>

          {layoutError && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {layoutError}
            </div>
          )}

          <LayoutPreview2D layoutData={project.layout_3d_json ?? null} />

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowLayoutJson((prev) => !prev)}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {showLayoutJson ? "3D 배치 원본 JSON 닫기" : "3D 배치 원본 JSON 보기"}
            </button>
          </div>

          {showLayoutJson && (
            <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
              {formatJson(project.layout_3d_json)}
            </pre>
          )}
        </section>
      </div>
    </main>
  );
}
