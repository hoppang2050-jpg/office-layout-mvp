"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Project = {
  id: number;
  project_name: string;
  area: number | null;
  headcount: number | null;
  shape: string | null;
  notes: string | null;
  floorplan_file_url: string | null;
  floorplan_file_name: string | null;
  analysis_status: string | null;
  floorplan_analysis: Record<string, any> | null;
  created_at: string;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const projectId = Number(params?.id);

  useEffect(() => {
    if (!projectId || Number.isNaN(projectId)) {
      setErrorMessage("올바른 프로젝트 ID가 아닙니다.");
      setLoading(false);
      return;
    }

    fetchProject(projectId);
  }, [projectId]);

  const fetchProject = async (id: number) => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("office_projects")
      .select(
        "id, project_name, area, headcount, shape, notes, floorplan_file_url, floorplan_file_name, analysis_status, floorplan_analysis, created_at"
      )
      .eq("id", id)
      .single();

    if (error) {
      setErrorMessage(error.message || "프로젝트 상세 정보를 불러오지 못했습니다.");
      setProject(null);
    } else {
      setProject(data as Project);
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!project) return;

    const confirmed = window.confirm("이 프로젝트를 삭제할까요?");
    if (!confirmed) return;

    setDeleting(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("office_projects")
      .delete()
      .eq("id", project.id);

    if (error) {
      setErrorMessage(error.message || "프로젝트 삭제 중 오류가 발생했습니다.");
      setDeleting(false);
      return;
    }

    alert("프로젝트가 삭제되었습니다.");
    router.push("/projects");
    router.refresh();
  };

  const handleAnalyze = async () => {
    if (!project) return;

    setAnalyzing(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/analyze-floorplan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "AI 분석 요청 중 오류가 발생했습니다.");
      }

      await fetchProject(project.id);
      alert("AI 분석 결과가 저장되었습니다.");
    } catch (error: any) {
      setErrorMessage(error?.message || "AI 분석 요청 중 오류가 발생했습니다.");
    } finally {
      setAnalyzing(false);
    }
  };

  const fileType = useMemo(() => {
    const fileUrl = project?.floorplan_file_url?.toLowerCase() ?? "";
    const fileName = project?.floorplan_file_name?.toLowerCase() ?? "";
    const target = `${fileUrl} ${fileName}`;

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
  }, [project]);

  const analysisStatusLabel = useMemo(() => {
    const status = project?.analysis_status ?? "pending";

    if (status === "completed") return "분석 완료";
    if (status === "failed") return "분석 실패";
    if (status === "processing") return "분석 중";
    return "분석 대기";
  }, [project]);

  const analysisStatusStyle = useMemo((): CSSProperties => {
    const status = project?.analysis_status ?? "pending";

    if (status === "completed") {
      return {
        ...analysisBadgeBaseStyle,
        backgroundColor: "#dcfce7",
        color: "#166534",
      };
    }

    if (status === "failed") {
      return {
        ...analysisBadgeBaseStyle,
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
      };
    }

    if (status === "processing") {
      return {
        ...analysisBadgeBaseStyle,
        backgroundColor: "#fef3c7",
        color: "#92400e",
      };
    }

    return {
      ...analysisBadgeBaseStyle,
      backgroundColor: "#dbeafe",
      color: "#1d4ed8",
    };
  }, [project]);

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={emptyBoxStyle}>프로젝트 상세 정보를 불러오는 중...</div>
        </div>
      </main>
    );
  }

  if (errorMessage && !project) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={errorBoxStyle}>{errorMessage}</div>
          <div style={{ marginTop: "16px" }}>
            <Link href="/projects" style={secondaryButtonStyle}>
              목록으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={emptyBoxStyle}>프로젝트 정보를 찾을 수 없어요.</div>
          <div style={{ marginTop: "16px" }}>
            <Link href="/projects" style={secondaryButtonStyle}>
              목록으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div style={topBarStyle}>
          <div>
            <p style={eyebrowStyle}>PROJECT DETAIL</p>
            <h1 style={titleStyle}>{project.project_name}</h1>
            <p style={descriptionStyle}>
              저장된 프로젝트 정보, 업로드된 도면 파일, AI 분석 상태를 확인할 수 있어요.
            </p>
          </div>

          <div style={topButtonRowStyle}>
            <Link href="/projects" style={secondaryButtonStyle}>
              목록으로
            </Link>
            <Link
              href={`/projects/${project.id}/edit`}
              style={secondaryButtonStyle}
            >
              수정
            </Link>
            <Link
              href={`/projects/${project.id}/layout3d`}
              style={primaryButtonStyle}
            >
              3D 배치도면 만들기
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              style={dangerButtonStyle}
            >
              {deleting ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>프로젝트 기본 정보</h2>

          <div style={infoGridStyle}>
            <div style={infoCardStyle}>
              <p style={infoLabelStyle}>프로젝트 이름</p>
              <p style={infoValueStyle}>{project.project_name}</p>
            </div>

            <div style={infoCardStyle}>
              <p style={infoLabelStyle}>면적</p>
              <p style={infoValueStyle}>
                {project.area !== null ? `${project.area}㎡` : "-"}
              </p>
            </div>

            <div style={infoCardStyle}>
              <p style={infoLabelStyle}>인원</p>
              <p style={infoValueStyle}>
                {project.headcount !== null ? `${project.headcount}명` : "-"}
              </p>
            </div>

            <div style={infoCardStyle}>
              <p style={infoLabelStyle}>공간 형태</p>
              <p style={infoValueStyle}>{project.shape || "-"}</p>
            </div>

            <div style={infoCardStyle}>
              <p style={infoLabelStyle}>생성일</p>
              <p style={infoValueStyle}>
                {new Date(project.created_at).toLocaleDateString("ko-KR")}
              </p>
            </div>

            <div style={infoCardStyle}>
              <p style={infoLabelStyle}>도면 파일명</p>
              <p style={infoValueStyle}>{project.floorplan_file_name || "-"}</p>
            </div>
          </div>

          <div style={noteBoxStyle}>
            <p style={infoLabelStyle}>추가 요청사항</p>
            <p style={noteTextStyle}>{project.notes || "-"}</p>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={analysisHeaderStyle}>
            <h2 style={sectionTitleStyle}>AI 도면 분석</h2>
            <div style={analysisRightBoxStyle}>
              <span style={analysisStatusStyle}>{analysisStatusLabel}</span>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                style={analyzeButtonStyle}
              >
                {analyzing ? "분석 중..." : "AI 분석 실행"}
              </button>
            </div>
          </div>

          {errorMessage ? <div style={errorBoxStyle}>{errorMessage}</div> : null}

          {!project.floorplan_analysis ? (
            <div style={analysisPendingBoxStyle}>
              <p style={analysisPendingTitleStyle}>
                아직 AI 분석 결과가 저장되지 않았어요.
              </p>
              <p style={analysisPendingTextStyle}>
                현재 상태는 <strong>{project.analysis_status ?? "pending"}</strong> 입니다.
                버튼을 누르면 가짜 분석 API가 실행되고, 다음 단계에서 이 자리를
                실제 OpenAI Vision 분석 결과로 바꾸게 됩니다.
              </p>
            </div>
          ) : (
            <div style={analysisResultBoxStyle}>
              <p style={analysisResultTitleStyle}>저장된 분석 결과(JSON)</p>
              <pre style={analysisPreStyle}>
                {JSON.stringify(project.floorplan_analysis, null, 2)}
              </pre>
            </div>
          )}
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>업로드된 도면 파일</h2>

          {!project.floorplan_file_url ? (
            <div style={emptyBoxStyle}>업로드된 도면 파일이 없어요.</div>
          ) : fileType === "image" ? (
            <div style={previewWrapperStyle}>
              <img
                src={project.floorplan_file_url}
                alt={project.floorplan_file_name || "업로드된 도면 이미지"}
                style={previewImageStyle}
              />

              <div style={fileButtonRowStyle}>
                <a
                  href={project.floorplan_file_url}
                  target="_blank"
                  rel="noreferrer"
                  style={secondaryButtonStyle}
                >
                  새 탭에서 열기
                </a>
                <a
                  href={project.floorplan_file_url}
                  download
                  style={primaryButtonStyle}
                >
                  이미지 다운로드
                </a>
              </div>
            </div>
          ) : fileType === "pdf" ? (
            <div style={pdfBoxStyle}>
              <p style={pdfTextStyle}>PDF 도면 파일이 업로드되어 있어요.</p>
              <div style={fileButtonRowStyle}>
                <a
                  href={project.floorplan_file_url}
                  target="_blank"
                  rel="noreferrer"
                  style={secondaryButtonStyle}
                >
                  PDF 열기
                </a>
                <a
                  href={project.floorplan_file_url}
                  download
                  style={primaryButtonStyle}
                >
                  PDF 다운로드
                </a>
              </div>
            </div>
          ) : (
            <div style={pdfBoxStyle}>
              <p style={pdfTextStyle}>
                도면 파일이 업로드되어 있어요. 아래 버튼으로 열거나 내려받을 수 있어요.
              </p>
              <div style={fileButtonRowStyle}>
                <a
                  href={project.floorplan_file_url}
                  target="_blank"
                  rel="noreferrer"
                  style={secondaryButtonStyle}
                >
                  파일 열기
                </a>
                <a
                  href={project.floorplan_file_url}
                  download
                  style={primaryButtonStyle}
                >
                  파일 다운로드
                </a>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg, #f8fbff 0%, #eef4ff 50%, #f8fafc 100%)",
  padding: "40px 20px",
};

const containerStyle: CSSProperties = {
  maxWidth: "1100px",
  margin: "0 auto",
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  color: "#2563eb",
};

const titleStyle: CSSProperties = {
  margin: "8px 0",
  fontSize: "34px",
  fontWeight: 800,
  color: "#0f172a",
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "15px",
  lineHeight: 1.6,
};

const topButtonRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const cardStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
  marginBottom: "20px",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 800,
  color: "#0f172a",
};

const infoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const infoCardStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "16px",
  backgroundColor: "#f8fafc",
};

const infoLabelStyle: CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#64748b",
  fontWeight: 700,
};

const infoValueStyle: CSSProperties = {
  margin: "8px 0 0",
  fontSize: "18px",
  color: "#0f172a",
  fontWeight: 700,
  lineHeight: 1.5,
  wordBreak: "break-word",
};

const noteBoxStyle: CSSProperties = {
  marginTop: "16px",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "16px",
  backgroundColor: "#ffffff",
};

const noteTextStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#334155",
  fontSize: "15px",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const analysisHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

const analysisRightBoxStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const analysisBadgeBaseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: 800,
};

const analyzeButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: "12px",
  backgroundColor: "#0f172a",
  color: "#ffffff",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const analysisPendingBoxStyle: CSSProperties = {
  border: "1px solid #dbeafe",
  backgroundColor: "#f8fbff",
  borderRadius: "16px",
  padding: "18px",
};

const analysisPendingTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 800,
  color: "#1d4ed8",
};

const analysisPendingTextStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#334155",
  fontSize: "14px",
  lineHeight: 1.7,
};

const analysisResultBoxStyle: CSSProperties = {
  border: "1px solid #dbe4f0",
  backgroundColor: "#f8fafc",
  borderRadius: "16px",
  padding: "18px",
};

const analysisResultTitleStyle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: "15px",
  fontWeight: 800,
  color: "#0f172a",
};

const analysisPreStyle: CSSProperties = {
  margin: 0,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontSize: "13px",
  lineHeight: 1.7,
  color: "#0f172a",
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "14px",
};

const previewWrapperStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const previewImageStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  borderRadius: "16px",
  border: "1px solid #dbe4f0",
  backgroundColor: "#f8fafc",
};

const fileButtonRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const pdfBoxStyle: CSSProperties = {
  border: "1px solid #dbe4f0",
  borderRadius: "16px",
  padding: "20px",
  backgroundColor: "#f8fafc",
};

const pdfTextStyle: CSSProperties = {
  margin: "0 0 14px",
  color: "#334155",
  fontSize: "15px",
  lineHeight: 1.6,
};

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "11px 15px",
  borderRadius: "12px",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  fontWeight: 700,
  textDecoration: "none",
  border: "none",
};

const secondaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "11px 15px",
  borderRadius: "12px",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  fontWeight: 700,
  textDecoration: "none",
  border: "1px solid #cbd5e1",
};

const dangerButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "11px 15px",
  borderRadius: "12px",
  backgroundColor: "#ef4444",
  color: "#ffffff",
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
};

const emptyBoxStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px dashed #cbd5e1",
  borderRadius: "16px",
  padding: "28px",
  textAlign: "center",
  color: "#475569",
};

const errorBoxStyle: CSSProperties = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "16px",
  padding: "16px",
  color: "#b91c1c",
};
