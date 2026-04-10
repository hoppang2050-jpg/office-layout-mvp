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
  project_name: string;
  space_type: string | null;
  space_type_detail: string | null;
  input_mode: string | null;
  area: string | null;
  headcount: number | null;
  shape: string | null;
  notes: string | null;
  floorplan_file_url: string | null;
  concept_status: string | null;
  design_concept_json: any;
  analysis_status: string | null;
  floorplan_analysis: any;
  layout_status: string | null;
  layout_3d_json: any;
  created_at: string | null;
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Number(params?.id);

  const [project, setProject] = useState<OfficeProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const isPdfFloorplan = useMemo(() => {
    if (!project?.floorplan_file_url) return false;
    return project.floorplan_file_url.toLowerCase().includes(".pdf");
  }, [project?.floorplan_file_url]);

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

  useEffect(() => {
    loadProject();
  }, [projectId]);

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

      setActionMessage("AI 컨셉 추천이 완료되었습니다.");
      await loadProject();
    } catch (error: any) {
      setActionMessage(error?.message || "AI 컨셉 추천 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingConcept(false);
    }
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
        throw new Error(result?.error || "AI 분석 실행 중 오류가 발생했습니다.");
      }

      setActionMessage("AI 도면 분석이 완료되었습니다.");
      await loadProject();
    } catch (error: any) {
      setActionMessage(error?.message || "AI 분석 실행 중 오류가 발생했습니다.");
    } finally {
      setIsRunningAnalysis(false);
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

      setActionMessage("3D 배치 생성이 완료되었습니다.");
      await loadProject();
    } catch (error: any) {
      setActionMessage(error?.message || "3D 배치 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingLayout(false);
    }
  }

  function getStatusBadgeStyle(status: string | null): CSSProperties {
    switch (status) {
      case "completed":
        return {
          ...styles.badge,
          backgroundColor: "#dcfce7",
          color: "#166534",
        };
      case "processing":
        return {
          ...styles.badge,
          backgroundColor: "#fef3c7",
          color: "#92400e",
        };
      case "failed":
        return {
          ...styles.badge,
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
        };
      default:
        return {
          ...styles.badge,
          backgroundColor: "#e0e7ff",
          color: "#3730a3",
        };
    }
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
        return "-";
    }
  }

  function getInputModeLabel(inputMode: string | null) {
    switch (inputMode) {
      case "floorplan":
        return "정식 도면 업로드";
      case "sketch":
        return "손그림 스케치 업로드";
      case "no_drawing":
        return "도면 없이 텍스트만 입력";
      default:
        return "-";
    }
  }

  function getProjectGuideText(spaceType: string | null, inputMode: string | null) {
    const modeText =
      inputMode === "floorplan"
        ? "정식 도면을 기준으로 공간 구조를 해석하는 흐름"
        : inputMode === "sketch"
        ? "손그림 스케치를 참고해서 공간 의도를 읽는 흐름"
        : "텍스트 제원만으로 기본 배치안을 만드는 흐름";

    switch (spaceType) {
      case "office":
        return `이 프로젝트는 사무실 유형이며, ${modeText}입니다. 팀 구조, 회의실 수, 탕비실/집중존 여부가 배치 품질에 크게 영향을 줍니다.`;
      case "cafe":
        return `이 프로젝트는 카페 유형이며, ${modeText}입니다. 좌석 밀도, 바 카운터, 포토존, 체류형/회전형 운영 방향이 중요합니다.`;
      case "restaurant":
        return `이 프로젝트는 식당 유형이며, ${modeText}입니다. 홀/주방/대기 공간과 서빙 동선, 테이블 비율이 핵심입니다.`;
      case "fitness":
        return `이 프로젝트는 헬스장/피트니스 유형이며, ${modeText}입니다. 머신존, PT룸, 락커/샤워실 구성이 중요한 기준입니다.`;
      case "retail":
        return `이 프로젝트는 매장/쇼룸 유형이며, ${modeText}입니다. 진열, 체험, 카운터, 재고공간의 우선순위를 함께 봐야 합니다.`;
      case "other":
        return `이 프로젝트는 기타 업종이며, ${modeText}입니다. 세부 업종과 운영 방식을 자세히 적어줄수록 추천 결과가 더 정확해집니다.`;
      default:
        return `이 프로젝트는 ${modeText}입니다.`;
    }
  }

  function prettyJson(value: any) {
    if (!value) return "";
    return JSON.stringify(value, null, 2);
  }

  const primaryConcept = project?.design_concept_json?.primary_concept;
  const conceptAlternatives = Array.isArray(project?.design_concept_json?.alternatives)
    ? project?.design_concept_json?.alternatives
    : [];
  const conceptKeywords = Array.isArray(primaryConcept?.keywords)
    ? primaryConcept.keywords
    : [];
  const conceptPalette = Array.isArray(primaryConcept?.palette)
    ? primaryConcept.palette
    : [];
  const conceptMaterials = Array.isArray(primaryConcept?.materials)
    ? primaryConcept.materials
    : [];
  const conceptFocalPoints = Array.isArray(primaryConcept?.focal_points)
    ? primaryConcept.focal_points
    : [];
  const conceptPrinciples = Array.isArray(primaryConcept?.planning_principles)
    ? primaryConcept.planning_principles
    : [];
  const recommendedZones = Array.isArray(project?.design_concept_json?.recommended_zones)
    ? project?.design_concept_json?.recommended_zones
    : [];

  if (isLoading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>불러오는 중...</div>
        </div>
      </main>
    );
  }

  if (pageError) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorBox}>{pageError}</div>
          <button
            style={styles.secondaryButton}
            onClick={() => router.push("/projects")}
          >
            목록으로
          </button>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorBox}>프로젝트를 찾을 수 없습니다.</div>
          <button
            style={styles.secondaryButton}
            onClick={() => router.push("/projects")}
          >
            목록으로
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <p style={styles.eyebrow}>PROJECT DETAIL</p>
            <h1 style={styles.title}>{project.project_name}</h1>
            <p style={styles.description}>
              프로젝트 기본 정보, 컨셉 추천, 도면/스케치, AI 분석 결과, 3D 배치 결과를 확인할 수 있어요.
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
          <div
            style={
              actionMessage.includes("오류") || actionMessage.includes("실패")
                ? styles.errorBox
                : styles.successBox
            }
          >
            {actionMessage}
          </div>
        ) : null}

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>프로젝트 성격</h2>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>대표업종</div>
              <div style={styles.infoValue}>{getSpaceTypeLabel(project.space_type)}</div>
            </div>

            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>기타 업종 상세</div>
              <div style={styles.infoValue}>
                {project.space_type === "other"
                  ? project.space_type_detail || "-"
                  : "-"}
              </div>
            </div>

            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>입력 방식</div>
              <div style={styles.infoValue}>{getInputModeLabel(project.input_mode)}</div>
            </div>

            <div style={styles.infoItemWide}>
              <div style={styles.infoLabel}>현재 해석 기준 안내</div>
              <div style={styles.infoValue}>
                {getProjectGuideText(project.space_type, project.input_mode)}
              </div>
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>기본 정보</h2>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>프로젝트명</div>
              <div style={styles.infoValue}>{project.project_name || "-"}</div>
            </div>

            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>면적</div>
              <div style={styles.infoValue}>{project.area || "-"}</div>
            </div>

            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>인원수 / 예상 수용 인원</div>
              <div style={styles.infoValue}>
                {project.headcount !== null && project.headcount !== undefined
                  ? `${project.headcount}명`
                  : "-"}
              </div>
            </div>

            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>공간 형태</div>
              <div style={styles.infoValue}>{project.shape || "-"}</div>
            </div>

            <div style={styles.infoItemWide}>
              <div style={styles.infoLabel}>추가 요청사항</div>
              <div style={styles.infoValue}>{project.notes || "-"}</div>
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeaderRow}>
            <div>
              <h2 style={styles.sectionTitle}>AI 컨셉 추천</h2>
              <p style={styles.sectionDescription}>
                업종, 입력 방식, 제원 정보를 바탕으로 디자인 방향과 공간 컨셉을 추천하는 단계예요.
              </p>
            </div>

            <div style={styles.actionArea}>
              <span style={getStatusBadgeStyle(project.concept_status)}>
                컨셉 {getStatusLabel(project.concept_status)}
              </span>
              <button
                type="button"
                onClick={handleGenerateConcept}
                style={styles.primaryButton}
                disabled={isGeneratingConcept}
              >
                {isGeneratingConcept ? "컨셉 추천 중..." : "AI 컨셉 추천"}
              </button>
            </div>
          </div>

          {project.design_concept_json ? (
            <div style={styles.conceptWrap}>
              <div style={styles.heroConceptCard}>
                <div style={styles.heroConceptTop}>
                  <span style={styles.heroConceptBadge}>추천 메인 컨셉</span>
                  <h3 style={styles.heroConceptTitle}>
                    {primaryConcept?.name || "추천 컨셉"}
                  </h3>
                  <p style={styles.heroConceptSummary}>
                    {primaryConcept?.summary || "-"}
                  </p>
                </div>

                <div style={styles.conceptSectionGrid}>
                  <div style={styles.conceptInfoCard}>
                    <div style={styles.conceptCardTitle}>분위기</div>
                    <div style={styles.conceptCardText}>
                      {primaryConcept?.mood || "-"}
                    </div>
                  </div>

                  <div style={styles.conceptInfoCard}>
                    <div style={styles.conceptCardTitle}>브랜드 스토리</div>
                    <div style={styles.conceptCardText}>
                      {project.design_concept_json?.brand_story || "-"}
                    </div>
                  </div>
                </div>

                <div style={styles.chipGroupWrap}>
                  <div style={styles.chipGroup}>
                    <div style={styles.chipTitle}>키워드</div>
                    <div style={styles.tagWrap}>
                      {conceptKeywords.length > 0 ? (
                        conceptKeywords.map((item: string, index: number) => (
                          <span key={`${item}-${index}`} style={styles.tagBlue}>
                            {item}
                          </span>
                        ))
                      ) : (
                        <span style={styles.emptyTag}>없음</span>
                      )}
                    </div>
                  </div>

                  <div style={styles.chipGroup}>
                    <div style={styles.chipTitle}>컬러 팔레트</div>
                    <div style={styles.tagWrap}>
                      {conceptPalette.length > 0 ? (
                        conceptPalette.map((item: string, index: number) => (
                          <span key={`${item}-${index}`} style={styles.tagPurple}>
                            {item}
                          </span>
                        ))
                      ) : (
                        <span style={styles.emptyTag}>없음</span>
                      )}
                    </div>
                  </div>

                  <div style={styles.chipGroup}>
                    <div style={styles.chipTitle}>재료감</div>
                    <div style={styles.tagWrap}>
                      {conceptMaterials.length > 0 ? (
                        conceptMaterials.map((item: string, index: number) => (
                          <span key={`${item}-${index}`} style={styles.tagGreen}>
                            {item}
                          </span>
                        ))
                      ) : (
                        <span style={styles.emptyTag}>없음</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={styles.conceptSectionGrid}>
                  <div style={styles.conceptInfoCard}>
                    <div style={styles.conceptCardTitle}>포인트 공간</div>
                    {conceptFocalPoints.length > 0 ? (
                      <ul style={styles.list}>
                        {conceptFocalPoints.map((item: string, index: number) => (
                          <li key={`${item}-${index}`} style={styles.listItem}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={styles.conceptCardText}>없음</div>
                    )}
                  </div>

                  <div style={styles.conceptInfoCard}>
                    <div style={styles.conceptCardTitle}>배치 원칙</div>
                    {conceptPrinciples.length > 0 ? (
                      <ul style={styles.list}>
                        {conceptPrinciples.map((item: string, index: number) => (
                          <li key={`${item}-${index}`} style={styles.listItem}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={styles.conceptCardText}>없음</div>
                    )}
                  </div>
                </div>

                <div style={styles.chipGroup}>
                  <div style={styles.chipTitle}>추천 존</div>
                  <div style={styles.tagWrap}>
                    {recommendedZones.length > 0 ? (
                      recommendedZones.map((item: string, index: number) => (
                        <span key={`${item}-${index}`} style={styles.tagGray}>
                          {item}
                        </span>
                      ))
                    ) : (
                      <span style={styles.emptyTag}>없음</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={styles.altCard}>
                <div style={styles.altTitle}>대안 컨셉</div>

                {conceptAlternatives.length > 0 ? (
                  <div style={styles.altGrid}>
                    {conceptAlternatives.map((item: any, index: number) => (
                      <div key={`${item?.name}-${index}`} style={styles.altItem}>
                        <div style={styles.altName}>{item?.name || `대안 ${index + 1}`}</div>
                        <div style={styles.altSummary}>{item?.summary || "-"}</div>
                        <div style={styles.tagWrap}>
                          {Array.isArray(item?.keywords) && item.keywords.length > 0 ? (
                            item.keywords.map((keyword: string, keywordIndex: number) => (
                              <span
                                key={`${keyword}-${keywordIndex}`}
                                style={styles.tagLight}
                              >
                                {keyword}
                              </span>
                            ))
                          ) : (
                            <span style={styles.emptyTag}>없음</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyBox}>아직 대안 컨셉이 없습니다.</div>
                )}
              </div>

              <details style={styles.detailsBox}>
                <summary style={styles.detailsSummary}>원본 컨셉 JSON 보기</summary>
                <pre style={styles.jsonBox}>
                  {prettyJson(project.design_concept_json)}
                </pre>
              </details>
            </div>
          ) : (
            <div style={styles.emptyBox}>아직 저장된 AI 컨셉 추천 결과가 없습니다.</div>
          )}
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeaderRow}>
            <h2 style={styles.sectionTitle}>도면 / 스케치 파일</h2>
            {project.floorplan_file_url ? (
              <span
                style={{
                  ...styles.badge,
                  backgroundColor: "#dbeafe",
                  color: "#1d4ed8",
                }}
              >
                파일 있음
              </span>
            ) : (
              <span
                style={{
                  ...styles.badge,
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                }}
              >
                파일 없음
              </span>
            )}
          </div>

          {!project.floorplan_file_url ? (
            <div style={styles.emptyBox}>업로드된 도면 또는 스케치 파일이 없습니다.</div>
          ) : isPdfFloorplan ? (
            <div style={styles.floorplanBox}>
              <p style={styles.helperText}>PDF 형식 파일입니다.</p>
              <a
                href={project.floorplan_file_url}
                target="_blank"
                rel="noreferrer"
                style={styles.linkButton}
              >
                파일 열기
              </a>
            </div>
          ) : (
            <div style={styles.floorplanBox}>
              <img
                src={project.floorplan_file_url}
                alt="업로드된 파일"
                style={styles.floorplanImage}
              />
            </div>
          )}
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeaderRow}>
            <div>
              <h2 style={styles.sectionTitle}>AI 도면 분석</h2>
              <p style={styles.sectionDescription}>
                업종과 입력 방식에 맞춰 공간 구조 또는 기본 요구사항을 해석하는 단계예요.
              </p>
            </div>

            <div style={styles.actionArea}>
              <span style={getStatusBadgeStyle(project.analysis_status)}>
                분석 {getStatusLabel(project.analysis_status)}
              </span>
              <button
                type="button"
                onClick={handleRunAnalysis}
                style={styles.primaryButton}
                disabled={isRunningAnalysis}
              >
                {isRunningAnalysis ? "분석 실행 중..." : "AI 분석 실행"}
              </button>
            </div>
          </div>

          {project.floorplan_analysis ? (
            <pre style={styles.jsonBox}>
              {prettyJson(project.floorplan_analysis)}
            </pre>
          ) : (
            <div style={styles.emptyBox}>아직 저장된 AI 분석 결과가 없습니다.</div>
          )}
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeaderRow}>
            <div>
              <h2 style={styles.sectionTitle}>3D 배치 생성</h2>
              <p style={styles.sectionDescription}>
                분석 결과와 프로젝트 정보를 바탕으로 자동 배치 결과를 저장하고 미리보기로 보여줍니다.
              </p>
            </div>

            <div style={styles.actionArea}>
              <span style={getStatusBadgeStyle(project.layout_status)}>
                배치 {getStatusLabel(project.layout_status)}
              </span>
              <button
                type="button"
                onClick={handleGenerateLayout}
                style={styles.primaryButton}
                disabled={isGeneratingLayout}
              >
                {isGeneratingLayout ? "3D 배치 생성 중..." : "3D 배치 실행"}
              </button>
            </div>
          </div>

          {project.layout_3d_json ? (
            <div style={styles.previewWrap}>
              <LayoutPreview2D layout={project.layout_3d_json} />

              <details style={styles.detailsBox}>
                <summary style={styles.detailsSummary}>원본 JSON 보기</summary>
                <pre style={styles.jsonBox}>
                  {prettyJson(project.layout_3d_json)}
                </pre>
              </details>
            </div>
          ) : (
            <div style={styles.emptyBox}>아직 저장된 3D 배치 결과가 없습니다.</div>
          )}
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    padding: "40px 20px",
  },
  container: {
    maxWidth: "1080px",
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  topButtonRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: 0,
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.08em",
  },
  title: {
    margin: "8px 0 10px",
    fontSize: "32px",
    lineHeight: 1.2,
    color: "#0f172a",
  },
  description: {
    margin: 0,
    color: "#475569",
    fontSize: "15px",
    lineHeight: 1.6,
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
    marginBottom: "20px",
  },
  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#0f172a",
  },
  sectionDescription: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  infoItem: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    backgroundColor: "#f8fafc",
  },
  infoItemWide: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    backgroundColor: "#f8fafc",
    gridColumn: "1 / -1",
  },
  infoLabel: {
    fontSize: "12px",
    fontWeight: 800,
    color: "#64748b",
    marginBottom: "8px",
    letterSpacing: "0.04em",
  },
  infoValue: {
    fontSize: "15px",
    color: "#0f172a",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  actionArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
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
  },
};
