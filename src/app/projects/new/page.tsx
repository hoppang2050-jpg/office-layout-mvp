"use client";

import type { ReactNode, ChangeEvent, CSSProperties, DragEvent, FormEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type SpaceType =
  | "office"
  | "cafe"
  | "restaurant"
  | "fitness"
  | "retail"
  | "other";

type InputMode = "floorplan" | "sketch" | "no_drawing";

function sanitizeFileName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

function formatBytes(bytes: number) {
  if (!bytes && bytes !== 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toNumberOrNull(value: string) {
  if (!value?.trim()) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function getSpaceTypeLabel(spaceType: SpaceType) {
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
    default:
      return "기타";
  }
}

function getInputModeLabel(inputMode: InputMode) {
  switch (inputMode) {
    case "floorplan":
      return "정식 도면 있음";
    case "sketch":
      return "손그림 / 스케치 / 사진";
    case "no_drawing":
    default:
      return "파일 없이 시작";
  }
}

export default function NewProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [projectName, setProjectName] = useState("");
  const [spaceType, setSpaceType] = useState<SpaceType>("office");
  const [spaceTypeDetail, setSpaceTypeDetail] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("floorplan");
  const [area, setArea] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [shape, setShape] = useState("");
  const [brandMood, setBrandMood] = useState("");
  const [notes, setNotes] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [officeMeetingRoomCount, setOfficeMeetingRoomCount] = useState("2");
  const [officeFocusRoomCount, setOfficeFocusRoomCount] = useState("1");
  const [officePantryNeeded, setOfficePantryNeeded] = useState(true);
  const [officeReceptionNeeded, setOfficeReceptionNeeded] = useState(true);

  const [cafeSeatCount, setCafeSeatCount] = useState("24");
  const [cafeTakeoutRatio, setCafeTakeoutRatio] = useState("40");
  const [cafePhotoSpotNeeded, setCafePhotoSpotNeeded] = useState(true);
  const [cafeBarNeeded, setCafeBarNeeded] = useState(true);

  const [restaurantSeatCount, setRestaurantSeatCount] = useState("40");
  const [restaurantKitchenNeeded, setRestaurantKitchenNeeded] = useState(true);
  const [restaurantPrivateDiningNeeded, setRestaurantPrivateDiningNeeded] =
    useState(false);
  const [restaurantWaitingNeeded, setRestaurantWaitingNeeded] = useState(true);

  const [fitnessPtRoomCount, setFitnessPtRoomCount] = useState("1");
  const [fitnessLockerNeeded, setFitnessLockerNeeded] = useState(true);
  const [fitnessCardioNeeded, setFitnessCardioNeeded] = useState(true);
  const [fitnessStretchNeeded, setFitnessStretchNeeded] = useState(true);

  const [retailDisplayCount, setRetailDisplayCount] = useState("4");
  const [retailExperienceZoneNeeded, setRetailExperienceZoneNeeded] =
    useState(true);
  const [retailStorageNeeded, setRetailStorageNeeded] = useState(true);
  const [retailCheckoutNeeded, setRetailCheckoutNeeded] = useState(true);

  const [otherMainNeed, setOtherMainNeed] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [progressMessage, setProgressMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requiresFile = inputMode !== "no_drawing";

  const selectedFileSummary = useMemo(() => {
    if (!selectedFile) return "";
    return `${selectedFile.name} · ${formatBytes(selectedFile.size)}`;
  }, [selectedFile]);

  function validateFile(file: File) {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];

    const lowerName = file.name.toLowerCase();
    const validExtension =
      lowerName.endsWith(".pdf") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".webp");

    if (!allowedTypes.includes(file.type) && !validExtension) {
      return "PDF, JPG, JPEG, PNG, WEBP 파일만 업로드할 수 있어요.";
    }

    if (file.size > 20 * 1024 * 1024) {
      return "파일 용량은 20MB 이하만 업로드할 수 있어요.";
    }

    return "";
  }

  function handleFilePicked(file: File | null) {
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage("");
    setSelectedFile(file);
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    handleFilePicked(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    handleFilePicked(file);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function buildRequirementsJson(fileUrl?: string | null, fileName?: string | null) {
    const common = {
      brand_mood: brandMood.trim() || null,
      area_input: area.trim() || null,
      headcount_input: toNumberOrNull(headcount),
      shape_input: shape.trim() || null,
      input_mode_label: getInputModeLabel(inputMode),
      space_type_label: getSpaceTypeLabel(spaceType),
      file_uploaded: Boolean(fileUrl),
      uploaded_file_url: fileUrl ?? null,
      uploaded_original_file_name: fileName ?? null,
    };

    switch (spaceType) {
      case "office":
        return {
          common,
          office: {
            meeting_room_count: toNumberOrNull(officeMeetingRoomCount) ?? 0,
            focus_room_count: toNumberOrNull(officeFocusRoomCount) ?? 0,
            pantry_needed: officePantryNeeded,
            reception_needed: officeReceptionNeeded,
          },
        };

      case "cafe":
        return {
          common,
          cafe: {
            seat_count: toNumberOrNull(cafeSeatCount) ?? 0,
            takeout_ratio_percent: toNumberOrNull(cafeTakeoutRatio) ?? 0,
            photo_spot_needed: cafePhotoSpotNeeded,
            bar_needed: cafeBarNeeded,
          },
        };

      case "restaurant":
        return {
          common,
          restaurant: {
            seat_count: toNumberOrNull(restaurantSeatCount) ?? 0,
            kitchen_needed: restaurantKitchenNeeded,
            private_dining_needed: restaurantPrivateDiningNeeded,
            waiting_zone_needed: restaurantWaitingNeeded,
          },
        };

      case "fitness":
        return {
          common,
          fitness: {
            pt_room_count: toNumberOrNull(fitnessPtRoomCount) ?? 0,
            locker_needed: fitnessLockerNeeded,
            cardio_zone_needed: fitnessCardioNeeded,
            stretching_zone_needed: fitnessStretchNeeded,
          },
        };

      case "retail":
        return {
          common,
          retail: {
            display_count: toNumberOrNull(retailDisplayCount) ?? 0,
            experience_zone_needed: retailExperienceZoneNeeded,
            storage_needed: retailStorageNeeded,
            checkout_needed: retailCheckoutNeeded,
          },
        };

      case "other":
      default:
        return {
          common,
          other: {
            main_need: otherMainNeed.trim() || null,
            detail_label: spaceTypeDetail.trim() || null,
          },
        };
    }
  }

  async function uploadFileToStorage(file: File) {
    const safeName = sanitizeFileName(file.name);
    const filePath = `${Date.now()}-${safeName}`;

    const { data, error } = await supabase.storage
      .from("floorplan-files")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error || !data?.path) {
      throw new Error(error?.message || "파일 업로드에 실패했습니다.");
    }

    const { data: publicUrlData } = supabase.storage
      .from("floorplan-files")
      .getPublicUrl(data.path);

    if (!publicUrlData?.publicUrl) {
      throw new Error("업로드는 되었지만 공개 URL 생성에 실패했습니다.");
    }

    return {
      fileUrl: publicUrlData.publicUrl,
      storedPath: data.path,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setProgressMessage("");

    if (!projectName.trim()) {
      setErrorMessage("프로젝트 이름을 입력해 주세요.");
      return;
    }

    if (!spaceType) {
      setErrorMessage("업종을 선택해 주세요.");
      return;
    }

    if (spaceType === "other" && !spaceTypeDetail.trim()) {
      setErrorMessage("기타 업종 상세 내용을 입력해 주세요.");
      return;
    }

    if (requiresFile && !selectedFile) {
      setErrorMessage("도면, 손그림, 스케치 또는 사진 파일을 선택해 주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      let fileUrl: string | null = null;
      let originalFileName: string | null = null;

      if (selectedFile) {
        originalFileName = selectedFile.name;
        setProgressMessage("1/3 파일 업로드 중...");
        const uploadResult = await uploadFileToStorage(selectedFile);
        fileUrl = uploadResult.fileUrl;
      }

      setProgressMessage("2/3 프로젝트 정보 정리 중...");
      const requirementsJson = buildRequirementsJson(fileUrl, originalFileName);

      setProgressMessage("3/3 프로젝트 저장 중...");
      const payload = {
        project_name: projectName.trim(),
        area: area.trim() || null,
        headcount: toNumberOrNull(headcount),
        shape: shape.trim() || null,
        notes: notes.trim() || null,
        space_type: spaceType,
        space_type_detail:
          spaceType === "other" ? spaceTypeDetail.trim() || null : null,
        input_mode: inputMode,
        file_url: fileUrl,
        file_name: originalFileName,
        analysis_status: "pending",
        concept_status: "pending",
        layout_status: "pending",
        requirements_json: requirementsJson,
      };

      const { data, error } = await supabase
        .from("office_projects")
        .insert(payload)
        .select("id")
        .single();

      if (error || !data?.id) {
        throw new Error(error?.message || "프로젝트 저장에 실패했습니다.");
      }

      setProgressMessage("저장 완료! 상세 페이지로 이동합니다...");
      router.push(`/projects/${data.id}`);
    } catch (error: any) {
      setErrorMessage(
        error?.message || "프로젝트 생성 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderSpaceSpecificFields() {
    switch (spaceType) {
      case "office":
        return (
          <div style={styles.grid2}>
            <FieldBlock label="회의실 수">
              <input
                style={styles.input}
                type="number"
                min={0}
                value={officeMeetingRoomCount}
                onChange={(e) => setOfficeMeetingRoomCount(e.target.value)}
              />
            </FieldBlock>

            <FieldBlock label="집중실 수">
              <input
                style={styles.input}
                type="number"
                min={0}
                value={officeFocusRoomCount}
                onChange={(e) => setOfficeFocusRoomCount(e.target.value)}
              />
            </FieldBlock>

            <ToggleRow
              label="탕비존 필요"
              checked={officePantryNeeded}
              onChange={setOfficePantryNeeded}
            />

            <ToggleRow
              label="리셉션 필요"
              checked={officeReceptionNeeded}
              onChange={setOfficeReceptionNeeded}
            />
          </div>
        );

      case "cafe":
        return (
          <div style={styles.grid2}>
            <FieldBlock label="예상 좌석 수">
              <input
                style={styles.input}
                type="number"
                min={0}
                value={cafeSeatCount}
                onChange={(e) => setCafeSeatCount(e.target.value)}
              />
            </FieldBlock>

            <FieldBlock label="테이크아웃 비율(%)">
              <input
                style={styles.input}
                type="number"
                min={0}
                max={100}
                value={cafeTakeoutRatio}
                onChange={(e) => setCafeTakeoutRatio(e.target.value)}
              />
            </FieldBlock>

            <ToggleRow
              label="포토스팟 필요"
              checked={cafePhotoSpotNeeded}
              onChange={setCafePhotoSpotNeeded}
            />

            <ToggleRow
              label="바(Bar) / 카운터 필요"
              checked={cafeBarNeeded}
              onChange={setCafeBarNeeded}
            />
          </div>
        );

      case "restaurant":
        return (
          <div style={styles.grid2}>
            <FieldBlock label="예상 좌석 수">
              <input
                style={styles.input}
                type="number"
                min={0}
                value={restaurantSeatCount}
                onChange={(e) => setRestaurantSeatCount(e.target.value)}
              />
            </FieldBlock>

            <div />

            <ToggleRow
              label="주방 필요"
              checked={restaurantKitchenNeeded}
              onChange={setRestaurantKitchenNeeded}
            />

            <ToggleRow
              label="대기 공간 필요"
              checked={restaurantWaitingNeeded}
              onChange={setRestaurantWaitingNeeded}
            />

            <ToggleRow
              label="프라이빗 룸 필요"
              checked={restaurantPrivateDiningNeeded}
              onChange={setRestaurantPrivateDiningNeeded}
            />
          </div>
        );

      case "fitness":
        return (
          <div style={styles.grid2}>
            <FieldBlock label="PT 룸 수">
              <input
                style={styles.input}
                type="number"
                min={0}
                value={fitnessPtRoomCount}
                onChange={(e) => setFitnessPtRoomCount(e.target.value)}
              />
            </FieldBlock>

            <div />

            <ToggleRow
              label="락커존 필요"
              checked={fitnessLockerNeeded}
              onChange={setFitnessLockerNeeded}
            />

            <ToggleRow
              label="유산소 존 필요"
              checked={fitnessCardioNeeded}
              onChange={setFitnessCardioNeeded}
            />

            <ToggleRow
              label="스트레칭 존 필요"
              checked={fitnessStretchNeeded}
              onChange={setFitnessStretchNeeded}
            />
          </div>
        );

      case "retail":
        return (
          <div style={styles.grid2}>
            <FieldBlock label="메인 진열 구역 수">
              <input
                style={styles.input}
                type="number"
                min={0}
                value={retailDisplayCount}
                onChange={(e) => setRetailDisplayCount(e.target.value)}
              />
            </FieldBlock>

            <div />

            <ToggleRow
              label="체험존 필요"
              checked={retailExperienceZoneNeeded}
              onChange={setRetailExperienceZoneNeeded}
            />

            <ToggleRow
              label="창고 / 보관존 필요"
              checked={retailStorageNeeded}
              onChange={setRetailStorageNeeded}
            />

            <ToggleRow
              label="계산대 필요"
              checked={retailCheckoutNeeded}
              onChange={setRetailCheckoutNeeded}
            />
          </div>
        );

      case "other":
      default:
        return (
          <div style={styles.grid1}>
            <FieldBlock label="이 공간에서 가장 중요한 요구사항">
              <textarea
                style={styles.textarea}
                placeholder="예: 상담 공간 2개, 대기 공간 필요, 프라이버시 강조 등"
                value={otherMainNeed}
                onChange={(e) => setOtherMainNeed(e.target.value)}
              />
            </FieldBlock>
          </div>
        );
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerCard}>
          <div style={styles.badge}>새 프로젝트 만들기</div>
          <h1 style={styles.title}>공간 프로젝트 생성</h1>
          <p style={styles.subtitle}>
            업종과 기본 조건, 도면 또는 손그림 파일을 등록하면
            <br />
            이후 AI 분석 → 디자인 컨셉 → 3D 배치 생성 흐름으로 이어집니다.
          </p>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>기본 정보</h2>

            <div style={styles.grid2}>
              <FieldBlock label="프로젝트 이름 *">
                <input
                  style={styles.input}
                  type="text"
                  placeholder="예: 성수동 브랜드 카페 리뉴얼"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </FieldBlock>

              <FieldBlock label="업종 *">
                <select
                  style={styles.select}
                  value={spaceType}
                  onChange={(e) => setSpaceType(e.target.value as SpaceType)}
                >
                  <option value="office">사무실</option>
                  <option value="cafe">카페</option>
                  <option value="restaurant">식당</option>
                  <option value="fitness">헬스장 / 피트니스</option>
                  <option value="retail">매장 / 쇼룸</option>
                  <option value="other">기타</option>
                </select>
              </FieldBlock>
            </div>

            {spaceType === "other" && (
              <div style={styles.grid1}>
                <FieldBlock label="기타 업종 상세 *">
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="예: 피부관리샵, 스튜디오, 상담센터"
                    value={spaceTypeDetail}
                    onChange={(e) => setSpaceTypeDetail(e.target.value)}
                  />
                </FieldBlock>
              </div>
            )}

            <div style={styles.grid3}>
              <FieldBlock label="면적">
                <input
                  style={styles.input}
                  type="text"
                  placeholder="예: 45평 / 150㎡"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </FieldBlock>

              <FieldBlock label="예상 인원">
                <input
                  style={styles.input}
                  type="number"
                  min={0}
                  placeholder="예: 18"
                  value={headcount}
                  onChange={(e) => setHeadcount(e.target.value)}
                />
              </FieldBlock>

              <FieldBlock label="공간 형태">
                <input
                  style={styles.input}
                  type="text"
                  placeholder="예: 직사각형, 코너형, 긴 복도형"
                  value={shape}
                  onChange={(e) => setShape(e.target.value)}
                />
              </FieldBlock>
            </div>

            <div style={styles.grid1}>
              <FieldBlock label="원하는 브랜드 무드 / 분위기">
                <input
                  style={styles.input}
                  type="text"
                  placeholder="예: 미니멀, 따뜻한 우드톤, 프리미엄, 밝고 캐주얼"
                  value={brandMood}
                  onChange={(e) => setBrandMood(e.target.value)}
                />
              </FieldBlock>
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>도면 또는 손그림 업로드</h2>
            <p style={styles.sectionDescription}>
              정식 CAD 도면이 없어도 괜찮아요. 손그림, 스케치, 현장 사진,
              캡처 이미지로도 시작할 수 있어요.
            </p>

            <div style={styles.modeRow}>
              <button
                type="button"
                style={{
                  ...styles.modeChip,
                  ...(inputMode === "floorplan" ? styles.modeChipActive : {}),
                }}
                onClick={() => setInputMode("floorplan")}
              >
                정식 도면 있음
              </button>

              <button
                type="button"
                style={{
                  ...styles.modeChip,
                  ...(inputMode === "sketch" ? styles.modeChipActive : {}),
                }}
                onClick={() => setInputMode("sketch")}
              >
                손그림 / 스케치 / 사진
              </button>

              <button
                type="button"
                style={{
                  ...styles.modeChip,
                  ...(inputMode === "no_drawing" ? styles.modeChipActive : {}),
                }}
                onClick={() => setInputMode("no_drawing")}
              >
                파일 없이 시작
              </button>
            </div>

            {inputMode !== "no_drawing" ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
                  style={{ display: "none" }}
                  onChange={handleFileInputChange}
                />

                <div
                  style={{
                    ...styles.uploadBox,
                    ...(isDragOver ? styles.uploadBoxDragOver : {}),
                  }}
                  onClick={openFilePicker}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <div style={styles.uploadIcon}>📐</div>
                  <div style={styles.uploadTitle}>
                    여기를 클릭해서 도면 / 손그림 / 사진 파일을 업로드하세요
                  </div>
                  <div style={styles.uploadDescription}>
                    또는 파일을 이 영역으로 끌어다 놓아도 됩니다
                  </div>
                  <div style={styles.uploadMeta}>
                    지원 형식: PDF, JPG, JPEG, PNG, WEBP
                  </div>
                  <div style={styles.uploadMeta}>
                    손그림, 스케치, 휴대폰 사진도 가능
                  </div>

                  <button
                    type="button"
                    style={styles.uploadButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      openFilePicker();
                    }}
                  >
                    도면/손그림 파일 선택하기
                  </button>
                </div>

                {selectedFile && (
                  <div style={styles.fileSelectedCard}>
                    <div style={styles.fileSelectedTop}>
                      <span style={styles.fileCheck}>✅</span>
                      <div>
                        <div style={styles.fileSelectedLabel}>선택된 파일</div>
                        <div style={styles.fileSelectedName}>
                          {selectedFileSummary}
                        </div>
                      </div>
                    </div>

                    <div style={styles.fileActionRow}>
                      <button
                        type="button"
                        style={styles.secondaryButton}
                        onClick={openFilePicker}
                      >
                        다른 파일로 변경
                      </button>
                      <button
                        type="button"
                        style={styles.ghostDangerButton}
                        onClick={handleRemoveFile}
                      >
                        파일 제거
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={styles.noDrawingBox}>
                파일 없이도 프로젝트를 먼저 생성할 수 있어요.
                <br />
                나중에 상세 페이지에서 자료를 보완하면서 AI 분석/배치 생성을
                이어갈 수 있습니다.
              </div>
            )}
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>업종별 요구사항</h2>
            <p style={styles.sectionDescription}>
              현재 선택 업종: <strong>{getSpaceTypeLabel(spaceType)}</strong>
            </p>
            {renderSpaceSpecificFields()}
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>추가 메모</h2>
            <div style={styles.grid1}>
              <FieldBlock label="공간에 대한 추가 요청사항">
                <textarea
                  style={styles.textareaLarge}
                  placeholder="예: 밝은 채광 느낌, 대기 동선 분리, 포토존 강조, 직원 동선 최소화 등"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </FieldBlock>
            </div>
          </section>

          {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}
          {progressMessage && (
            <div style={styles.progressBox}>{progressMessage}</div>
          )}

          <div style={styles.submitRow}>
            <button
              type="submit"
              style={{
                ...styles.submitButton,
                ...(isSubmitting ? styles.submitButtonDisabled : {}),
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "프로젝트 생성 중..." : "프로젝트 생성하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label style={styles.fieldBlock}>
      <div style={styles.fieldLabel}>{label}</div>
      {children}
    </label>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      style={{
        ...styles.toggleRow,
        ...(checked ? styles.toggleRowActive : {}),
      }}
      onClick={() => onChange(!checked)}
    >
      <span>{label}</span>
      <span style={styles.toggleValue}>{checked ? "필요" : "불필요"}</span>
    </button>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f7f8fc 0%, #eef2ff 35%, #f8fafc 100%)",
    padding: "40px 20px 80px",
  },
  container: {
    width: "100%",
    maxWidth: "1040px",
    margin: "0 auto",
  },
  headerCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "28px 28px 24px",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
    marginBottom: "20px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#ede9fe",
    color: "#6d28d9",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "14px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.2,
    fontWeight: 800,
    color: "#0f172a",
  },
  subtitle: {
    marginTop: "14px",
    marginBottom: 0,
    fontSize: "15px",
    lineHeight: 1.7,
    color: "#475569",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 800,
    color: "#0f172a",
  },
  sectionDescription: {
    marginTop: "10px",
    marginBottom: "20px",
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#64748b",
  },
  grid1: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
  },
  fieldBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  fieldLabel: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#334155",
  },
  input: {
    width: "100%",
    height: "48px",
    borderRadius: "14px",
    border: "1px solid #dbe3ef",
    background: "#fff",
    padding: "0 14px",
    fontSize: "15px",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    height: "48px",
    borderRadius: "14px",
    border: "1px solid #dbe3ef",
    background: "#fff",
    padding: "0 14px",
    fontSize: "15px",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: "100px",
    borderRadius: "14px",
    border: "1px solid #dbe3ef",
    background: "#fff",
    padding: "14px",
    fontSize: "15px",
    lineHeight: 1.6,
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
  },
  textareaLarge: {
    width: "100%",
    minHeight: "140px",
    borderRadius: "14px",
    border: "1px solid #dbe3ef",
    background: "#fff",
    padding: "14px",
    fontSize: "15px",
    lineHeight: 1.7,
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
  },
  modeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "18px",
  },
  modeChip: {
    border: "1px solid #dbe3ef",
    background: "#ffffff",
    color: "#334155",
    borderRadius: "999px",
    padding: "11px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  modeChipActive: {
    background: "#eef2ff",
    color: "#3730a3",
    border: "1px solid #c7d2fe",
  },
  uploadBox: {
    border: "2px dashed #cbd5e1",
    borderRadius: "22px",
    background: "linear-gradient(180deg, #f8fbff 0%, #f8fafc 100%)",
    padding: "34px 24px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  uploadBoxDragOver: {
    border: "2px dashed #6366f1",
    background: "#eef2ff",
    transform: "translateY(-1px)",
  },
  uploadIcon: {
    fontSize: "40px",
    marginBottom: "12px",
  },
  uploadTitle: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.4,
    marginBottom: "8px",
  },
  uploadDescription: {
    fontSize: "14px",
    color: "#475569",
    marginBottom: "10px",
  },
  uploadMeta: {
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.6,
  },
  uploadButton: {
    marginTop: "18px",
    height: "46px",
    borderRadius: "12px",
    border: "none",
    background: "#4f46e5",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 800,
    padding: "0 18px",
    cursor: "pointer",
  },
  fileSelectedCard: {
    marginTop: "16px",
    borderRadius: "18px",
    border: "1px solid #c7f9d4",
    background: "#f0fdf4",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  fileSelectedTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  fileCheck: {
    fontSize: "22px",
  },
  fileSelectedLabel: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#166534",
    marginBottom: "4px",
  },
  fileSelectedName: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#14532d",
    wordBreak: "break-all",
    lineHeight: 1.5,
  },
  fileActionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  secondaryButton: {
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #bbf7d0",
    background: "#ffffff",
    color: "#166534",
    fontSize: "14px",
    fontWeight: 700,
    padding: "0 14px",
    cursor: "pointer",
  },
  ghostDangerButton: {
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #fecaca",
    background: "#ffffff",
    color: "#b91c1c",
    fontSize: "14px",
    fontWeight: 700,
    padding: "0 14px",
    cursor: "pointer",
  },
  noDrawingBox: {
    borderRadius: "18px",
    border: "1px solid #dbe3ef",
    background: "#f8fafc",
    padding: "18px",
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#475569",
  },
  toggleRow: {
    minHeight: "52px",
    borderRadius: "14px",
    border: "1px solid #dbe3ef",
    background: "#ffffff",
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "15px",
    fontWeight: 700,
    color: "#334155",
    cursor: "pointer",
  },
  toggleRowActive: {
    background: "#f5f3ff",
    border: "1px solid #c4b5fd",
    color: "#5b21b6",
  },
  toggleValue: {
    fontSize: "13px",
    fontWeight: 800,
  },
  errorBox: {
    borderRadius: "16px",
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    padding: "14px 16px",
    fontSize: "14px",
    fontWeight: 700,
  },
  progressBox: {
    borderRadius: "16px",
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "14px 16px",
    fontSize: "14px",
    fontWeight: 700,
  },
  submitRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  submitButton: {
    minWidth: "220px",
    height: "54px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 800,
    padding: "0 22px",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(79, 70, 229, 0.24)",
  },
  submitButtonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
};
