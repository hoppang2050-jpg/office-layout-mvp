"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
};

type SortOption =
  | "latest"
  | "oldest"
  | "name"
  | "headcountDesc"
  | "headcountAsc";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("office_projects")
        .select("*");

      if (error) {
        setErrorMessage(`불러오기 실패: ${error.message}`);
      } else {
        setProjects(data || []);
      }

      setLoading(false);
    };

    fetchProjects();
  }, []);

  const visibleProjects = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    let filtered = [...projects];

    if (keyword) {
      filtered = filtered.filter((project) => {
        const name = project.project_name?.toLowerCase() || "";
        const area = project.area?.toLowerCase() || "";
        const shape = project.shape?.toLowerCase() || "";
        const notes = project.notes?.toLowerCase() || "";
        const headcount = String(project.headcount ?? "");
        const has3d = project.layout3d_image_url ? "있음" : "없음";

        return (
          name.includes(keyword) ||
          area.includes(keyword) ||
          shape.includes(keyword) ||
          notes.includes(keyword) ||
          headcount.includes(keyword) ||
          has3d.includes(keyword)
        );
      });
    }

    filtered.sort((a, b) => {
      if (sortOption === "latest") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      if (sortOption === "oldest") {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }

      if (sortOption === "name") {
        return a.project_name.localeCompare(b.project_name, "ko-KR");
      }

      if (sortOption === "headcountDesc") {
        return (b.headcount ?? -1) - (a.headcount ?? -1);
      }

      if (sortOption === "headcountAsc") {
        return (a.headcount ?? 999999) - (b.headcount ?? 999999);
      }

      return 0;
    });

    return filtered;
  }, [projects, searchKeyword, sortOption]);

  const handleDelete = async (projectId: number, projectName: string) => {
    const ok = window.confirm(
      `"${projectName}" 프로젝트를 정말 삭제할까요?`
    );

    if (!ok) return;

    setDeletingId(projectId);
    setErrorMessage("");

    const { error } = await supabase
      .from("office_projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      setErrorMessage(`삭제 실패: ${error.message}`);
      setDeletingId(null);
      return;
    }

    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    setDeletingId(null);
    alert("프로젝트가 삭제되었습니다.");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">프로젝트 목록</p>
            <h1 className="mt-1 text-3xl font-bold">저장된 사무실 프로젝트</h1>
          </div>

          <Link
            href="/projects/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            새 프로젝트 만들기
          </Link>
        </div>

        <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="프로젝트명, 면적, 인원수, 형태, 요청사항, 3D 여부 검색"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="latest">최신 생성순</option>
            <option value="oldest">오래된 생성순</option>
            <option value="name">이름순</option>
            <option value="headcountDesc">인원수 많은 순</option>
            <option value="headcountAsc">인원수 적은 순</option>
          </select>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          현재 표시 결과: <span className="font-semibold">{visibleProjects.length}</span>개
        </p>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            불러오는 중...
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && visibleProjects.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            검색 결과가 없습니다.
          </div>
        )}

        {!loading && visibleProjects.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">프로젝트 이름</th>
                  <th className="px-4 py-3">면적</th>
                  <th className="px-4 py-3">인원수</th>
                  <th className="px-4 py-3">공간 형태</th>
                  <th className="px-4 py-3">요청사항</th>
                  <th className="px-4 py-3">3D 시안</th>
                  <th className="px-4 py-3">생성일</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>

              <tbody>
                {visibleProjects.map((project) => (
                  <tr key={project.id} className="border-t border-slate-200">
                    <td className="px-4 py-3">{project.id}</td>

                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {project.project_name}
                      </Link>
                    </td>

                    <td className="px-4 py-3">{project.area || "-"}</td>
                    <td className="px-4 py-3">{project.headcount ?? "-"}</td>
                    <td className="px-4 py-3">{project.shape || "-"}</td>
                    <td className="px-4 py-3">{project.notes || "-"}</td>

                    <td className="px-4 py-3">
                      {project.layout3d_image_url ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                          있음
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                          없음
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {new Date(project.created_at).toLocaleString("ko-KR")}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/projects/${project.id}`}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100"
                        >
                          상세
                        </Link>

                        <Link
                          href={`/projects/${project.id}/edit`}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
                        >
                          수정
                        </Link>

                        <Link
                          href={`/projects/${project.id}/layout3d`}
                          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700"
                        >
                          3D
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(project.id, project.project_name)
                          }
                          disabled={deletingId === project.id}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                        >
                          {deletingId === project.id ? "삭제 중..." : "삭제"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
