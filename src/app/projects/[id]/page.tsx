"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import LayoutPreview2D from "@/components/LayoutPreview2D";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type OfficeProject = {
  id: number;
  project_name: string | null;
  area: string | null;
  headcount: number | null;
  shape: string | null;
  notes: string | null;
  floorplan_file_url: string | null;
  analysis_status: string | null;
  floorplan_analysis: any;
  layout_status: string | null;
  layout_3d_json: any;
  concept_status: string | null;
  design_concept_json: any;
  space_type: string | null;
  space_type_detail: string | null;
  input_mode: string | null;
  created_at: string | null;
};

type MessageTone = "success" | "error" | "info";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();

  const rawProjectId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const projectId = Number(rawProjectId);

  const [project, setProject] = useState<OfficeProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);

  const [actionMessage, setActionMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("info");

  const isPdfFloorplan = useMemo(() => {
    if (!project?.floorplan_file_url) return false;
    return project.floorplan_file_url.toLowerCase().includes(".pdf");
  }, [project?.floorplan_file_url]);

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawProjectId]);

  async function loadProject() {
    if (!projectId || Number.isNaN(projectId)) {
      setPageError("올바른 프로젝트 ID가 아닙니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setPageError("");

    const { data, error } = await supabase
      .from("office_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error) {
      setPageError(`프로젝트를 불러오지 못했습니다: ${error.message}`);
      setProject(null);
      setIsLoading(false);
      return;
    }

    setProject(data as OfficeProject);
    setIsLoading(false);
  }

  function setSuccessMessage(message: string) {
    setMessageTone("success");
    setActionMessage(message);
  }

  function setErrorMessage(message: string) {
    setMessageTone("error");
    setActionMessage(message);
  }

  async function handleRunAnalysis() {
    if (!projectId) return;

    setIsRunningAnalysis(true);
    setActionMessage("");

    try {
      const response = await fetch("/api/analyze-floorplan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "AI 도면 분석 중 오류가 발생했습니다.");
      }

      setSuccessMessage("AI 도면 분석이 완료되었습니다.");
      await loadProject();
    } catch (error: any) {
      setErrorMessage(error?.message || "AI 도면 분석 중 오류가 발생했습니다.");
    } finally {
      setIsRunningAnalysis(false);
    }
  }

  async function handleGenerateConcept() {
    if (!projectId) return;

    setIsGeneratingConcept(true);
    setActionMessage("");

    try {
      const response = await fetch("/api/generate-concept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "AI 컨셉 추천 중 오류가 발생했습니다.");
      }

      setSuccessMessage("AI 컨셉 추천이 완료되었습니다.");
      await loadProject();
    } catch (error: any) {
      setErrorMessage(error?.message || "AI 컨셉 추천 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingConcept(false);
    }
  }

  async function handleGenerateLayout() {
    if (!projectId) return;

    setIsGeneratingLayout(true);
    setActionMessage("");

    try {
      const response = await fetch("/api/generate-layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "3D 배치 생성 중 오류가 발생했습니다.");
      }

      setSuccessMessage("3D 배치 생성이 완료되었습니다.");
      await loadProject();
    } catch (error: any) {
      setErrorMessage(error?.message || "3D 배치 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingLayout(false);
    }
  }

  function prettyJson(value: any) {
    if (!value) return "";
    return JSON.stringify(value, null, 2);
  }

  function getStatusLabel(status: string | null) {
    switch (status) {
      case "completed":
        return "완료";
      case "processing":
        return "처리 중";
      case "failed":
        return "실패";
      default:
        return "대기";
    }
  }

  function getStatusBadgeStyle(status: string | null): CSSProperties {
    switch (status) {
      case "completed":
        return {
          ...styles.badge,
          backgroundColor: "#dcfce7",
          color: "#166534",
          border: "1px solid #86efac",
        };
      case "processing":
        return {
          ...styles.badge,
          backgroundColor: "#fef3c7",
          color: "#92400e",
          border: "1px solid #fcd34d",
        };
      case "failed":
        return {
          ...styles.badge,
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
          border: "1px solid #fca5a5",
        };
      default:
        return {
          ...styles.badge,
          backgroundColor: "#e0e7ff",
          color: "#3730a3",
          border: "1px solid #a5b4fc",
        };
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
        return "헬스장 / 피트니스";
      case "retail":
        return "매장 / 쇼룸";
      case "other":
        return detail?.trim() ? `기타 (${detail.trim()})` : "기타";
      default:
        return "미지정";
    }
  }

  function getInputModeLabel(inputMode: string | null) {
    switch (inputMode) {
      case "floorplan":
        return "정식 도면";
      case "sketch":
        return "손그림 스케치";
      case "no_drawing":
        return "도면 없이 제원만 입력";
      default:
        return "미지정";
    }
  }

  function getProjectGuideText(item: OfficeProject | null) {
    if (!item) return "";

    switch (item.space_type) {
      case "office":
        return "사무실은 집중·협업·회의·휴게 기능의 균형이 중요합니다. 인원과 팀 구조를 바탕으로 업무 밀도에 맞는 배치를 추천합니다.";
      case "cafe":
        return "카페는 고객 동선, 좌석 회전, 바/픽업 동선, 분위기 연출이 중요합니다. 체류형인지 회전형인지에 따라 배치 방향이 달라집니다.";
      case "restaurant":
        return "식당은 홀·주방·서빙 동선과 좌석 효율이 핵심입니다. 운영 흐름과 분위기를 동시에 고려해 추천합니다.";
      case "fitness":
        return "헬스장은 운동 존 분리, 시선 개방감, 안전 동선, 상담/락커 연계가 중요합니다. 기능별 존 구성이 핵심입니다.";
      case "retail":
        return "매장/쇼룸은 입구 첫인상, 진열 구조, 고객 체류 흐름이 중요합니다. 상품 경험이 잘 드러나는 공간 구성을 추천합니다.";
      case "other":
        return "기타 업종은 입력한 세부 용도와 제원을 바탕으로 공통 상업공간 원칙에 맞게 컨셉과 배치를 제안합니다.";
      default:
        return "입력된 업종과 제원을 바탕으로 AI 분석과 레이아웃 생성을 진행할 수 있습니다.";
    }
  }

  function getConceptButtonLabel(status: string | null) {
    if (isGeneratingConcept) return "AI 컨셉 생성 중...";
    if (status === "completed") return "AI 컨셉 다시 추천받기";
    if (status === "failed") return "AI 컨셉 다시 시도";
    return "AI 컨셉 추천 받기";
  }

  function getAnalysisButtonLabel(status: string | null) {
    if (isRunningAnalysis) return "AI 도면 분석 중...";
    if (status === "completed") return "AI 도면 다시 분석하기";
    if (status === "failed") return "AI 도면 다시 분석하기";
    return "AI 도면 분석 실행";
  }

  function getLayoutButtonLabel(status: string | null) {
    if (isGeneratingLayout) return "3D 배치 생성 중...";
    if (status === "completed") return "3D 배치 다시 생성하기";
    if (status === "failed") return "3D 배치 다시 시도";
    return "3D 배치 생성 실행";
  }

  if (isLoading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingCard}>불러오는 중...</div>
        </div>
      </main>
    );
  }

  if (pageError) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorBox}>{pageError}</div>
          <div style={styles.actionArea}>
            <button
              type="button"
              onClick={() => router.push("/projects")}
              style={styles.secondaryButton}
            >
              목록으로
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorBox}>프로젝트를 찾을 수 없습니다.</div>
          <div style={styles.actionArea}>
            <button
              type="button"
              onClick={() => router.push("/projects")}
              style={styles.secondaryButton}
            >
              목록으로
            </button>
          </div>
        </div>
      </main>
    );
  }

  const concept = project.design_concept_json;
  const conceptKeywords = Array.isArray(concept?.keywords) ? concept.keywords : [];
  const conceptPalette = Array.isArray(concept?.color_palette)
    ? concept.color_palette
    : [];
  const conceptZones = Array.isArray(concept?.recommended_zones)
    ? concept.recommended_zones
    : [];
  const conceptDirections = Array.isArray(concept?.styling_direction)
    ? concept.styling_direction
    : [];
  const conceptReasoning = Array.isArray(concept?.ai_reasoning)
    ? concept.ai_reasoning
    : [];
  const conceptMaterials = Array.isArray(concept?.material_keywords)
    ? concept.material_keywords
    : [];

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <p style={styles.eyebrow}>PROJECT DETAIL</p>
            <h1 style={styles.title}>{project.project_name || "이름 없는 프로젝트"}</h1>
            <p style={styles.description}>
              프로젝트 기본 정보, 도면, AI 분석 결과, 디자인 컨셉, 3D 배치 결과를 확인할 수 있습니다.
            </p>
          </div>

          <div style={styles.topButtonRow}>
            <button
              type="button"
              onClick={() => router.push("/projects")}
              style={styles.secondaryButton}
            >
              목록으로
            </button>
            <button
              type="button"
              onClick={() => router.push(`/projects/${project.id}/edit`)}
              style={styles.primaryButton}
            >
              수정
            </button>
          </div>
        </div>

        {actionMessage ? (
          <div style={messageTone === "error" ? styles.errorBox : styles.successBox}>
            {actionMessage}
          </div>
        ) : null}

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>기본 정보</h2>
              <p style={styles.sectionDescription}>
                프로젝트에 저장된 기본 메타데이터입니다.
              </p>
            </div>
          </div>

          <div style={styles.infoGrid}>
            <InfoItem label="프로젝트명" value={project.project_name || "-"} />
            <InfoItem label="면적" value={project.area || "-"} />
            <InfoItem
              label="인원수"
              value={
                project.headcount !== null && project.headcount !== undefined
                  ? `${project.headcount}명`
                  : "-"
              }
            />
            <InfoItem label="공간 형태" value={project.shape || "-"} />
            <InfoItem
              label="대표 업종"
              value={getSpaceTypeLabel(project.space_type, project.space_type_detail)}
            />
            <InfoItem
              label="입력 방식"
              value={getInputModeLabel(project.input_mode)}
            />
          </div>

          <div style={styles.noteBox}>
            <div style={styles.noteTitle}>프로젝트 가이드</div>
            <div style={styles.noteText}>{getProjectGuideText(project)}</div>
          </div>

          <div style={styles.noteBox}>
            <div style={styles.noteTitle}>추가 요청사항</div>
            <div style={styles.noteText}>
              {project.notes?.trim() ? project.notes : "추가 요청사항이 없습니다."}
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>도면 / 스케치</h2>
              <p style={styles.sectionDescription}>
                업로드된 도면 파일 또는 손그림 스케치를 확인합니다.
              </p>
            </div>
          </div>

          {project.floorplan_file_url ? (
            <div style={styles.floorplanBox}>
              <div style={styles.actionArea}>
                <span style={styles.fileBadge}>
                  {isPdfFloorplan ? "PDF 파일" : "이미지 파일"}
                </span>
                <a
                  href={project.floorplan_file_url}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.linkButton}
                >
                  새 탭에서 열기
                </a>
              </div>

              {isPdfFloorplan ? (
                <div style={styles.emptyState}>
                  PDF 파일은 미리보기를 생략하고 링크로 제공합니다.
                </div>
              ) : (
                <img
                  src={project.floorplan_file_url}
                  alt="업로드한 도면"
                  style={styles.floorplanImage}
                />
              )}
            </div>
          ) : (
            <div style={styles.emptyState}>업로드된 도면/스케치 파일이 없습니다.</div>
          )}
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>AI 도면 분석</h2>
              <p style={styles.sectionDescription}>
                업로드된 도면 또는 입력된 정보를 바탕으로 AI가 공간 분석을 수행합니다.
              </p>
            </div>

            <div style={styles.headerActionRow}>
              <span style={getStatusBadgeStyle(project.analysis_status)}>
                {getStatusLabel(project.analysis_status)}
              </span>
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={isRunningAnalysis}
                style={{
                  ...styles.primaryButton,
                  opacity: isRunningAnalysis ? 0.7 : 1,
                  cursor: isRunningAnalysis ? "not-allowed" : "pointer",
                }}
              >
                {getAnalysisButtonLabel(project.analysis_status)}
              </button>
            </div>
          </div>

          {project.floorplan_analysis ? (
            <pre style={styles.codeBlock}>{prettyJson(project.floorplan_analysis)}</pre>
          ) : (
            <div style={styles.emptyState}>
              아직 저장된 AI 도면 분석 결과가 없습니다.
            </div>
          )}
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>디자인 컨셉</h2>
              <p style={styles.sectionDescription}>
                업종, 입력 방식, 제원을 바탕으로 AI가 공간의 분위기와 방향성을 추천합니다.
              </p>
            </div>

            <div style={styles.headerActionRow}>
              <span style={getStatusBadgeStyle(project.concept_status)}>
                {getStatusLabel(project.concept_status)}
              </span>
              <button
                type="button"
                onClick={handleGenerateConcept}
                disabled={isGeneratingConcept}
                style={{
                  ...styles.primaryButton,
                  opacity: isGeneratingConcept ? 0.7 : 1,
                  cursor: isGeneratingConcept ? "not-allowed" : "pointer",
                }}
              >
                {getConceptButtonLabel(project.concept_status)}
              </button>
            </div>
          </div>

          {concept ? (
            <div style={styles.conceptWrap}>
              <div style={styles.conceptHeroCard}>
                <div style={styles.conceptHeroTop}>
                  <div>
                    <div style={styles.conceptEyebrow}>AI CONCEPT RESULT</div>
                    <h3 style={styles.conceptTitle}>
                      {concept?.concept_title || "컨셉 제목 없음"}
                    </h3>
                    <p style={styles.conceptSubtitle}>
                      {concept?.concept_subtitle || "컨셉 설명이 없습니다."}
                    </p>
                  </div>
                  <div style={styles.heroActionHint}>
                    {project.concept_status === "completed"
                      ? "추천 완료"
                      : "추천 결과"}
                  </div>
                </div>

                <div style={styles.conceptSummaryGrid}>
                  <SummaryCard
                    label="업종"
                    value={
                      concept?.project_summary?.space_type_label ||
                      getSpaceTypeLabel(project.space_type, project.space_type_detail)
                    }
                  />
                  <SummaryCard
                    label="입력 방식"
                    value={
                      concept?.project_summary?.input_mode_label ||
                      getInputModeLabel(project.input_mode)
                    }
                  />
                  <SummaryCard
                    label="면적"
                    value={concept?.project_summary?.area || project.area || "-"}
                  />
                  <SummaryCard
                    label="인원수"
                    value={
                      concept?.project_summary?.headcount !== null &&
                      concept?.project_summary?.headcount !== undefined
                        ? `${concept.project_summary.headcount}명`
                        : project.headcount !== null && project.headcount !== undefined
                        ? `${project.headcount}명`
                        : "-"
                    }
                  />
                </div>

                <div style={styles.moodBox}>
                  <div style={styles.moodLabel}>추천 무드</div>
                  <div style={styles.moodText}>
                    {concept?.mood || "무드 설명이 없습니다."}
                  </div>
                </div>
              </div>

              <div style={styles.conceptGrid}>
                <div style={styles.miniCard}>
                  <div style={styles.subSectionTitle}>키워드</div>
                  {conceptKeywords.length > 0 ? (
                    <div style={styles.tagWrap}>
                      {conceptKeywords.map((item: string, index: number) => (
                        <span key={`${item}-${index}`} style={styles.tag}>
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={styles.emptyMiniState}>키워드 정보가 없습니다.</div>
                  )}
                </div>

                <div style={styles.miniCard}>
                  <div style={styles.subSectionTitle}>추천 공간 구성</div>
                  {conceptZones.length > 0 ? (
                    <div style={styles.tagWrap}>
                      {conceptZones.map((item: string, index: number) => (
                        <span key={`${item}-${index}`} style={styles.tagSoft}>
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={styles.emptyMiniState}>추천 공간 정보가 없습니다.</div>
                  )}
                </div>
              </div>

              <div style={styles.conceptGrid}>
                <div style={styles.miniCard}>
                  <div style={styles.subSectionTitle}>컬러 팔레트</div>
                  {conceptPalette.length > 0 ? (
                    <div style={styles.paletteWrap}>
                      {conceptPalette.map((color: string, index: number) => (
                        <div key={`${color}-${index}`} style={styles.paletteItem}>
                          <div
                            style={{
                              ...styles.paletteSwatch,
                              backgroundColor: color,
                            }}
                          />
                          <span style={styles.paletteCode}>{color}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={styles.emptyMiniState}>컬러 팔레트 정보가 없습니다.</div>
                  )}
                </div>

                <div style={styles.miniCard}>
                  <div style={styles.subSectionTitle}>추천 소재 / 마감</div>
                  {conceptMaterials.length > 0 ? (
                    <div style={styles.tagWrap}>
                      {conceptMaterials.map((item: string, index: number) => (
                        <span key={`${item}-${index}`} style={styles.tagNeutral}>
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={styles.emptyMiniState}>소재 정보가 없습니다.</div>
                  )}
                </div>
              </div>

              <div style={styles.conceptGrid}>
                <div style={styles.miniCard}>
                  <div style={styles.subSectionTitle}>스타일링 방향</div>
                  {conceptDirections.length > 0 ? (
                    <ul style={styles.bulletList}>
                      {conceptDirections.map((item: string, index: number) => (
                        <li key={`${item}-${index}`} style={styles.bulletItem}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={styles.emptyMiniState}>스타일링 방향 정보가 없습니다.</div>
                  )}
                </div>

                <div style={styles.miniCard}>
                  <div style={styles.subSectionTitle}>AI 추천 이유</div>
                  {conceptReasoning.length > 0 ? (
                    <ul style={styles.bulletList}>
                      {conceptReasoning.map((item: string, index: number) => (
                        <li key={`${item}-${index}`} style={styles.bulletItem}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={styles.emptyMiniState}>추천 이유 정보가 없습니다.</div>
                  )}
                </div>
              </div>

              {concept?.hero_prompt ? (
                <div style={styles.promptCard}>
                  <div style={styles.promptLabel}>비주얼 컨셉 프롬프트</div>
                  <div style={styles.promptText}>{concept.hero_prompt}</div>
                </div>
              ) : null}

              <details style={styles.detailsBox}>
                <summary style={styles.detailsSummary}>
                  원본 JSON 펼쳐보기
                </summary>
                <div style={styles.detailsContent}>
                  <pre style={styles.codeBlock}>{prettyJson(concept)}</pre>
                </div>
              </details>
            </div>
          ) : (
            <div style={styles.emptyState}>
              아직 저장된 디자인 컨셉 결과가 없습니다. 우측 버튼의{" "}
              <strong>AI 컨셉 추천 받기</strong>를 눌러 생성해 주세요.
            </div>
          )}
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>3D 배치 생성</h2>
              <p style={styles.sectionDescription}>
                AI가 생성한 배치 결과를 2D 미리보기와 JSON 형태로 확인합니다.
              </p>
            </div>

            <div style={styles.headerActionRow}>
              <span style={getStatusBadgeStyle(project.layout_status)}>
                {getStatusLabel(project.layout_status)}
              </span>
              <button
                type="button"
                onClick={handleGenerateLayout}
                disabled={isGeneratingLayout}
                style={{
                  ...styles.primaryButton,
                  opacity: isGeneratingLayout ? 0.7 : 1,
                  cursor: isGeneratingLayout ? "not-allowed" : "pointer",
                }}
              >
                {getLayoutButtonLabel(project.layout_status)}
              </button>
            </div>
          </div>

          {project.layout_3d_json ? (
            <div style={styles.layoutWrap}>
              <LayoutPreview2D layout={project.layout_3d_json} />
              <details style={styles.detailsBox}>
                <summary style={styles.detailsSummary}>
                  3D 배치 원본 JSON 펼쳐보기
                </summary>
                <div style={styles.detailsContent}>
                  <pre style={styles.codeBlock}>{prettyJson(project.layout_3d_json)}</pre>
                </div>
              </details>
            </div>
          ) : (
            <div style={styles.emptyState}>
              아직 저장된 3D 배치 결과가 없습니다.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoItem}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.summaryCard}>
      <div style={styles.summaryLabel}>{label}</div>
      <div style={styles.summaryValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f8fafc 0%, #f5f7fb 45%, #eef2ff 100%)",
    padding: "32px 20px 80px",
    fontFamily:
      'Inter, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  loadingCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "40px",
    textAlign: "center",
    fontSize: "16px",
    color: "#475569",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    flexWrap: "wrap",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 14px 36px rgba(15, 23, 42, 0.06)",
  },
  eyebrow: {
    margin: 0,
    color: "#6366f1",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.12em",
  },
  title: {
    margin: "10px 0 8px",
    color: "#0f172a",
    fontSize: "34px",
    lineHeight: 1.15,
  },
  description: {
    margin: 0,
    color: "#64748b",
    fontSize: "15px",
    lineHeight: 1.7,
    maxWidth: "720px",
  },
  topButtonRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.05)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "22px",
    lineHeight: 1.2,
  },
  sectionDescription: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.7,
    maxWidth: "700px",
  },
  headerActionRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },
  infoItem: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "14px 16px",
    backgroundColor: "#f8fafc",
  },
  infoLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: 700,
    marginBottom: "6px",
  },
  infoValue: {
    fontSize: "15px",
    color: "#0f172a",
    fontWeight: 700,
    lineHeight: 1.5,
  },
  noteBox: {
    marginTop: "16px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
    backgroundColor: "#fcfdff",
  },
  noteTitle: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#334155",
    marginBottom: "8px",
  },
  noteText: {
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#475569",
    whiteSpace: "pre-wrap",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "36px",
    padding: "0 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  primaryButton: {
    height: "40px",
    padding: "0 16px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(79, 70, 229, 0.22)",
  },
  secondaryButton: {
    height: "40px",
    padding: "0 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  linkButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "36px",
    padding: "0 14px",
    borderRadius: "10px",
    backgroundColor: "#eef2ff",
    color: "#4338ca",
    fontSize: "13px",
    fontWeight: 800,
    textDecoration: "none",
  },
  successBox: {
    border: "1px solid #86efac",
    backgroundColor: "#f0fdf4",
    color: "#166534",
    borderRadius: "16px",
    padding: "14px 16px",
    fontSize: "14px",
    fontWeight: 700,
  },
  errorBox: {
    border: "1px solid #fca5a5",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    borderRadius: "16px",
    padding: "14px 16px",
    fontSize: "14px",
    fontWeight: 700,
  },
  emptyState: {
    border: "1px dashed #cbd5e1",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    borderRadius: "16px",
    padding: "18px",
    fontSize: "14px",
    lineHeight: 1.7,
  },
  emptyMiniState: {
    border: "1px dashed #dbe4f0",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    borderRadius: "14px",
    padding: "14px",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  codeBlock: {
    margin: 0,
    padding: "16px",
    borderRadius: "16px",
    backgroundColor: "#0f172a",
    color: "#e2e8f0",
    overflowX: "auto",
    fontSize: "13px",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  conceptWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  conceptHeroCard: {
    borderRadius: "24px",
    padding: "22px",
    background:
      "linear-gradient(135deg, rgba(79,70,229,0.10) 0%, rgba(124,58,237,0.12) 55%, rgba(255,255,255,0.95) 100%)",
    border: "1px solid #ddd6fe",
    boxShadow: "0 16px 34px rgba(99, 102, 241, 0.10)",
  },
  conceptHeroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  heroActionHint: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "0 12px",
    borderRadius: "999px",
    backgroundColor: "rgba(255,255,255,0.85)",
    color: "#5b21b6",
    fontSize: "12px",
    fontWeight: 800,
    border: "1px solid rgba(139,92,246,0.22)",
    whiteSpace: "nowrap",
  },
  conceptEyebrow: {
    fontSize: "12px",
    fontWeight: 900,
    color: "#6d28d9",
    letterSpacing: "0.12em",
    marginBottom: "8px",
  },
  conceptTitle: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.15,
    color: "#1e1b4b",
  },
  conceptSubtitle: {
    margin: "10px 0 0",
    color: "#4c1d95",
    fontSize: "14px",
    lineHeight: 1.7,
    maxWidth: "820px",
  },
  conceptSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  summaryCard: {
    borderRadius: "16px",
    padding: "14px 16px",
    backgroundColor: "rgba(255,255,255,0.78)",
    border: "1px solid rgba(196,181,253,0.5)",
    backdropFilter: "blur(8px)",
  },
  summaryLabel: {
    fontSize: "12px",
    fontWeight: 800,
    color: "#6d28d9",
    marginBottom: "6px",
  },
  summaryValue: {
    fontSize: "15px",
    fontWeight: 800,
    color: "#1f2937",
    lineHeight: 1.5,
  },
  moodBox: {
    borderRadius: "18px",
    padding: "16px",
    backgroundColor: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(216,180,254,0.5)",
  },
  moodLabel: {
    fontSize: "12px",
    fontWeight: 900,
    color: "#7c3aed",
    letterSpacing: "0.06em",
    marginBottom: "8px",
  },
  moodText: {
    fontSize: "15px",
    lineHeight: 1.8,
    color: "#374151",
    fontWeight: 600,
  },
  conceptGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px",
  },
  miniCard: {
    borderRadius: "20px",
    padding: "18px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  subSectionTitle: {
    fontSize: "14px",
    fontWeight: 800,
    color: "#334155",
  },
  tagWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "0 12px",
    borderRadius: "999px",
    background:
      "linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(124,58,237,0.10) 100%)",
    color: "#4338ca",
    border: "1px solid rgba(129,140,248,0.35)",
    fontSize: "13px",
    fontWeight: 800,
  },
  tagSoft: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "0 12px",
    borderRadius: "999px",
    backgroundColor: "#ecfeff",
    color: "#0f766e",
    border: "1px solid #99f6e4",
    fontSize: "13px",
    fontWeight: 800,
  },
  tagNeutral: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "0 12px",
    borderRadius: "999px",
    backgroundColor: "#f8fafc",
    color: "#334155",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    fontWeight: 700,
  },
  paletteWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
  paletteItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 10px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
  },
  paletteSwatch: {
    width: "22px",
    height: "22px",
    borderRadius: "999px",
    border: "1px solid rgba(15, 23, 42, 0.12)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)",
  },
  paletteCode: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#334155",
  },
  bulletList: {
    margin: 0,
    paddingLeft: "20px",
    color: "#475569",
  },
  bulletItem: {
    fontSize: "14px",
    lineHeight: 1.8,
    marginBottom: "6px",
  },
  promptCard: {
    borderRadius: "18px",
    padding: "18px",
    border: "1px solid #dbeafe",
    background:
      "linear-gradient(135deg, rgba(239,246,255,0.95) 0%, rgba(224,231,255,0.85) 100%)",
  },
  promptLabel: {
    fontSize: "12px",
    fontWeight: 900,
    color: "#1d4ed8",
    letterSpacing: "0.08em",
    marginBottom: "8px",
  },
  promptText: {
    fontSize: "14px",
    lineHeight: 1.8,
    color: "#334155",
    wordBreak: "break-word",
  },
  detailsBox: {
    borderRadius: "18px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  detailsSummary: {
    cursor: "pointer",
    padding: "16px 18px",
    fontSize: "14px",
    fontWeight: 800,
    color: "#334155",
    backgroundColor: "#f8fafc",
    listStyle: "none",
  },
  detailsContent: {
    padding: "16px",
    borderTop: "1px solid #e2e8f0",
  },
  layoutWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  actionArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  fileBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "0 12px",
    borderRadius: "999px",
    backgroundColor: "#e2e8f0",
    color: "#334155",
    fontSize: "12px",
    fontWeight: 800,
  },
  floorplanBox: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
    backgroundColor: "#f8fafc",
  },
  floorplanImage: {
    width: "100%",
    maxWidth: "100%",
    borderRadius: "12px",
    marginTop: "14px",
    display: "block",
    objectFit: "contain",
  },
};
