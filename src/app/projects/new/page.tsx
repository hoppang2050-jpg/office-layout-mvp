"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export default function NewProjectPage() {
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [area, setArea] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [notes, setNotes] = useState("");
  const [floorplanFile, setFloorplanFile] = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isFormValid = useMemo(() => {
    return (
      projectName.trim() !== "" &&
      area.trim() !== "" &&
      headcount.trim() !== ""
    );
  }, [projectName, area, headcount]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isFormValid) {
      setErrorMessage("프로젝트명, 면적, 인원수는 꼭 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let floorplanFileUrl: string | null = null;

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
          throw new Error(`도면 업로드 실패: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("floorplan-files")
          .getPublicUrl(filePath);

        floorplanFileUrl = publicUrlData.publicUrl;
      }

      const insertPayload: any = {
        project_name: projectName.trim(),
        area: area.trim(),
        headcount: Number(headcount),
        notes: notes.trim() || null,
        analysis_status: "pending",
        floorplan_analysis: null,
        layout_status: "pending",
        layout_3d_json: null,
      };

      if (floorplanFileUrl) {
        insertPayload.floorplan_file_url = floorplanFileUrl;
      }

      const { data, error: insertError } = await supabase
        .from("office_projects")
        .insert([insertPayload])
        .select()
        .single();

      if (insertError) {
        throw new Error(`프로젝트 저장 실패: ${insertError.message}`);
      }

      setSuccessMessage("프로젝트가 저장되었습니다.");

      if (data?.id) {
        router.push(`/projects/${data.id}`);
        router.refresh();
        return;
      }

      router.push("/projects");
      router.refresh();
    } catch (error: any) {
      setErrorMessage(error?.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <p style={styles.eyebrow}>NEW PROJECT</p>
            <h1 style={styles.title}>새 프로젝트 만들기</h1>
            <p style={styles.description}>
              임대차 사무실 정보를 입력하고, 도면 파일이 있으면 함께 업로드하세요.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/projects")}
            style={styles.secondaryButton}
          >
            목록으로
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.formCard}>
          <div style={styles.grid}>
            <div style={styles.field}>
              <label htmlFor="projectName" style={styles.label}>
                프로젝트명 *
              </label>
              <input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="예: 강남 오피스 이전안"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label htmlFor="area" style={styles.label}>
                면적(㎡) *
              </label>
              <input
                id="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="예: 210"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label htmlFor="headcount" style={styles.label}>
                인원수 *
              </label>
              <input
                id="headcount"
                type="number"
                min="0"
                step="1"
                value={headcount}
                onChange={(e) => setHeadcount(e.target.value)}
                placeholder="예: 24"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label htmlFor="floorplanFile" style={styles.label}>
                도면 파일
              </label>
              <input
                id="floorplanFile"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFloorplanFile(e.target.files?.[0] ?? null)}
                style={styles.input}
              />
              <p style={styles.helperText}>
                PDF 또는 이미지 파일을 업로드할 수 있어요. 도면이 없어도 프로젝트 저장은 가능합니다.
              </p>
            </div>
          </div>

          <div style={styles.field}>
            <label htmlFor="notes" style={styles.label}>
              추가 요청사항
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="예: 회의실 2개, 대표실 1개, 협업공간 넓게"
              rows={6}
              style={styles.textarea}
            />
          </div>

          {errorMessage ? <div style={styles.errorBox}>{errorMessage}</div> : null}
          {successMessage ? <div style={styles.successBox}>{successMessage}</div> : null}

          <div style={styles.buttonRow}>
            <button
              type="button"
              onClick={() => router.push("/projects")}
              style={styles.cancelButton}
              disabled={isSaving}
            >
              취소
            </button>

            <button
              type="submit"
              style={{
                ...styles.primaryButton,
                opacity: isSaving ? 0.7 : 1,
                cursor: isSaving ? "not-allowed" : "pointer",
              }}
              disabled={isSaving}
            >
              {isSaving ? "저장 중..." : "프로젝트 저장"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    padding: "40px 20px",
  },
  container: {
    maxWidth: "920px",
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
  formCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
    marginBottom: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#0f172a",
  },
  input: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "15px",
    color: "#0f172a",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "15px",
    color: "#0f172a",
    backgroundColor: "#fff",
    resize: "vertical",
    boxSizing: "border-box",
  },
  helperText: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
    lineHeight: 1.5,
  },
  errorBox: {
    marginTop: "8px",
    marginBottom: "12px",
    padding: "12px 14px",
    borderRadius: "12px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    fontSize: "14px",
    fontWeight: 600,
    border: "1px solid #fecaca",
  },
  successBox: {
    marginTop: "8px",
    marginBottom: "12px",
    padding: "12px 14px",
    borderRadius: "12px",
    backgroundColor: "#ecfdf5",
    color: "#047857",
    fontSize: "14px",
    fontWeight: 600,
    border: "1px solid #a7f3d0",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "8px",
    flexWrap: "wrap",
  },
  primaryButton: {
    border: "none",
    borderRadius: "12px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: 700,
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    padding: "11px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  cancelButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
