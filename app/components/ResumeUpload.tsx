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
    <div className="flex flex-col gap-8 py-8 max-w-2xl mx-auto w-full">
      <div className="text-center">
        <h2 className="text-4xl font-black tracking-tight mb-3 text-gray-900">이력서를 업로드하세요</h2>
        <p className="text-gray-400 leading-relaxed">
          AI가 경력·기술스택에 맞는 질문을 생성합니다<br />
          <span className="text-gray-300 text-sm">건너뛰면 기본 질문으로 진행됩니다</span>
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isGeneratingQuestions && document.getElementById('resume-input')?.click()}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
          ${isDragging ? 'border-violet-400 bg-violet-50 scale-[1.01]'
            : generatedQuestions ? 'border-emerald-300 bg-emerald-50'
            : 'border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/50'}
        `}
      >
        <input id="resume-input" type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={onFileInputChange} />

        <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
          {isGeneratingQuestions ? (
            <>
              <div className="relative mb-5">
                <div className="w-14 h-14 rounded-full border-2 border-gray-100" />
                <div className="absolute inset-0 w-14 h-14 rounded-full border-2 border-t-violet-500 animate-spin" />
              </div>
              <p className="font-semibold text-gray-600 text-sm">AI가 맞춤 질문을 생성하는 중...</p>
              <p className="text-gray-400 text-xs mt-1">잠시만 기다려주세요</p>
            </>
          ) : generatedQuestions ? (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="font-bold text-emerald-600 text-sm mb-0.5">{resumeFile?.name}</p>
              <p className="text-emerald-500 text-xs mb-6">{generatedQuestions.length}개 맞춤 질문 생성 완료</p>
              <div className="w-full max-w-md text-left space-y-3" onClick={(e) => e.stopPropagation()}>
                {generatedQuestions.map((q, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <p className="text-sm text-gray-500 leading-relaxed">{q.replace(/^\d+\.\s*/, '')}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-violet-100' : 'bg-gray-50'}`}>
                <svg className={`w-7 h-7 transition-colors ${isDragging ? 'text-violet-500' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className={`font-semibold text-sm mb-1 ${isDragging ? 'text-violet-600' : 'text-gray-500'}`}>
                {isDragging ? '여기에 놓으세요!' : '파일을 드래그하거나 클릭하여 업로드'}
              </p>
              <p className="text-gray-300 text-xs">PDF · DOCX · TXT · 최대 10MB</p>
            </>
          )}
        </div>
      </div>

      {resumeError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <div className="flex gap-3 items-start">
            <svg className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-rose-600">{resumeError}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={onNext}
          disabled={isGeneratingQuestions}
          className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 8px 24px rgba(124,58,237,0.2)' }}
        >
          {generatedQuestions ? '맞춤 질문으로 면접 시작 →' : '면접 시작하기 →'}
        </button>

        {generatedQuestions ? (
          <div className="flex gap-3">
            <button onClick={() => resumeFile && onResumeUpload(resumeFile)} disabled={isGeneratingQuestions}
              className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-gray-400 text-sm font-medium hover:border-gray-300 hover:text-gray-600 transition-all disabled:opacity-40">
              다시 생성
            </button>
            <button onClick={() => { onClearResume(); document.getElementById('resume-input')?.click(); }} disabled={isGeneratingQuestions}
              className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-gray-400 text-sm font-medium hover:border-gray-300 hover:text-gray-600 transition-all disabled:opacity-40">
              파일 변경
            </button>
          </div>
        ) : (
          <button onClick={onNext} disabled={isGeneratingQuestions}
            className="w-full py-3 rounded-xl border border-gray-200 bg-white text-gray-400 text-sm font-medium hover:border-gray-300 hover:text-gray-600 transition-all disabled:opacity-40">
            이력서 없이 시작
          </button>
        )}
      </div>
    </div>
  );
}
