"use client";

import { CSSProperties, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const SPACE_TYPE_OPTIONS = [
  { value: "office", label: "사무실" },
  { value: "cafe", label: "카페" },
  { value: "restaurant", label: "식당" },
  { value: "fitness", label: "헬스장 / 피트니스" },
  { value: "retail", label: "매장 / 쇼룸" },
  { value: "other", label: "기타" },
];

const INPUT_MODE_OPTIONS = [
  { value: "floorplan", label: "정식 도면 업로드" },
  { value: "sketch", label: "손그림 스케치 업로드" },
  { value: "no_drawing", label: "도면 없이 텍스트만 입력" },
];

export default function NewProjectPage() {
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [spaceType, setSpaceType] = useState("office");
  const [spaceTypeDetail, setSpaceTypeDetail] = useState("");
  const [inputMode, setInputMode] = useState("floorplan");

  const [area, setArea] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [shape, setShape] = useState("");
  const [notes, setNotes] = useState("");
  const [floorplanFile, setFloorplanFile] = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isFileRequired = useMemo(() => {
    return inputMode === "floorplan" || inputMode === "sketch";
  }, [inputMode]);

  const isFormValid = useMemo(() => {
    if (
      projectName.trim() === "" ||
      area.trim() === "" ||
      headcount.trim() === "" ||
      spaceType.trim() === "" ||
      inputMode.trim() === ""
    ) {
      return false;
    }

    if (spaceType === "other" && spaceTypeDetail.trim() === "") {
      return false;
    }

    if (isFileRequired && !floorplanFile) {
      return false;
    }

    return true;
  }, [
    projectName,
    area,
    headcount,
    spaceType,
    spaceTypeDetail,
    inputMode,
    isFileRequired,
    floorplanFile,
  ]);

  function getFileHelperText() {
    if (inputMode === "floorplan") {
      return "PDF 또는 이미지 형식의 정식 도면 파일을 업로드해 주세요.";
    }

    if (inputMode === "sketch") {
      return "손그림 스케치를 촬영한 이미지 파일을 업로드해 주세요.";
    }

    return "도면 없이도 저장할 수 있어요. 제원과 요청사항 기반으로 AI가 배치를 생성합니다.";
  }

  function getNotesPlaceholder() {
    switch (spaceType) {
      case "office":
        return "예: 팀 3개, 회의실 2개, 대표실 1개, 탕비실 넓게, 집중존 필요";
      case "cafe":
        return "예: 바 좌석 6석, 포토존 필요, 따뜻한 우드톤, 체류형 좌석 위주";
      case "restaurant":
        return "예: 4인석 위주, 오픈키친, 대기 공간 필요, 회전율 중요";
      case "fitness":
        return "예: 머신존 넓게, PT룸 2개, 락커룸과 샤워실 포함";
      case "retail":
        return "예: 전면 쇼윈도 강조, 체험존 필요, 재고공간 포함";
      default:
        return "예: 원하는 분위기, 꼭 필요한 공간, 운영 방식 등을 자유롭게 적어주세요";
    }
  }

  function getProjectGuideText() {
    switch (spaceType) {
      case "office":
        return "사무실은 팀 구조, 회의실 수, 집중존/협업존 비율을 함께 적어주면 더 정확한 배치를 만들 수 있어요.";
      case "cafe":
        return "카페는 좌석 수, 바 카운터, 포토존, 테이크아웃 비율 같은 운영 포인트를 적어주면 좋아요.";
      case "restaurant":
        return "식당은 홀/주방/대기 공간, 테이블 비율, 서빙 동선을 적어주면 훨씬 정확해져요.";
      case "fitness":
        return "헬스장은 머신존, 프리웨이트, PT룸, 락커/샤워실 구성이 중요해요.";
      case "retail":
        return "매장/쇼룸은 진열존, 체험존, 카운터, 재고공간 우선순위를 적어주면 좋아요.";
      default:
        return "기타 업종은 운영 방식과 꼭 필요한 구역을 최대한 구체적으로 적어주세요.";
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isFormValid) {
      if (spaceType === "other" && spaceTypeDetail.trim() === "") {
        setErrorMessage("기타 업종을 선택한 경우 세부 업종을 입력해 주세요.");
        return;
      }

      if (isFileRequired && !floorplanFile) {
        setErrorMessage("선택한 입력 방식에 맞는 파일을 업로드해 주세요.");
        return;
      }

      setErrorMessage("프로젝트명, 대표업종, 입력방식, 면적, 인원수는 꼭 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let floorplanFileUrl: string | null = null;

      if (floorplanFile) {
        const safeFileName = floorplanFile.name.replace(/\s+/g, "-");
        const prefix = inputMode === "sketch" ? "sketches" : "projects";
        const filePath = `${prefix}/${Date.now()}-${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("floorplan-files")
          .upload(filePath, floorplanFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`파일 업로드 실패: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("floorplan-files")
          .getPublicUrl(filePath);

        floorplanFileUrl = publicUrlData.publicUrl;
      }

      const insertPayload: any = {
        project_name: projectName.trim(),
        space_type: spaceType,
        space_type_detail: spaceType === "other" ? spaceTypeDetail.trim() : null,
        input_mode: inputMode,
        area: area.trim(),
        headcount: Number(headcount),
        shape: shape.trim() || null,
        notes: notes.trim() || null,
        concept_status: "pending",
        design_concept_json: null,
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
            <h1 style={styles.title}>새 공간 프로젝트 만들기</h1>
            <p style={styles.description}>
              대표업종, 입력 방식, 기본 제원을 입력하고 도면 또는 손그림이 있으면 함께 업로드하세요.
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
                placeholder="예: 성수 피트니스 리뉴얼"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label htmlFor="spaceType" style={styles.label}>
                대표업종 *
              </label>
              <select
                id="spaceType"
                value={spaceType}
                onChange={(e) => setSpaceType(e.target.value)}
                style={styles.input}
              >
                {SPACE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label htmlFor="inputMode" style={styles.label}>
                입력 방식 *
              </label>
              <select
                id="inputMode"
                value={inputMode}
                onChange={(e) => {
                  setInputMode(e.target.value);
                  if (e.target.value === "no_drawing") {
                    setFloorplanFile(null);
                  }
                }}
                style={styles.input}
              >
                {INPUT_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label htmlFor="area" style={styles.label}>
                면적(평수/㎡ 자유입력) *
              </label>
              <input
                id="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="예: 45평 / 148㎡"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label htmlFor="headcount" style={styles.label}>
                인원수 / 예상 수용 인원 *
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
              <label htmlFor="shape" style={styles.label}>
                공간 형태(선택)
              </label>
              <input
                id="shape"
                value={shape}
                onChange={(e) => setShape(e.target.value)}
                placeholder="예: 직사각형, ㄱ자형, 긴 복도형"
                style={styles.input}
              />
            </div>
          </div>

          {spaceType === "other" ? (
            <div style={styles.field}>
              <label htmlFor="spaceTypeDetail" style={styles.label}>
                기타 업종 상세 입력 *
              </label>
              <input
                id="spaceTypeDetail"
                value={spaceTypeDetail}
                onChange={(e) => setSpaceTypeDetail(e.target.value)}
                placeholder="예: 병원, 학원, 미용실, 공방"
                style={styles.input}
              />
            </div>
          ) : null}

          <div style={styles.field}>
            <label htmlFor="floorplanFile" style={styles.label}>
              {inputMode === "sketch"
                ? "손그림 스케치 파일"
                : inputMode === "floorplan"
                ? "도면 파일"
                : "참고 파일(선택)"}
              {isFileRequired ? " *" : ""}
            </label>
            <input
              id="floorplanFile"
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFloorplanFile(e.target.files?.[0] ?? null)}
              style={styles.input}
            />
            <p style={styles.helperText}>{getFileHelperText()}</p>
          </div>

          <div style={styles.guideBox}>
            <div style={styles.guideTitle}>현재 선택 기준 안내</div>
            <p style={styles.guideText}>{getProjectGuideText()}</p>
          </div>

          <div style={styles.field}>
            <label htmlFor="notes" style={styles.label}>
              추가 요청사항 / 제원 입력
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={getNotesPlaceholder()}
              rows={7}
              style={styles.textarea}
            />
          </div>

          <div style={styles.tipBox}>
            <div style={styles.tipTitle}>입력 팁</div>
            <ul style={styles.tipList}>
              <li>사무실: 팀 수, 회의실, 탕비실, 대표실, 집중존</li>
              <li>카페: 좌석 수, 바석, 포토존, 테이크아웃 비율</li>
              <li>식당: 홀/주방/대기, 테이블 비율, 서빙 동선</li>
              <li>헬스장: 머신존, PT룸, 락커, 샤워실</li>
              <li>매장/쇼룸: 진열존, 체험존, 카운터, 재고공간</li>
            </ul>
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
    marginBottom: "8px",
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
    lineHeight: 1.6,
  },
  guideBox: {
    marginBottom: "16px",
    border: "1px solid #dbeafe",
    borderRadius: "16px",
    padding: "16px",
    backgroundColor: "#eff6ff",
  },
  guideTitle: {
    fontSize: "14px",
    fontWeight: 800,
    color: "#1d4ed8",
    marginBottom: "8px",
  },
  guideText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.7,
    color: "#334155",
  },
  tipBox: {
    marginTop: "4px",
    marginBottom: "16px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
    backgroundColor: "#f8fafc",
  },
  tipTitle: {
    fontSize: "14px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "10px",
  },
  tipList: {
    margin: 0,
    paddingLeft: "18px",
    color: "#334155",
    fontSize: "13px",
    lineHeight: 1.7,
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
