"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";

type Project = {
  id: number;
  project_name: string;
  area: number | null;
  headcount: number | null;
  shape: string | null;
  notes: string | null;
  floorplan_file_url: string | null;
  created_at: string;
};

type SortOption = "newest" | "oldest" | "name";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("office_projects")
      .select(
        "id, project_name, area, headcount, shape, notes, floorplan_file_url, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message || "프로젝트 목록을 불러오지 못했습니다.");
      setProjects([]);
    } else {
      setProjects((data as Project[]) ?? []);
    }

    setLoading(false);
  };

  const getStoragePathFromPublicUrl = (fileUrl: string) => {
    try {
      const marker = "/storage/v1/object/public/floorplan-files/";
      const decodedUrl = decodeURIComponent(fileUrl);
      const markerIndex = decodedUrl.indexOf(marker);

      if (markerIndex === -1) {
        return null;
      }

      return decodedUrl.substring(markerIndex + marker.length);
    } catch {
      return null;
    }
  };

  const handleDelete = async (project: Project) => {
    const confirmed = window.confirm(
      "이 프로젝트를 삭제할까요? 업로드한 도면 파일도 함께 삭제됩니다."
    );
    if (!confirmed) return;

    setDeletingId(project.id);
    setErrorMessage("");

    try {
      if (project.floorplan_file_url) {
        const filePath = getStoragePathFromPublicUrl(project.floorplan_file_url);

        if (!filePath) {
          throw new Error("도면 파일 경로를 읽지 못했습니다.");
        }

        const { error: storageError } = await supabase.storage
          .from("floorplan-files")
          .remove([filePath]);

        if (storageError) {
          throw storageError;
        }
      }

      const { error: deleteError } = await supabase
        .from("office_projects")
        .delete()
        .eq("id", project.id);

      if (deleteError) {
        throw deleteError;
      }

      setProjects((prev) => prev.filter((item) => item.id !== project.id));
    } catch (error: any) {
      setErrorMessage(error?.message || "프로젝트 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProjects = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    const filtered = projects.filter((project) => {
      const name = project.project_name?.toLowerCase() ?? "";
      const shape = project.shape?.toLowerCase() ?? "";
      const notes = project.notes?.toLowerCase() ?? "";

      return (
        !keyword ||
        name.includes(keyword) ||
        shape.includes(keyword) ||
        notes.includes(keyword)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortOption === "newest") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      if (sortOption === "oldest") {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }

      return a.project_name.localeCompare(b.project_name, "ko");
    });

    return sorted;
  }, [projects, searchKeyword, sortOption]);

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div style={topBarStyle}>
          <div>
            <p style={eyebrowStyle}>PROJECTS</p>
            <h1 style={titleStyle}>프로젝트 목록</h1>
            <p style={descriptionStyle}>
              저장된 프로젝트를 확인하고 상세, 수정, 삭제를 할 수 있어요.
            </p>
          </div>

          <Link href="/projects/new" style={primaryButtonStyle}>
            + 새 프로젝트 만들기
          </Link>
        </div>

        <div style={toolbarStyle}>
          <input
            type="text"
            placeholder="프로젝트명 / 공간 형태 / 메모 검색"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={searchInputStyle}
          />

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            style={selectStyle}
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="name">이름순</option>
          </select>
        </div>

        <div style={summaryRowStyle}>
          <span style={summaryBadgeStyle}>
            총 {filteredProjects.length}개 프로젝트
          </span>
        </div>

        {loading ? (
          <div style={emptyBoxStyle}>프로젝트 목록을 불러오는 중...</div>
        ) : errorMessage ? (
          <div style={errorBoxStyle}>{errorMessage}</div>
        ) : filteredProjects.length === 0 ? (
          <div style={emptyBoxStyle}>
            저장된 프로젝트가 없어요. 새 프로젝트를 만들어 보세요.
          </div>
        ) : (
          <div style={gridStyle}>
            {filteredProjects.map((project) => (
              <article key={project.id} style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div>
                    <h2 style={cardTitleStyle}>{project.project_name}</h2>
                    <p style={cardDateStyle}>
                      생성일:{" "}
                      {new Date(project.created_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>

                  {project.floorplan_file_url ? (
                    <span style={floorplanBadgeStyle}>도면 있음</span>
                  ) : null}
                </div>

                <div style={infoListStyle}>
                  <p style={infoItemStyle}>
                    <strong>면적:</strong>{" "}
                    {project.area !== null ? `${project.area}㎡` : "-"}
                  </p>
                  <p style={infoItemStyle}>
                    <strong>인원:</strong>{" "}
                    {project.headcount !== null ? `${project.headcount}명` : "-"}
                  </p>
                  <p style={infoItemStyle}>
                    <strong>공간 형태:</strong> {project.shape || "-"}
                  </p>
                  <p style={noteStyle}>
                    <strong>추가 요청사항:</strong> {project.notes || "-"}
                  </p>
                </div>

                <div style={buttonRowStyle}>
                  <Link
                    href={`/projects/${project.id}`}
                    style={secondaryButtonStyle}
                  >
                    상세 보기
                  </Link>

                  <Link
                    href={`/projects/${project.id}/edit`}
                    style={secondaryButtonStyle}
                  >
                    수정
                  </Link>

                  <Link
                    href={`/projects/${project.id}/layout3d`}
                    style={secondaryButtonStyle}
                  >
                    3D 배치
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(project)}
                    disabled={deletingId === project.id}
                    style={dangerButtonStyle}
                  >
                    {deletingId === project.id ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
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
  maxWidth: "1200px",
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
  margin: "8px 0 8px",
  fontSize: "32px",
  fontWeight: 800,
  color: "#0f172a",
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "15px",
  lineHeight: 1.6,
};

const toolbarStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

const searchInputStyle: CSSProperties = {
  flex: "1 1 320px",
  minWidth: "260px",
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
  padding: "12px 14px",
  fontSize: "14px",
  backgroundColor: "#ffffff",
};

const selectStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
  padding: "12px 14px",
  fontSize: "14px",
  backgroundColor: "#ffffff",
  minWidth: "140px",
};

const summaryRowStyle: CSSProperties = {
  marginBottom: "20px",
};

const summaryBadgeStyle: CSSProperties = {
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: "999px",
  backgroundColor: "#dbeafe",
  color: "#1d4ed8",
  fontWeight: 700,
  fontSize: "13px",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "18px",
};

const cardStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  padding: "20px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
};

const cardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "14px",
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "20px",
  fontWeight: 800,
  color: "#0f172a",
};

const cardDateStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#64748b",
  fontSize: "13px",
};

const floorplanBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 10px",
  borderRadius: "999px",
  backgroundColor: "#dbeafe",
  color: "#1d4ed8",
  fontWeight: 700,
  fontSize: "12px",
  whiteSpace: "nowrap",
};

const infoListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  marginBottom: "18px",
};

const infoItemStyle: CSSProperties = {
  margin: 0,
  color: "#1e293b",
  fontSize: "14px",
  lineHeight: 1.6,
};

const noteStyle: CSSProperties = {
  margin: 0,
  color: "#334155",
  fontSize: "14px",
  lineHeight: 1.6,
  wordBreak: "break-word",
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 16px",
  borderRadius: "12px",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  fontWeight: 700,
  textDecoration: "none",
};

const secondaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  fontWeight: 700,
  textDecoration: "none",
};

const dangerButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: "12px",
  backgroundColor: "#ef4444",
  color: "#ffffff",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const emptyBoxStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px dashed #cbd5e1",
  borderRadius: "16px",
  padding: "32px",
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
