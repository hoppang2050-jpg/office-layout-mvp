"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

export default function HomePage() {
  const [projectCount, setProjectCount] = useState(0);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingDashboard(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("office_projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(`불러오기 실패: ${error.message}`);
        setProjectCount(0);
        setRecentProjects([]);
      } else {
        const rows = data || [];
        setProjectCount(rows.length);
        setRecentProjects(rows.slice(0, 3));
      }

      setLoadingDashboard(false);
    };

    fetchDashboardData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-sky-500 px-8 py-10 text-white shadow-lg">
          <p className="text-sm opacity-90">Office Project Manager</p>
          <h1 className="mt-2 text-4xl font-bold">사무실 프로젝트 관리 대시보드</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50">
            프로젝트를 등록하고, 목록으로 확인하고, 상세/수정/삭제와 3D 배치 시안까지
            한 번에 관리할 수 있는 홈 화면입니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/projects/new"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              새 프로젝트 만들기
            </Link>
            <Link
              href="/projects"
              className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              프로젝트 목록 보기
            </Link>
          </div>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">전체 프로젝트 수</p>
            <p className="mt-3 text-3xl font-bold">
              {loadingDashboard ? "..." : `${projectCount}개`}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              지금까지 저장된 전체 프로젝트 개수
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">빠른 시작</p>
            <h2 className="mt-3 text-xl font-semibold">새 프로젝트 등록</h2>
            <p className="mt-2 text-sm text-slate-500">
              새 사무실 프로젝트를 입력하고 바로 저장할 수 있어요.
            </p>
            <Link
              href="/projects/new"
              className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              등록하러 가기
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">빠른 보기</p>
            <h2 className="mt-3 text-xl font-semibold">전체 목록 확인</h2>
            <p className="mt-2 text-sm text-slate-500">
              저장된 프로젝트를 검색, 정렬, 수정, 삭제, 3D 시안 관리까지 할 수 있어요.
            </p>
            <Link
              href="/projects"
              className="mt-4 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
            >
              목록 보러 가기
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">최근 등록</p>
              <h2 className="mt-1 text-2xl font-bold">최근 프로젝트 3개</h2>
            </div>

            <Link
              href="/projects"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm transition hover:bg-slate-100"
            >
              전체 목록 보기
            </Link>
          </div>

          {loadingDashboard && (
            <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              최근 프로젝트를 불러오는 중...
            </div>
          )}

          {!loadingDashboard && errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!loadingDashboard && !errorMessage && recentProjects.length === 0 && (
            <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              아직 저장된 프로젝트가 없습니다.
            </div>
          )}

          {!loadingDashboard && !errorMessage && recentProjects.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {recentProjects.map((project) => (
                <article
                  key={project.id}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                >
                  <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                    {project.layout3d_image_url ? (
                      <img
                        src={project.layout3d_image_url}
                        alt={`${project.project_name} 3D 시안`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500">
                        아직 3D 시안 없음
                      </div>
                    )}

                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur">
                        프로젝트 #{project.id}
                      </span>
                    </div>

                    <div className="absolute right-4 top-4">
                      {project.layout3d_image_url ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                          3D 있음
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                          3D 없음
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div>
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-xl font-bold text-slate-900 transition hover:text-blue-600"
                      >
                        {project.project_name}
                      </Link>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-slate-500">면적</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {project.area || "-"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-slate-500">인원수</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {project.headcount ?? "-"}
                          </p>
                        </div>

                        <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                          <p className="text-slate-500">공간 형태</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {project.shape || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                        <p className="mb-1 font-medium text-slate-800">요청사항</p>
                        <p className="min-h-[60px] leading-6">
                          {project.notes?.trim() ? project.notes : "추가 요청사항 없음"}
                        </p>
                      </div>

                      <p className="mt-4 text-xs text-slate-400">
                        생성일: {new Date(project.created_at).toLocaleString("ko-KR")}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      <Link
                        href={`/projects/${project.id}`}
                        className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium transition hover:bg-slate-100"
                      >
                        상세
                      </Link>

                      <Link
                        href={`/projects/${project.id}/layout3d`}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-indigo-700"
                      >
                        3D 보기
                      </Link>

                      <Link
                        href={`/projects/${project.id}/edit`}
                        className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
                      >
                        수정
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
