"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState, type CSSProperties } from "react";
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
          shape,
          notes,
          floorplan_file_url: floorplanFileUrl,
          floorplan_file_name: floorplanFileName,
          analysis_status: "pending",
          floorplan_analysis: null,
        },
      ]);

      if (error) {
        throw error;
      }

      alert("프로젝트가 저장되었습니다.");
      router.push("/projects");
      router.refresh();
    } catch (error: any) {
      setErrorMessage(error?.message || "프로젝트 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>NEW PROJECT</p>
            <h1 style={titleStyle}>새 프로젝트 만들기</h1>
            <p style={descriptionStyle}>
              사무실 기본 정보와 도면 파일을 함께 저장할 수 있어요.
            </p>
          </div>

          <Link href="/projects" style={secondaryButtonStyle}>
            목록으로 돌아가기
          </Link>
        </div>

        <form onSubmit={handleSubmit} style={formCardStyle}>
          <div style={fieldGridStyle}>
            <div style={fieldStyle}>
              <label htmlFor="projectName" style={labelStyle}>
                프로젝트 이름
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

            <div style={fieldStyle}>
              <label htmlFor="area" style={labelStyle}>
                면적(㎡)
              </label>
              <input
                id="area"
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="예: 100"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="headcount" style={labelStyle}>
                인원
              </label>
              <input
                id="headcount"
                type="number"
                value={headcount}
                onChange={(e) => setHeadcount(e.target.value)}
                placeholder="예: 12"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="shape" style={labelStyle}>
                공간 형태
              </label>
              <input
                id="shape"
                type="text"
                value={shape}
                onChange={(e) => setShape(e.target.value)}
                placeholder="예: 직사각형"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={fieldStyle}>
            <label htmlFor="notes" style={labelStyle}>
              추가 요청사항
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="예: 대표실, 회의실, 휴게실이 필요해요."
              style={textareaStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="floorplanFile" style={labelStyle}>
              도면 파일 업로드
            </label>
            <input
              id="floorplanFile"
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={handleFileChange}
              style={fileInputStyle}
            />
            <p style={helperTextStyle}>
              PNG, JPG, JPEG, PDF 파일을 업로드할 수 있어요.
            </p>

            {floorplanFile ? (
              <div style={filePreviewStyle}>
                선택한 파일: <strong>{floorplanFile.name}</strong>
              </div>
            ) : null}
          </div>

          <div style={analysisNoticeStyle}>
            <p style={analysisTitleStyle}>AI 분석 상태</p>
            <p style={analysisTextStyle}>
              저장 시 분석 상태가 <strong>pending</strong> 으로 함께 기록돼요.
              다음 단계에서 업로드한 도면을 AI가 읽고, 구조화된 분석 결과를
              저장하게 만들 예정이에요.
            </p>
          </div>

          {errorMessage ? <div style={errorBoxStyle}>{errorMessage}</div> : null}

          <div style={buttonRowStyle}>
            <button type="submit" disabled={saving} style={primaryButtonStyle}>
              {saving ? "저장 중..." : "저장하기"}
            </button>

            <Link href="/projects" style={secondaryButtonStyle}>
              취소
            </Link>
          </div>
        </form>
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
  maxWidth: "960px",
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
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

const formCardStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
  display: "grid",
  gap: "20px",
};

const fieldGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
};

const labelStyle: CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#0f172a",
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
  padding: "12px 14px",
  fontSize: "14px",
  backgroundColor: "#ffffff",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "120px",
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
  padding: "12px 14px",
  fontSize: "14px",
  backgroundColor: "#ffffff",
  resize: "vertical",
};

const fileInputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
  padding: "12px 14px",
  fontSize: "14px",
  backgroundColor: "#ffffff",
};

const helperTextStyle: CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#64748b",
};

const filePreviewStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: "12px",
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  color: "#1e3a8a",
  fontSize: "14px",
};

const analysisNoticeStyle: CSSProperties = {
  border: "1px solid #dbeafe",
  backgroundColor: "#f8fbff",
  borderRadius: "16px",
  padding: "16px",
};

const analysisTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "14px",
  fontWeight: 800,
  color: "#1d4ed8",
};

const analysisTextStyle: CSSProperties = {
  margin: "8px 0 0",
  fontSize: "14px",
  lineHeight: 1.7,
  color: "#334155",
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const primaryButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: "12px",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  padding: "12px 16px",
  fontWeight: 700,
  textDecoration: "none",
};

const errorBoxStyle: CSSProperties = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "16px",
  padding: "14px 16px",
  color: "#b91c1c",
};
