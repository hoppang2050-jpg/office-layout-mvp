"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useState,
  type CSSProperties,
} from "react";
import { supabase } from "@/lib/supabase";

export default function NewProjectPage() {
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [area, setArea] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [shape, setShape] = useState("");
  const [notes, setNotes] = useState("");
  const [floorplanFile, setFloorplanFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFloorplanFile(file);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    if (!projectName.trim()) {
      setErrorMessage("프로젝트 이름을 입력해주세요.");
      return;
    }

    setSaving(true);

    try {
      let floorplanFileUrl: string | null = null;
      let floorplanFileName: string | null = null;

      if (floorplanFile) {
        const safeFileName = floorplanFile.name.replace(/\s+/g, "-");
        const filePath = `projects/${Date.now()}-${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("floorplan-files")
          .upload(filePath, floorplanFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("floorplan-files")
          .getPublicUrl(filePath);

        floorplanFileUrl = publicUrlData.publicUrl;
        floorplanFileName = floorplanFile.name;
      }

      const { error } = await supabase.from("office_projects").insert([
        {
          project_name: projectName,
          area: area ? Number(area) : null,
          headcount: headcount ? Number(headcount) : null,
          shape: shape,
          notes: notes,
          floorplan_file_url: floorplanFileUrl,
          floorplan_file_name: floorplanFileName,
        },
      ]);

      if (error) {
        throw error;
      }

      alert("프로젝트와 도면 파일 정보가 저장되었습니다.");
      router.push("/projects");
      router.refresh();
    } catch (error: any) {
      setErrorMessage(
        error?.message || "프로젝트 저장 중 오류가 발생했습니다."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fbff 0%, #eef4ff 50%, #f8fafc 100%)",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#6366f1",
                fontWeight: 700,
              }}
            >
              New Office Project
            </p>
            <h1
              style={{
                margin: "8px 0 0",
                fontSize: "32px",
                fontWeight: 800,
                color: "#111827",
              }}
            >
              새 프로젝트 등록
            </h1>
            <p
              style={{
                margin: "10px 0 0",
                color: "#6b7280",
                fontSize: "15px",
              }}
            >
              프로젝트 정보와 도면 파일을 함께 저장할 수 있어요.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href="/"
              style={{
                textDecoration: "none",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid #d1d5db",
                background: "#fff",
                color: "#111827",
                fontWeight: 600,
              }}
            >
              홈으로
            </Link>

            <Link
              href="/projects"
              style={{
                textDecoration: "none",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "#111827",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              프로젝트 목록 보기
            </Link>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: "20px",
          }}
        >
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
            }}
          >
            <h2
              style={{
                margin: "0 0 20px",
                fontSize: "22px",
                fontWeight: 800,
                color: "#111827",
              }}
            >
              프로젝트 정보 입력
            </h2>

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div style={{ gridColumn: "1 / -1" }}>
                  <label htmlFor="projectName" style={labelStyle}>
                    프로젝트명
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="예: 티피에스 본사"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="area" style={labelStyle}>
                    면적
                  </label>
                  <input
                    id="area"
                    type="number"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="예: 120"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="headcount" style={labelStyle}>
                    인원수
                  </label>
                  <input
                    id="headcount"
                    type="number"
                    value={headcount}
                    onChange={(e) => setHeadcount(e.target.value)}
                    placeholder="예: 24"
                    style={inputStyle}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label htmlFor="shape" style={labelStyle}>
                    공간 형태
                  </label>
                  <input
                    id="shape"
                    type="text"
                    value={shape}
                    onChange={(e) => setShape(e.target.value)}
                    placeholder="예: 직사각형 / L자형 / 기둥 있음"
                    style={inputStyle}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label htmlFor="notes" style={labelStyle}>
                    추가 요청사항
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="예: 대표실 1개, 회의실 2개, 라운지 필요"
                    rows={5}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      minHeight: "130px",
                    }}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label htmlFor="floorplanFile" style={labelStyle}>
                    도면 파일 업로드
                  </label>

                  <input
                    id="floorplanFile"
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={handleFileChange}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "12px",
                      backgroundColor: "#ffffff",
                    }}
                  />

                  <p
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginTop: "8px",
                      marginBottom: 0,
                    }}
                  >
                    PNG, JPG, JPEG, PDF 파일을 업로드할 수 있어요.
                  </p>

                  {floorplanFile && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#f8fafc",
                        border: "1px solid #e5e7eb",
                        fontSize: "14px",
                        color: "#111827",
                      }}
                    >
                      선택한 파일: <strong>{floorplanFile.name}</strong>
                    </div>
                  )}
                </div>
              </div>

              {errorMessage && (
                <div
                  style={{
                    marginTop: "18px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "24px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    border: "none",
                    borderRadius: "14px",
                    padding: "14px 20px",
                    background: saving
                      ? "#93c5fd"
                      : "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "15px",
                    cursor: saving ? "not-allowed" : "pointer",
                    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
                  }}
                >
                  {saving ? "저장 중..." : "프로젝트 저장하기"}
                </button>

                <Link
                  href="/projects"
                  style={{
                    textDecoration: "none",
                    borderRadius: "14px",
                    padding: "14px 20px",
                    background: "#fff",
                    color: "#111827",
                    border: "1px solid #d1d5db",
                    fontWeight: 700,
                  }}
                >
                  목록으로 돌아가기
                </Link>
              </div>
            </form>
          </section>

          <aside
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <section
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
              }}
            >
              <h2
                style={{
                  margin: "0 0 16px",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                실시간 미리보기
              </h2>

              <div style={previewBoxStyle}>
                <small style={previewLabelStyle}>프로젝트명</small>
                <div style={previewValueStyle}>
                  {projectName || "아직 입력 전"}
                </div>
              </div>

              <div style={previewBoxStyle}>
                <small style={previewLabelStyle}>면적 / 인원수</small>
                <div style={previewValueStyle}>
                  {area || "-"}㎡ / {headcount || "-"}명
                </div>
              </div>

              <div style={previewBoxStyle}>
                <small style={previewLabelStyle}>공간 형태</small>
                <div style={previewValueStyle}>
                  {shape || "아직 입력 전"}
                </div>
              </div>

              <div style={previewBoxStyle}>
                <small style={previewLabelStyle}>추가 요청사항</small>
                <div style={previewValueStyle}>
                  {notes || "아직 입력 전"}
                </div>
              </div>

              <div style={previewBoxStyle}>
                <small style={previewLabelStyle}>도면 파일</small>
                <div style={previewValueStyle}>
                  {floorplanFile ? floorplanFile.name : "아직 선택 전"}
                </div>
              </div>
            </section>

            <section
              style={{
                background:
                  "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
                border: "1px solid #dbeafe",
                borderRadius: "20px",
                padding: "22px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                지금 단계에서 되는 것
              </h3>
              <p
                style={{
                  margin: 0,
                  color: "#4b5563",
                  lineHeight: 1.7,
                  fontSize: "14px",
                }}
              >
                이제 프로젝트를 저장하면 선택한 도면 파일도 함께
                <strong> floorplan-files </strong>
                버킷에 업로드되고,
                <strong> office_projects </strong>
                테이블의
                <strong> floorplan_file_url / floorplan_file_name </strong>
                컬럼에 같이 저장돼요.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 700,
  marginBottom: "8px",
  color: "#111827",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
  background: "#ffffff",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};

const previewBoxStyle: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "16px",
  marginBottom: "12px",
};

const previewLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: 700,
};

const previewValueStyle: CSSProperties = {
  color: "#111827",
  fontSize: "15px",
  fontWeight: 700,
  lineHeight: 1.6,
};
