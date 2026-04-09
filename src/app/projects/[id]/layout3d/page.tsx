"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Project = {
  id: number;
  project_name: string;
  area: string | null;
  headcount: number | null;
  shape: string | null;
  notes: string | null;
  created_at: string;
  layout3d_image_url: string | null;
  layout3d_prompt: string | null;
};

function base64ToBlob(base64: string, contentType = "image/png") {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

export default function Project3DLayoutPage() {
  const { id } = useParams() as { id: string };

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [usedPrompt, setUsedPrompt] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const { data, error } = await supabase
        .from("office_projects")
        .select("*")
        .eq("id", Number(id))
        .single();

      if (error) {
        setErrorMessage(`프로젝트 불러오기 실패: ${error.message}`);
      } else {
        setProject(data);
        setGeneratedImageUrl(data.layout3d_image_url || "");
        setUsedPrompt(data.layout3d_prompt || "");
      }

      setLoading(false);
    };

    fetchProject();
  }, [id]);

  const promptPreview = useMemo(() => {
    if (!project) return "";

    return [
      "Create a professional 3D isometric office furniture layout concept image.",
      `Project name: ${project.project_name}`,
      `Area: ${project.area || "unknown"}`,
      `Headcount: ${project.headcount ?? "unknown"}`,
      `Room shape: ${project.shape || "unknown"}`,
      `Additional requirements: ${project.notes || "none"}`,
      "",
      "Requirements:",
      "- modern office interior",
      "- 3D isometric layout view",
      "- clean architectural presentation style",
      "- desk arrangement optimized for the given headcount",
      "- include meeting area",
      "- include pantry or lounge area if suitable",
      "- realistic office furniture placement",
      "- bright neutral colors",
      "- top-down isometric perspective",
      "- no text labels inside the image",
      "- single office floor concept",
    ].join("\n");
  }, [project]);

  const handleGenerate3D = async () => {
    if (!project) return;

    setIsGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/generate-layout3d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName: project.project_name,
          area: project.area,
          headcount: project.headcount,
          shape: project.shape,
          notes: project.notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "3D 시안 생성에 실패했습니다.");
      }

      const imageBlob = base64ToBlob(result.imageBase64);
      const filePath = `project-${project.id}/layout-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("layout3d-images")
        .upload(filePath, imageBlob, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Storage 업로드 실패: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from("layout3d-images")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from("office_projects")
        .update({
          layout3d_image_url: publicUrl,
          layout3d_prompt: result.prompt || "",
        })
        .eq("id", project.id);

      if (updateError) {
        throw new Error(`프로젝트 저장 실패: ${updateError.message}`);
      }

      setGeneratedImageUrl(publicUrl);
      setUsedPrompt(result.prompt || "");
      setSuccessMessage("3D 시안이 Storage와 프로젝트 정보에 저장되었습니다.");

      setProject((prev) =>
        prev
          ? {
              ...prev,
              layout3d_image_url: publicUrl,
              layout3d_prompt: result.prompt || "",
            }
          : prev
      );
    } catch (error: any) {
      setErrorMessage(error?.message || "3D 시안 생성/저장 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">3D 가구배치도면</p>
            <h1 className="mt-1 text-3xl font-bold">3D 배치 시안 만들기</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/projects/${id}`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100"
            >
              상세로 돌아가기
            </Link>

            <Link
              href="/projects"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100"
            >
              목록으로
            </Link>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            프로젝트 정보를 불러오는 중...
          </div>
        )}

        {!loading && errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
            {errorMessage}
          </div>
        )}

        {!loading && successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-700 shadow-sm">
            {successMessage}
          </div>
        )}

        {!loading && !errorMessage && project && (
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">기준 프로젝트 정보</p>
                <h2 className="mt-2 text-2xl font-bold">{project.project_name}</h2>

                <div className="mt-5 grid gap-4">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">면적</p>
                    <p className="mt-1 text-lg font-semibold">{project.area || "-"}</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">인원수</p>
                    <p className="mt-1 text-lg font-semibold">
                      {project.headcount ?? "-"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">공간 형태</p>
                    <p className="mt-1 text-lg font-semibold">{project.shape || "-"}</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">추가 요청사항</p>
                    <p className="mt-1 text-base">
                      {project.notes?.trim() ? project.notes : "추가 요청사항 없음"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate3D}
                  disabled={isGenerating}
                  className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  {isGenerating ? "3D 시안 생성 및 저장 중..." : "3D 시안 생성하고 저장하기"}
                </button>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">생성 프롬프트 미리보기</p>
                <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-700">
{promptPreview}
                </pre>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">3D 시안 결과</p>

                {!generatedImageUrl && !isGenerating && (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                    <h3 className="text-xl font-bold">
                      아직 저장된 3D 시안이 없습니다
                    </h3>
                    <p className="mt-3 text-sm text-slate-500">
                      왼쪽 버튼을 누르면 생성 후 Storage와 프로젝트 정보에 저장됩니다.
                    </p>
                  </div>
                )}

                {isGenerating && (
                  <div className="mt-4 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50 p-12 text-center">
                    <h3 className="text-xl font-bold text-indigo-700">
                      3D 시안을 생성하고 저장하는 중입니다...
                    </h3>
                    <p className="mt-3 text-sm text-indigo-600">
                      생성 → Storage 업로드 → 프로젝트 정보 저장 순서로 진행됩니다.
                    </p>
                  </div>
                )}

                {generatedImageUrl && (
                  <div className="mt-4 space-y-4">
                    <img
                      src={generatedImageUrl}
                      alt="생성된 3D 가구배치도면"
                      className="w-full rounded-2xl border border-slate-200 shadow-sm"
                    />

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={generatedImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100"
                      >
                        새 탭에서 보기
                      </a>

                      <a
                        href={generatedImageUrl}
                        download={`project-${project.id}-3d-layout.png`}
                        className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100"
                      >
                        이미지 다운로드
                      </a>
                    </div>
                  </div>
                )}
              </section>

              {usedPrompt && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-500">실제 생성에 사용된 프롬프트</p>
                  <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-700">
{usedPrompt}
                  </pre>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
