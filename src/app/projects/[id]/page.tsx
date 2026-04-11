"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

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

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : fallback;
  }
  return fallback;
}

function firstValidNumber(...values: unknown[]) {
  for (const value of values) {
    const num = toNumber(value, Number.NaN);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return 0;
}

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value);
  }
}

function formatMeasure(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function isPdfUrl(url?: string | null) {
  return !!url && /\.pdf($|\?)/i.test(url);
}

function isImageUrl(url?: string | null) {
  return !!url && /\.(png|jpg|jpeg|gif|webp|bmp|svg)($|\?)/i.test(url);
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
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "processing":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "failed":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
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
    conceptJson.title,
    conceptJson.name,
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

function getConceptKeywords(conceptJson?: JsonValue) {
  if (!isObject(conceptJson)) return [];
  return toStringArray(
    conceptJson.keywords ?? conceptJson.keyword_list ?? conceptJson.tags
  );
}

function getConceptPalette(conceptJson?: JsonValue) {
  if (!isObject(conceptJson)) return [];
  return toStringArray(
    conceptJson.color_palette ?? conceptJson.palette ?? conceptJson.colors
  );
}

function getConceptZones(conceptJson?: JsonValue) {
  if (!isObject(conceptJson)) return [];
  return toStringArray(
    conceptJson.recommended_zones ??
      conceptJson.zones ??
      conceptJson.recommended_zone_list
  );
}

function getLayoutSummary(layoutJson?: JsonValue) {
  if (!isObject(layoutJson)) {
    return {
      width: 0,
      depth: 0,
      area: 0,
      zonesCount: 0,
      furnitureCount: 0,
    };
  }

  const space = isObject(layoutJson.space) ? layoutJson.space : {};
  const dimensions = isObject(layoutJson.dimensions) ? layoutJson.dimensions : {};
  const spaceDimensions = isObject(space.dimensions) ? space.dimensions : {};
  const meta = isObject(layoutJson.meta) ? layoutJson.meta : {};

  const width = firstValidNumber(
    space.width,
    space.w,
    spaceDimensions.width,
    spaceDimensions.w,
    dimensions.width,
    dimensions.w,
    layoutJson.width,
    layoutJson.w,
    meta.width
  );

  const depth = firstValidNumber(
    space.depth,
    space.height,
    space.d,
    spaceDimensions.depth,
    spaceDimensions.height,
    spaceDimensions.d,
    dimensions.depth,
    dimensions.height,
    dimensions.d,
    layoutJson.depth,
    layoutJson.height,
    layoutJson.d,
    meta.depth,
    meta.height
  );

  const area = firstValidNumber(
    space.area,
    spaceDimensions.area,
    dimensions.area,
    layoutJson.area,
    meta.area,
    width > 0 && depth > 0 ? width * depth : 0
  );

  const zones = Array.isArray(layoutJson.zones) ? layoutJson.zones : [];
  const furniture = Array.isArray(layoutJson.furniture)
    ? layoutJson.furniture
    : [];

  return {
    width,
    depth,
    area,
    zonesCount: zones.length,
    furnitureCount: furniture.length,
  };
}

function getLayoutSizeText(layoutJson?: JsonValue, fallbackAreaText?: string) {
  const summary = getLayoutSummary(layoutJson);

  if (summary.width > 0 && summary.depth > 0) {
    const areaText =
      summary.area > 0 ? ` · 약 ${formatMeasure(summary.area)}㎡` : "";
    return `${formatMeasure(summary.width)}m × ${formatMeasure(summary.depth)}m${areaText}`;
  }

  if (summary.area > 0) {
    return `약 ${formatMeasure(summary.area)}㎡`;
  }

  if (fallbackAreaText && fallbackAreaText !== "-") {
    return String(fallbackAreaText);
  }

  return "-";
}

function LayoutPreviewMini({
  layout,
  fallbackAreaText,
}: {
  layout?: JsonValue;
  fallbackAreaText?: string;
}) {
  if (!isObject(layout)) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        아직 생성된 레이아웃이 없습니다.
      </div>
    );
  }

  const summary = getLayoutSummary(layout);
  const space = isObject(layout.space) ? layout.space : {};
  const zonesRaw = Array.isArray(layout.zones) ? layout.zones : [];
  const furnitureRaw = Array.isArray(layout.furniture) ? layout.furniture : [];

  const width = Math.max(summary.width || toNumber(space.width, 10), 1);
  const depth = Math.max(summary.depth || toNumber(space.depth, 8), 1);

  const zones = zonesRaw.filter(isObject);
  const furniture = furnitureRaw.filter(isObject);
  const sizeText = getLayoutSizeText(layout, fallbackAreaText);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">2D 배치 미리보기</p>
        <p className="mt-1 text-xs text-slate-500">
          상부 기준 간단 미리보기 · {sizeText}
        </p>
      </div>

      <div className="p-4">
        <div className="relative mx-auto aspect-[4/3] w-full max-w-3xl rounded-2xl border border-slate-300 bg-slate-100">
          <div className="absolute inset-3 rounded-xl border-2 border-slate-500 bg-white">
            {zones.map((zone, index) => {
              const x = toNumber(zone.x, 0);
              const y = toNumber(zone.y, 0);
              const w = Math.max(toNumber(zone.width, 1), 0.5);
              const d = Math.max(toNumber(zone.depth, 1), 0.5);
              const color =
                typeof zone.color === "string" && zone.color.trim()
                  ? zone.color
                  : "#cbd5e1";

              return (
                <div
                  key={`zone-${index}`}
                  className="absolute overflow-hidden rounded-lg border border-slate-400/60 text-[10px] text-slate-800 shadow-sm"
                  style={{
                    left: `${(x / width) * 100}%`,
                    top: `${(y / depth) * 100}%`,
                    width: `${(w / width) * 100}%`,
                    height: `${(d / depth) * 100}%`,
                    backgroundColor: color,
                    opacity: 0.72,
                  }}
                  title={String(zone.label ?? zone.name ?? `Zone ${index + 1}`)}
                >
                  <div className="truncate px-1 py-0.5 font-medium">
                    {String(zone.label ?? zone.name ?? `Zone ${index + 1}`)}
                  </div>
                </div>
              );
            })}

            {furniture.map((item, index) => {
              const x = toNumber(item.x, 0);
              const y = toNumber(item.y, 0);
              const w = Math.max(toNumber(item.width, 0.4), 0.25);
              const d = Math.max(toNumber(item.depth, 0.4), 0.25);

              return (
                <div
                  key={`furniture-${index}`}
                  className="absolute rounded-sm border border-slate-600 bg-slate-800/70"
                  style={{
                    left: `${(x / width) * 100}%`,
                    top: `${(y / depth) * 100}%`,
                    width: `${(w / width) * 100}%`,
                    height: `${(d / depth) * 100}%`,
                  }}
                  title={String(
                    item.label ?? item.name ?? item.type ?? `Furniture ${index + 1}`
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-900">
        {value !== undefined && value !== null && String(value).trim() !== ""
          ? String(value)
          : "-"}
      </p>
    </div>
  );
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

      if (error) throw error;

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
      const requestUrl = `/api/analyze-floorplan?projectId=${encodeURIComponent(
        project.id
      )}`;
      const requestBody = { projectId: project.id, id: project.id };

      const res = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
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
      const requestUrl = `/api/generate-concept?projectId=${encodeURIComponent(
        project.id
      )}`;
      const requestBody = { projectId: project.id, id: project.id };

      const res = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result?.error || "컨셉 추천 요청에 실패했습니다.");
      }

      await loadProject(project.id);
    } catch (error: any) {
      console.error("handleGenerateConcept error:", error);
      setConceptError(error?.message || "컨셉 추천 중 오류가 발생했습니다.");
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
      const requestUrl = `/api/generate-layout?projectId=${encodeURIComponent(
        project.id
      )}`;
      const requestBody = { projectId: project.id, id: project.id };

      const res = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result?.error || "3D 배치 생성에 실패했습니다.");
      }

      await loadProject(project.id);
    } catch (error: any) {
      console.error("handleGenerateLayout error:", error);
      setLayoutError(error?.message || "3D 배치 생성 중 오류가 발생했습니다.");
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

  const layoutSummary = useMemo(
    () => getLayoutSummary(project?.layout_3d_json),
    [project?.layout_3d_json]
  );

  const layoutSizeText = useMemo(
    () => getLayoutSizeText(project?.layout_3d_json, areaText),
    [project?.layout_3d_json, areaText]
  );

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
          <p className="text-sm text-slate-500">
            프로젝트 데이터를 찾을 수 없습니다.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-violet-600">Project Detail</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {project.project_name || "이름 없는 프로젝트"}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                AI 분석, 컨셉 추천, 3D 배치 생성을 한 화면에서 확인할 수 있습니다.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div
                className={`rounded-2xl border px-3 py-2 text-center text-xs font-semibold ${getStatusClass(
                  project.analysis_status
                )}`}
              >
                분석 {getStatusLabel(project.analysis_status)}
              </div>
              <div
                className={`rounded-2xl border px-3 py-2 text-center text-xs font-semibold ${getStatusClass(
                  project.concept_status
                )}`}
              >
                컨셉 {getStatusLabel(project.concept_status)}
              </div>
              <div
                className={`rounded-2xl border px-3 py-2 text-center text-xs font-semibold ${getStatusClass(
                  project.layout_status
                )}`}
              >
                배치 {getStatusLabel(project.layout_status)}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard title="프로젝트 ID" value={project.id} />
            <InfoCard title="공간 유형" value={project.space_type || "-"} />
            <InfoCard title="면적" value={areaText} />
            <InfoCard
              title="생성일"
              value={
                project.created_at
                  ? new Date(project.created_at).toLocaleString("ko-KR")
                  : "-"
              }
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">첨부 파일</h2>
              <p className="mt-1 text-sm text-slate-500">
                업로드된 도면 또는 참고 이미지를 확인합니다.
              </p>
            </div>
            {project.file_url ? (
              <a
                href={project.file_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                원본 파일 열기
              </a>
            ) : null}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {project.file_url ? (
              isPdfUrl(project.file_url) ? (
                <iframe
                  src={project.file_url}
                  title={project.file_name || "project file"}
                  className="h-[640px] w-full rounded-xl border border-slate-200 bg-white"
                />
              ) : isImageUrl(project.file_url) ? (
                <img
                  src={project.file_url}
                  alt={project.file_name || "project file"}
                  className="max-h-[640px] w-full rounded-xl border border-slate-200 bg-white object-contain"
                />
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  미리보기를 지원하지 않는 파일 형식입니다.
                </div>
              )
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                첨부된 파일이 없습니다.
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">AI 공간 분석</h2>
                <p className="mt-1 text-sm text-slate-500">
                  업로드 파일을 바탕으로 기본 공간 분석을 생성합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !project?.id}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAnalyzing ? "분석 중..." : "AI 분석 실행"}
              </button>
            </div>

            {analyzeError ? (
              <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {analyzeError}
              </p>
            ) : null}

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                분석 요약
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {analysisSummary || "아직 생성된 분석 결과가 없습니다."}
              </p>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowAnalysisJson((prev) => !prev)}
                className="text-sm font-medium text-violet-600 hover:text-violet-700"
              >
                {showAnalysisJson ? "분석 JSON 닫기" : "분석 JSON 보기"}
              </button>

              {showAnalysisJson ? (
                <pre className="mt-3 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                  {formatJson(project.analysis_json)}
                </pre>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">AI 컨셉 추천</h2>
                <p className="mt-1 text-sm text-slate-500">
                  공간 유형과 분석 결과를 바탕으로 컨셉을 생성합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateConcept}
                disabled={isGeneratingConcept || !project?.id}
                className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingConcept ? "추천 중..." : "컨셉 다시 추천"}
              </button>
            </div>

            {conceptError ? (
              <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {conceptError}
              </p>
            ) : null}

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  컨셉명
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {conceptName || "아직 생성된 컨셉이 없습니다."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  무드
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {conceptMood || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  키워드
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {conceptKeywords.length ? (
                    conceptKeywords.map((keyword, index) => (
                      <span
                        key={`${keyword}-${index}`}
                        className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">-</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  컬러 팔레트
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {conceptPalette.length ? (
                    conceptPalette.map((color, index) => {
                      const swatch =
                        typeof color === "string" && color.trim()
                          ? color
                          : "#cbd5e1";

                      return (
                        <div
                          key={`${color}-${index}`}
                          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-slate-300"
                            style={{ backgroundColor: swatch }}
                          />
                          {color}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-sm text-slate-500">-</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  추천 존
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {conceptZones.length ? (
                    conceptZones.map((zone, index) => (
                      <span
                        key={`${zone}-${index}`}
                        className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {zone}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">-</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowConceptJson((prev) => !prev)}
                className="text-sm font-medium text-violet-600 hover:text-violet-700"
              >
                {showConceptJson ? "컨셉 JSON 닫기" : "컨셉 JSON 보기"}
              </button>

              {showConceptJson ? (
                <pre className="mt-3 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                  {formatJson(project.design_concept_json)}
                </pre>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">3D 배치 생성</h2>
                <p className="mt-1 text-sm text-slate-500">
                  분석 및 컨셉을 바탕으로 레이아웃 JSON을 생성합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateLayout}
                disabled={isGeneratingLayout || !project?.id}
                className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingLayout ? "생성 중..." : "3D 배치 다시 생성"}
              </button>
            </div>

            {layoutError ? (
              <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {layoutError}
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  공간 크기
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {layoutSizeText}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  존 개수
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {layoutSummary.zonesCount || 0}개
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  가구 개수
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {layoutSummary.furnitureCount || 0}개
                </p>
              </div>
            </div>

            <div className="mt-4">
              <LayoutPreviewMini
                layout={project.layout_3d_json}
                fallbackAreaText={areaText}
              />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowLayoutJson((prev) => !prev)}
                className="text-sm font-medium text-violet-600 hover:text-violet-700"
              >
                {showLayoutJson ? "레이아웃 JSON 닫기" : "레이아웃 JSON 보기"}
              </button>

              {showLayoutJson ? (
                <pre className="mt-3 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                  {formatJson(project.layout_3d_json)}
                </pre>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">요구사항 JSON</h2>
              <p className="mt-1 text-sm text-slate-500">
                프로젝트 생성 시 저장된 원본 요구사항입니다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRequirementsJson((prev) => !prev)}
              className="text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              {showRequirementsJson ? "요구사항 JSON 닫기" : "요구사항 JSON 보기"}
            </button>
          </div>

          {showRequirementsJson ? (
            <pre className="mt-4 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
              {formatJson(project.requirements_json)}
            </pre>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              버튼을 눌러 요구사항 JSON을 확인하세요.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
