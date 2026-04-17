interface PTReportProps {
  ptResults: any[];
}

export function PTReport({ ptResults }: PTReportProps) {
  const presentation = ptResults.find(r => r.type === 'presentation');
  const qaItems = ptResults.filter(r => r.type === 'qa');
  const avgScore = Math.round(ptResults.reduce((a, r) => a + (r.answerScore || 0), 0) / ptResults.length);
  const scoreColor = avgScore >= 80 ? '#10B981' : avgScore >= 60 ? '#3B82F6' : '#F59E0B';

  return (
    <div className="min-h-screen bg-[#F0F4FF] dark:bg-[#0A0A0F] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4F46E5] rounded-3xl px-8 py-12 text-white text-center">
          <p className="text-violet-200 text-sm font-semibold tracking-widest uppercase mb-2">PT Interview</p>
          <h1 className="text-3xl font-black mb-1">PT면접 종합 결과</h1>
          <p className="text-violet-200 text-sm">{presentation?.topic}</p>
        </div>

        <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
          <div className="relative flex-shrink-0">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" strokeWidth="10"/>
              <circle cx="60" cy="60" r="52" fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`} strokeDashoffset={`${2 * Math.PI * 52 * (1 - avgScore / 100)}`}/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-zinc-900 dark:text-white">{avgScore}</span>
              <span className="text-sm text-zinc-400">/ 100</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-1">종합 PT 점수</p>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
              {avgScore >= 80 ? '우수한 발표 역량입니다!' : avgScore >= 60 ? '좋은 발표였습니다.' : '더 연습이 필요합니다.'}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">발표 + Q&A {ptResults.length}개 항목 평균 점수입니다.</p>
          </div>
        </div>

        {presentation && (
          <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
            <div className="px-8 py-5 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
              <span className="w-8 h-8 bg-violet-600 text-white rounded-lg flex items-center justify-center text-sm font-black">📊</span>
              <p className="font-black text-zinc-800 dark:text-white">발표 평가</p>
              <span className="ml-auto font-black text-violet-600 dark:text-violet-400 text-lg">{presentation.answerScore}점</span>
            </div>
            <div className="p-8 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 bg-violet-50 dark:bg-violet-500/10 rounded-2xl p-4">
                  <p className="text-xs font-bold text-violet-500 mb-1">👀 시선 집중도</p>
                  <p className="text-3xl font-black text-violet-800 dark:text-violet-200">{presentation.focusScore}<span className="text-base font-normal text-violet-400">%</span></p>
                </div>
                <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-2xl p-4">
                  <p className="text-xs font-bold text-zinc-500 mb-1">🎙️ 발표 내용</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-3">{presentation.transcript || '(인식된 발표 없음)'}</p>
                </div>
              </div>
              {presentation.feedback && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-500/20">
                    <p className="text-xs font-bold text-emerald-600 mb-1">✅ 강점</p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">{presentation.feedback.good}</p>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-500/10 rounded-xl p-4 border border-rose-100 dark:border-rose-500/20">
                    <p className="text-xs font-bold text-rose-600 mb-1">⚡ 보완점</p>
                    <p className="text-sm text-rose-800 dark:text-rose-300">{presentation.feedback.bad}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {qaItems.map((item, i) => (
          <div key={i} className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
            <div className="px-8 py-5 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
              <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-black">Q{i + 1}</span>
              <p className="font-bold text-zinc-800 dark:text-white flex-1">{item.question}</p>
              <span className="font-black text-indigo-600 dark:text-indigo-400">{item.answerScore}점</span>
            </div>
            <div className="p-8 space-y-3">
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                <p className="text-xs font-bold text-zinc-400 mb-2">🎙️ 답변</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.answer || '(답변 없음)'}</p>
              </div>
              {item.feedback && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-500/20">
                    <p className="text-xs font-bold text-emerald-600 mb-1">✅ 강점</p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">{item.feedback.good}</p>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-500/10 rounded-xl p-4 border border-rose-100 dark:border-rose-500/20">
                    <p className="text-xs font-bold text-rose-600 mb-1">⚡ 보완점</p>
                    <p className="text-sm text-rose-800 dark:text-rose-300">{item.feedback.bad}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        <button onClick={() => window.location.reload()} className="w-full flex items-center justify-center gap-2.5 px-8 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold border border-gray-200 dark:border-zinc-700 shadow-md hover:-translate-y-0.5 transition-all">
          🔄 새로운 면접 시작하기
        </button>
      </div>
    </div>
  );
}
