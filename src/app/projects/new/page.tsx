"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewProjectPage() {
  const [projectName, setProjectName] = useState("");
  const [area, setArea] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [shape, setShape] = useState("직사각형");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleSaveClick = async () => {
    setSaveMessage("");

    if (!projectName.trim()) {
      setSaveMessage("프로젝트 이름은 꼭 입력해야 합니다.");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.from("office_projects").insert([
      {
        project_name: projectName,
        area,
        headcount: headcount ? Number(headcount) : null,
        shape,
        notes,
      },
    ]);

    if (error) {
      setSaveMessage(`저장 실패: ${error.message}`);
    } else {
      setSaveMessage("Supabase에 실제로 저장되었습니다.");
      setProjectName("");
      setArea("");
      setHeadcount("");
      setShape("직사각형");
      setNotes("");
    }

    setIsSaving(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">프로젝트 등록</p>
            <h1 className="mt-1 text-3xl font-bold">새 사무실 프로젝트 만들기</h1>
          </div>
          <Link
            href="/projects"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100"
          >
            목록으로
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">기본 정보 입력</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  프로젝트 이름
                </label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="예: 강남지점 이전안"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">면적</label>
                <input
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="예: 100평"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">인원수</label>
                <input
                  value={headcount}
                  onChange={(e) => setHeadcount(e.target.value)}
                  placeholder="예: 35"
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
                  placeholder="예: 회의실 2개 필요, 대표실 포함"
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleSaveClick}
                disabled={isSaving}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSaving ? "저장 중..." : "입력 내용 저장하기"}
              </button>

              {saveMessage && (
                <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  {saveMessage}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">입력 내용 미리보기</h2>

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
      </div>
    </main>
  );
}
