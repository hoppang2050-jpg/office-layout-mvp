"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";

type Project = {
  id: number;
  project_name: string;
  floorplan_file_url: string | null;
  created_at: string;
};

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("office_projects")
      .select("id, project_name, floorplan_file_url, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message || "프로젝트를 불러오지 못했습니다.");
      setProjects([]);
    } else {
      setProjects((data as Project[]) ?? []);
    }

    setLoading(false);
  };

  const recentProjects = useMemo(() => {
    return projects.slice(0, 3);
  }, [projects]);

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={heroStyle}>
          <p style={heroEyebrowStyle}>Office Project Manager</p>
          <h1 style={heroTitleStyle}>사무실 프로젝트 관리 대시보드</h1>
          <p style={heroDescriptionStyle}>
            프로젝트를 등록하고, 목록으로 확인하고, 상세/수정/삭제와 3D 배치
            시안까지 한 번에 관리할 수 있는 홈 화면입니다.
          </p>

          <div style={heroButtonRowStyle}>
            <Link href="/projects/new" style={primaryButtonStyle}>
              새 프로젝트 만들기
            </Link>
            <Link href="/projects" style={secondaryHeroButtonStyle}>
              프로젝트 목록 보기
            </Link>
          </div>
        </section>

        <section style={summaryGridStyle}>
          <article style={summaryCardStyle}>
            <p style={summaryLabelStyle}>전체 프로젝트 수</p>
            <h2 style={summaryValueStyle}>{projects.length}개</h2>
            <p style={summaryTextStyle}>지금까지 저장된 전체 프로젝트 개수</p>
          </article>

          <article style={summaryCardStyle}>
            <p style={summaryLabelStyle}>빠른 시작</p>
            <h2 style={summaryTitleStyle}>새 프로젝트 등록</h2>
            <p style={summaryTextStyle}>
              새 사무실 프로젝트를 입력하고 바로 저장할 수 있어요.
            </p>
            <div style={{ marginTop: "18px" }}>
              <Link href="/projects/new" style={primaryButtonSmallStyle}>
                등록하러 가기
              </Link>
            </div>
          </article>

          <article style={summaryCardStyle}>
            <p style={summaryLabelStyle}>빠른 보기</p>
            <h2 style={summaryTitleStyle}>전체 목록 확인</h2>
            <p style={summaryTextStyle}>
              저장된 프로젝트를 검색, 정렬, 수정, 삭제, 3D 시안 관리까지 할 수
              있어요.
            </p>
            <div style={{ marginTop: "18px" }}>
              <Link href="/projects" style={outlineButtonSmallStyle}>
                목록 보러 가기
              </Link>
            </div>
          </article>
        </section>

        <section style={recentSectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <p style={sectionEyebrowStyle}>최근 등록</p>
              <h2 style={sectionTitleStyle}>최근 프로젝트 3개</h2>
            </div>

            <Link href="/projects" style={outlineButtonSmallStyle}>
              전체 목록 보기
            </Link>
          </div>

          {loading ? (
            <div style={emptyBoxStyle}>프로젝트를 불러오는 중...</div>
          ) : errorMessage ? (
            <div style={errorBoxStyle}>{errorMessage}</div>
          ) : recentProjects.length === 0 ? (
            <div style={emptyBoxStyle}>
              아직 등록된 프로젝트가 없어요. 새 프로젝트를 먼저 만들어 보세요.
            </div>
          ) : (
            <div style={recentGridStyle}>
              {recentProjects.map((project) => (
                <article key={project.id} style={projectCardStyle}>
                  <div style={projectImagePlaceholderStyle}>
                    <div style={projectTopBadgeRowStyle}>
                      <span style={projectIdBadgeStyle}>
                        프로젝트 #{project.id}
                      </span>

                      {project.floorplan_file_url ? (
                        <span style={floorplanBadgeStyle}>도면 있음</span>
                      ) : (
                        <span style={floorplanEmptyBadgeStyle}>도면 없음</span>
                      )}
                    </div>

                    <div style={placeholderTextStyle}>
                      최근 프로젝트 미리보기
                    </div>
                  </div>

                  <div style={projectCardBodyStyle}>
                    <h3 style={projectTitleStyle}>{project.project_name}</h3>
                    <p style={projectDateStyle}>
                      생성일:{" "}
                      {new Date(project.created_at).toLocaleDateString("ko-KR")}
                    </p>

                    <div style={projectButtonRowStyle}>
                      <Link
                        href={`/projects/${project.id}`}
                        style={outlineButtonSmallStyle}
                      >
                        상세 보기
                      </Link>
                      <Link
                        href={`/projects/${project.id}/layout3d`}
                        style={primaryButtonSmallStyle}
                      >
                        3D 배치 보기
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
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
  padding: "28px 20px 60px",
};

const containerStyle: CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
};

const heroStyle: CSSProperties = {
  background: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)",
  borderRadius: "28px",
  padding: "34px 28px",
  color: "#ffffff",
  boxShadow: "0 20px 50px rgba(37, 99, 235, 0.22)",
};

const heroEyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: "15px",
  opacity: 0.9,
};

const heroTitleStyle: CSSProperties = {
  margin: "12px 0",
  fontSize: "48px",
  lineHeight: 1.15,
  fontWeight: 800,
  letterSpacing: "-0.02em",
};

const heroDescriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: "760px",
  fontSize: "16px",
  lineHeight: 1.7,
  opacity: 0.96,
};

const heroButtonRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  marginTop: "24px",
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "18px",
  marginTop: "28px",
};

const summaryCardStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "22px",
  padding: "24px",
  border: "1px solid #dbe4f0",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

const summaryLabelStyle: CSSProperties = {
  margin: 0,
  fontSize: "14px",
  color: "#64748b",
  fontWeight: 600,
};

const summaryValueStyle: CSSProperties = {
  margin: "12px 0 10px",
  fontSize: "42px",
  lineHeight: 1,
  color: "#0f172a",
  fontWeight: 800,
};

const summaryTitleStyle: CSSProperties = {
  margin: "12px 0 10px",
  fontSize: "32px",
  lineHeight: 1.15,
  color: "#0f172a",
  fontWeight: 800,
};

const summaryTextStyle: CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "15px",
  lineHeight: 1.7,
};

const recentSectionStyle: CSSProperties = {
  marginTop: "28px",
  backgroundColor: "#ffffff",
  borderRadius: "22px",
  padding: "24px",
  border: "1px solid #dbe4f0",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const sectionEyebrowStyle: CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
  fontWeight: 600,
};

const sectionTitleStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: 800,
};

const recentGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "18px",
};

const projectCardStyle: CSSProperties = {
  borderRadius: "20px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  backgroundColor: "#ffffff",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
};

const projectImagePlaceholderStyle: CSSProperties = {
  minHeight: "220px",
  background:
    "linear-gradient(180deg, #f1f5f9 0%, #eef2f7 100%)",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const projectTopBadgeRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const projectIdBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: "999px",
  backgroundColor: "#ffffff",
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 700,
  border: "1px solid #dbe4f0",
};

const floorplanBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: "999px",
  backgroundColor: "#dbeafe",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: 700,
};

const floorplanEmptyBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: "999px",
  backgroundColor: "#e2e8f0",
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 700,
};

const placeholderTextStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "120px",
  color: "#94a3b8",
  fontWeight: 700,
  fontSize: "16px",
};

const projectCardBodyStyle: CSSProperties = {
  padding: "18px",
};

const projectTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 800,
  color: "#0f172a",
};

const projectDateStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#64748b",
  fontSize: "14px",
};

const projectButtonRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "18px",
};

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 18px",
  borderRadius: "12px",
  backgroundColor: "#ffffff",
  color: "#2563eb",
  textDecoration: "none",
  fontWeight: 800,
  border: "1px solid rgba(255,255,255,0.75)",
};

const secondaryHeroButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 18px",
  borderRadius: "12px",
  backgroundColor: "transparent",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 800,
  border: "1px solid rgba(255,255,255,0.5)",
};

const primaryButtonSmallStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: "12px",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 700,
};

const outlineButtonSmallStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: "12px",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  textDecoration: "none",
  fontWeight: 700,
  border: "1px solid #cbd5e1",
};

const emptyBoxStyle: CSSProperties = {
  border: "1px dashed #cbd5e1",
  borderRadius: "16px",
  padding: "28px",
  textAlign: "center",
  color: "#64748b",
  backgroundColor: "#f8fafc",
};

const errorBoxStyle: CSSProperties = {
  border: "1px solid #fecaca",
  borderRadius: "16px",
  padding: "16px",
  color: "#b91c1c",
  backgroundColor: "#fef2f2",
};
