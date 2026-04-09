export default function NewProjectPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-3 text-3xl font-bold">새 프로젝트 만들기</h1>
        <p className="mb-8 text-slate-600">
          공실 정보와 배치 조건을 입력해서 사무실 배치 검토를 시작하는 화면입니다.
        </p>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium">프로젝트 이름</label>
            <input
              type="text"
              placeholder="예: 보험회사 강남지점 이전안"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium">공실 면적</label>
            <input
              type="text"
              placeholder="예: 100평"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium">총 인원 수</label>
            <input
              type="number"
              placeholder="예: 35"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium">공간 형태</label>
            <select className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500">
              <option>직사각형</option>
              <option>정사각형</option>
              <option>ㄱ자형</option>
              <option>ㄴ자형</option>
              <option>기타</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">추가 요청 사항</label>
            <textarea
              placeholder="예: 회의실 2개 필요, 지점장실 필요, 기존 책상 사용"
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <button className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">
            입력 내용 저장하기
          </button>
        </div>
      </div>
    </main>
  );
}
