interface ResumeUploadProps {
  resumeFile: File | null;
  generatedQuestions: string[] | null;
  isGeneratingQuestions: boolean;
  resumeError: string | null;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResumeUpload: (file: File) => void;
  onNext: () => void;
  onClearResume: () => void;
}

export function ResumeUpload({
  resumeFile, generatedQuestions, isGeneratingQuestions, resumeError, isDragging,
  onDragOver, onDragLeave, onDrop, onFileInputChange, onResumeUpload, onNext, onClearResume,
}: ResumeUploadProps) {
  return (
    <div className="bg-white dark:bg-[#111118] rounded-3xl shadow-xl shadow-blue-900/5 dark:shadow-black/30 border border-gray-100 dark:border-white/5 overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500"></div>
      <div className="flex flex-col items-center text-center px-8 py-12">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-violet-400/20 dark:bg-violet-500/10 rounded-full blur-2xl scale-150"></div>
          <div className="relative w-20 h-20 bg-gradient-to-br from-violet-500 to-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-2xl shadow-violet-600/30">
            📄
          </div>
        </div>

        <h2 className="text-2xl font-black mb-2 text-zinc-900 dark:text-white">이력서 기반 맞춤 질문</h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8 leading-relaxed text-sm">
          이력서를 업로드하면 AI가 경력·기술스택에 맞는 질문을 생성합니다.<br/>
          건너뛰면 기본 면접 질문으로 진행됩니다.
        </p>

        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative w-full max-w-lg border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer mb-4 ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
              : generatedQuestions
              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
              : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/5'
          }`}
          onClick={() => !isGeneratingQuestions && document.getElementById('resume-input')?.click()}
        >
          <input
            id="resume-input"
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={onFileInputChange}
          />

          {isGeneratingQuestions ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">AI가 맞춤 질문을 생성하는 중...</p>
            </div>
          ) : generatedQuestions ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <span className="text-3xl">✅</span>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{resumeFile?.name}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">{generatedQuestions.length}개 맞춤 질문 생성 완료</p>
              <ul className="mt-3 text-left space-y-2 w-full">
                {generatedQuestions.map((q, i) => (
                  <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    <span className="font-bold text-blue-600 dark:text-blue-400">Q{i + 1}.</span> {q.replace(/^\d+\.\s*/, '')}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <span className="text-4xl">📎</span>
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                {isDragging ? '여기에 놓으세요!' : 'PDF / DOCX / TXT 파일을 드래그하거나 클릭하여 업로드'}
              </p>
              <p className="text-xs text-zinc-400">최대 10MB</p>
            </div>
          )}
        </div>

        {resumeError && (
          <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-2 rounded-xl mb-4">
            ⚠️ {resumeError}
          </p>
        )}

        <div className="flex flex-col gap-3 w-full max-w-lg">
          <button
            onClick={onNext}
            disabled={isGeneratingQuestions}
            className="w-full px-6 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-zinc-900 font-bold rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatedQuestions ? '맞춤 질문으로 면접 시작' : '면접 시작하기'}
          </button>
          <div className="flex gap-3">
            {generatedQuestions ? (
              <>
                <button
                  onClick={() => resumeFile && onResumeUpload(resumeFile)}
                  disabled={isGeneratingQuestions}
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 text-sm"
                >
                  🔄 다시 생성하기
                </button>
                <button
                  onClick={() => {
                    onClearResume();
                    document.getElementById('resume-input')?.click();
                  }}
                  disabled={isGeneratingQuestions}
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 text-sm"
                >
                  📁 파일 다시 올리기
                </button>
              </>
            ) : (
              <button
                onClick={onNext}
                disabled={isGeneratingQuestions}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 font-semibold rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 text-sm"
              >
                이력서 없이 시작
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
