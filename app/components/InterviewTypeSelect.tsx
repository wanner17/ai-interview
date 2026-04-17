interface InterviewTypeSelectProps {
  interviewType: string | null;
  onSelectType: (type: string) => void;
  foreignLanguage: string;
  onSelectLanguage: (lang: string) => void;
  onConfirm: () => void;
}

export function InterviewTypeSelect({
  interviewType, onSelectType, foreignLanguage, onSelectLanguage, onConfirm,
}: InterviewTypeSelectProps) {
  const types = [
    { id: 'individual', icon: '🧑‍💼', label: '개인면접', sub: '1:1 AI', desc: '이력서 기반 심층 압박 질문 + 꼬리 질문', available: true },
    { id: 'foreign', icon: '🌐', label: '외국어면접', sub: 'Foreign', desc: '영어·일본어·중국어 면접 유창성 분석', available: true },
    { id: 'group', icon: '👥', label: '집단면접', sub: 'N:AI', desc: '공통 질문과 상대 비교 분석', available: true },
    { id: 'pt', icon: '📊', label: 'PT면접', sub: 'Presentation', desc: 'AI 주제 + 발표 분석 + Q&A', available: true },
    { id: 'discussion', icon: '💬', label: '토론면접', sub: 'Discussion', desc: 'AI 사회자 + 찬반/자유 토론', available: true },
  ];

  return (
    <div className="bg-white dark:bg-[#111118] rounded-3xl shadow-xl shadow-blue-900/5 dark:shadow-black/30 border border-gray-100 dark:border-white/5 overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>
      <div className="flex flex-col items-center text-center px-8 py-12">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-2xl scale-150"></div>
          <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center text-3xl shadow-2xl shadow-indigo-600/30">
            🎯
          </div>
        </div>
        <h2 className="text-2xl font-black mb-2 text-zinc-900 dark:text-white">면접 유형 선택</h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8 text-sm leading-relaxed">
          원하는 면접 유형을 선택하세요.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-6">
          {types.map((type) => (
            <button
              key={type.id}
              onClick={() => type.available && onSelectType(type.id)}
              disabled={!type.available}
              className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                !type.available
                  ? 'opacity-50 cursor-not-allowed border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/3'
                  : interviewType === type.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-lg shadow-blue-500/10'
                  : 'border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-md'
              }`}
            >
              {!type.available && (
                <span className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-full">준비 중</span>
              )}
              {type.available && interviewType === type.id && (
                <span className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 bg-blue-500 text-white rounded-full">선택됨</span>
              )}
              <div className="text-3xl mb-2">{type.icon}</div>
              <p className="font-black text-zinc-800 dark:text-zinc-100 text-sm">{type.label}</p>
              <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold mb-1">{type.sub}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{type.desc}</p>
            </button>
          ))}
        </div>

        {interviewType === 'foreign' && (
          <div className="w-full max-w-2xl mb-6 p-5 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
            <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-3">면접 언어 선택</p>
            <div className="flex gap-3">
              {[
                { code: 'en-US', label: '🇺🇸 영어' },
                { code: 'ja-JP', label: '🇯🇵 일본어' },
                { code: 'zh-CN', label: '🇨🇳 중국어' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onSelectLanguage(lang.code)}
                  className={`flex-1 py-2 rounded-xl font-semibold text-sm border-2 transition-all ${
                    foreignLanguage === lang.code
                      ? 'border-indigo-500 bg-indigo-500 text-white'
                      : 'border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:border-indigo-400'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => interviewType && onConfirm()}
          disabled={!interviewType}
          className="w-full max-w-2xl px-6 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-zinc-900 font-bold rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {interviewType ? '선택 완료 →' : '유형을 선택해주세요'}
        </button>
      </div>
    </div>
  );
}
