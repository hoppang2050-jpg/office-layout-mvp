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
  area: string | null;
  headcount: number | null;
  shape: string | null;
  notes: string | null;
  floorplan_file_url: string | null;
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

  function prettyJson(value: any) {
    if (!value) return "";
    return JSON.stringify(value, null, 2);
  }

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
              프로젝트 기본 정보, 도면, AI 분석 결과, 3D 배치 결과를 확인할 수 있어요.
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
              <div style={styles.infoLabel}>인원수</div>
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
            <h2 style={styles.sectionTitle}>도면 파일</h2>
            {project.floorplan_file_url ? (
              <span
                style={{
                  ...styles.badge,
                  backgroundColor: "#dbeafe",
                  color: "#1d4ed8",
                }}
              >
                도면 있음
              </span>
            ) : (
              <span
                style={{
                  ...styles.badge,
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                }}
              >
                도면 없음
              </span>
            )}
          </div>

          {!project.floorplan_file_url ? (
            <div style={styles.emptyBox}>업로드된 도면 파일이 없습니다.</div>
          ) : isPdfFloorplan ? (
            <div style={styles.floorplanBox}>
              <p style={styles.helperText}>PDF 도면 파일입니다.</p>
              <a
                href={project.floorplan_file_url}
                target="_blank"
                rel="noreferrer"
                style={styles.linkButton}
              >
                PDF 도면 열기
              </a>
            </div>
          ) : (
            <div style={styles.floorplanBox}>
              <img
                src={project.floorplan_file_url}
                alt="업로드된 도면"
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
                도면이 있으면 구조를 읽고, 없으면 입력값 기반으로 기본 정보를 정리하는 단계예요.
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
                <summary style={styles.detailsSummary}>
                  원본 JSON 보기
                </summary>
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
    maxWidth: "980px",
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
    display: "block",
  },
  jsonBox: {
    margin: 0,
    padding: "16px",
    backgroundColor: "#0f172a",
    color: "#e2e8f0",
    borderRadius: "16px",
    overflowX: "auto",
    fontSize: "13px",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  emptyBox: {
    border: "1px dashed #cbd5e1",
    borderRadius: "16px",
    padding: "18px",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    fontSize: "14px",
  },
  helperText: {
    marginTop: 0,
    marginBottom: "12px",
    color: "#475569",
    fontSize: "14px",
  },
  linkButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: 700,
    textDecoration: "none",
  },
  primaryButton: {
    border: "none",
    borderRadius: "12px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  errorBox: {
    marginBottom: "16px",
    padding: "12px 14px",
    borderRadius: "12px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    fontSize: "14px",
    fontWeight: 600,
    border: "1px solid #fecaca",
  },
  successBox: {
    marginBottom: "16px",
    padding: "12px 14px",
    borderRadius: "12px",
    backgroundColor: "#ecfdf5",
    color: "#047857",
    fontSize: "14px",
    fontWeight: 600,
    border: "1px solid #a7f3d0",
  },
  previewWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  detailsBox: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "14px",
    backgroundColor: "#ffffff",
  },
  detailsSummary: {
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "12px",
  },
};
