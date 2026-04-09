"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function ProjectDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("office_projects")
        .select("*")
        .eq("id", Number(id))
        .single();

      if (error) {
        setErrorMessage(`불러오기 실패: ${error.message}`);
      } else {
        setProject(data);
      }

      setLoading(false);
    };

    fetchProject();
  }, [id]);

  const handleDeleteClick = async () => {
    const ok = window.confirm("정말 이 프로젝트를 삭제할까요?");
    if (!ok) return;

    setIsDeleting(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("office_projects")
      .delete()
      .eq("id", Number(id));

    if (error) {
      setErrorMessage(`삭제 실패: ${error.message}`);
      setIsDeleting(false);
      return;
    }

    alert("프로젝트가 삭제되었습니다.");
    router.push("/projects");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">프로젝트 상세</p>
            <h1 className="mt-1 text-3xl font-bold">사무실 프로젝트 상세 정보</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/projects"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100"
            >
              목록으로
            </Link>

            <Link
              href={`/projects/${id}/edit`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              수정하기
            </Link>

            <Link
              href={`/projects/${id}/layout3d`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
            >
              3D 배치도면 만들기
            </Link>

            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isDeleting ? "삭제 중..." : "삭제하기"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            프로젝트 정보를 불러오는 중...
          </div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && project && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">기본 정보</p>
              <h2 className="mt-2 text-2xl font-bold">{project.project_name}</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">면적</p>
                  <p className="mt-1 text-lg font-semibold">
                    {project.area || "-"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">인원수</p>
                  <p className="mt-1 text-lg font-semibold">
                    {project.headcount ?? "-"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">공간 형태</p>
                  <p className="mt-1 text-lg font-semibold">
                    {project.shape || "-"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">생성일</p>
                  <p className="mt-1 text-lg font-semibold">
                    {new Date(project.created_at).toLocaleString("ko-KR")}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">추가 요청사항</p>
                <p className="mt-1 text-base">
                  {project.notes?.trim() ? project.notes : "추가 요청사항 없음"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">저장된 3D 시안</p>
                  <h3 className="mt-1 text-2xl font-bold">3D 가구배치도면</h3>
                </div>

                <Link
                  href={`/projects/${id}/layout3d`}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100"
                >
                  3D 페이지로 이동
                </Link>
              </div>

              {!project.layout3d_image_url && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <p className="text-lg font-semibold">
                    아직 저장된 3D 시안이 없습니다
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    위의 "3D 배치도면 만들기" 버튼을 눌러 먼저 생성해 주세요.
                  </p>
                </div>
              )}

              {project.layout3d_image_url && (
                <div className="space-y-4">
                  <img
                    src={project.layout3d_image_url}
                    alt="저장된 3D 가구배치도면"
                    className="w-full rounded-2xl border border-slate-200 shadow-sm"
                  />

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={project.layout3d_image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100"
                    >
                      새 탭에서 보기
                    </a>

                    <a
                      href={project.layout3d_image_url}
                      download={`project-${project.id}-3d-layout.png`}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100"
                    >
                      이미지 다운로드
                    </a>
                  </div>
                </div>
              )}
            </section>

            {project.layout3d_prompt && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">저장된 3D 생성 프롬프트</p>
                <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-700">
{project.layout3d_prompt}
                </pre>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
