"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
};

export default function ProjectEditPage() {
  const params = useParams();
  const id = params.id as string;

  const [projectName, setProjectName] = useState("");
  const [area, setArea] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [shape, setShape] = useState("직사각형");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("office_projects")
        .select()
        .eq("id", Number(id))
        .single();

      if (error) {
        setMessage(`불러오기 실패: ${error.message}`);
      } else if (data) {
        const project = data as Project;
        setProjectName(project.project_name || "");
        setArea(project.area || "");
        setHeadcount(project.headcount ? String(project.headcount) : "");
        setShape(project.shape || "직사각형");
        setNotes(project.notes || "");
      }

      setLoading(false);
    };

    fetchProject();
  }, [id]);

  const handleUpdateClick = async () => {
    setMessage("");

    if (!projectName.trim()) {
      setMessage("프로젝트 이름은 꼭 입력해야 합니다.");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from("office_projects")
      .update({
        project_name: projectName,
        area,
        headcount: headcount ? Number(headcount) : null,
        shape,
        notes,
      })
      .eq("id", Number(id));

    if (error) {
      setMessage(`수정 실패: ${error.message}`);
    } else {
      setMessage("프로젝트가 수정되었습니다.");
    }

    setIsSaving(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">프로젝트 수정</p>
            <h1 className="mt-1 text-3xl font-bold">저장된 프로젝트 수정하기</h1>
          </div>

          <Link
            href={`/projects/${id}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100"
          >
            상세로 돌아가기
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            불러오는 중...
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">기본 정보 수정</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    프로젝트 이름
                  </label>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">면적</label>
                  <input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">인원수</label>
                  <input
                    value={headcount}
                    onChange={(e) => setHeadcount(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">공간 형태</label>
                  <select
                    value={shape}
                    onChange={(e) => setShape(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="직사각형">직사각형</option>
                    <option value="정사각형">정사각형</option>
                    <option value="ㄱ자형">ㄱ자형</option>
                    <option value="복합형">복합형</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">추가 요청사항</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleUpdateClick}
                  disabled={isSaving}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isSaving ? "수정 중..." : "수정 내용 저장하기"}
                </button>

                {message && (
                  <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                    {message}
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">수정 내용 미리보기</h2>

              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-slate-50 p-3">
                  <span className="font-semibold">프로젝트 이름: </span>
                  {projectName || "아직 입력 전"}
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <span className="font-semibold">면적: </span>
                  {area || "아직 입력 전"}
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <span className="font-semibold">인원수: </span>
                  {headcount || "아직 입력 전"}
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <span className="font-semibold">공간 형태: </span>
                  {shape || "아직 선택 전"}
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <span className="font-semibold">추가 요청사항: </span>
                  {notes || "아직 입력 전"}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
