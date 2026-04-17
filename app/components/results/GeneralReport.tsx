import { RefObject } from 'react';

interface GeneralReportProps {
  reportData: any[];
  reportRef: RefObject<HTMLDivElement | null>;
  onDownloadPdf: () => void;
}

export function GeneralReport({ reportData, reportRef, onDownloadPdf }: GeneralReportProps) {
  const avgScore = Math.round(reportData.reduce((acc, item) => acc + (item.answerScore || 0), 0) / reportData.length);
  const scoreColor = avgScore >= 80 ? '#10B981' : avgScore >= 60 ? '#3B82F6' : '#F59E0B';

  return (
    <div className="min-h-screen bg-[#F0F4FF] dark:bg-[#0A0A0F] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div ref={reportRef} className="bg-white dark:bg-[#111118] rounded-3xl overflow-hidden shadow-2xl">
          <div className="relative bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#6366F1] px-8 py-12 text-white text-center overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px'}}></div>
            <div className="relative">
              <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-3">AI Interview</p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">종합 분석 리포트</h1>
              <p className="text-blue-200 text-base">답변과 안면 인식 데이터를 기반으로 분석된 결과입니다</p>
            </div>
          </div>

          <div className="px-8 -mt-6 mb-8">
            <div className="bg-white dark:bg-[#1A1A28] rounded-2xl border border-gray-100 dark:border-[rgba(255,255,255,0.05)] shadow-xl p-8 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative flex-shrink-0">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" strokeWidth="10" style={{stroke: 'var(--ring-track, #E5E7EB)'}}/>
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke={scoreColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - avgScore / 100)}`}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-zinc-900 dark:text-white">{avgScore}</span>
                  <span className="text-sm text-zinc-400 font-medium">/ 100</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-1">종합 면접 점수</p>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
                  {avgScore >= 80 ? '우수한 면접 역량입니다!' : avgScore >= 60 ? '좋은 면접 역량입니다.' : '더 연습이 필요합니다.'}
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                  총 {reportData.length}개 질문에 대한 AI 평가 점수 평균입니다. 하단에서 질문별 상세 피드백을 확인하세요.
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 pb-10 space-y-6">
            {reportData.map((item, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-[#1A1A28] rounded-2xl border border-gray-100 dark:border-[rgba(255,255,255,0.05)] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-[rgba(255,255,255,0.05)] flex items-start gap-3">
                  <span className={`flex-shrink-0 w-8 h-8 text-white rounded-lg flex items-center justify-center text-sm font-black ${item.isFollowup ? 'bg-orange-500' : 'bg-blue-600'}`}>
                    Q{idx + 1}
                  </span>
                  <div className="flex flex-col gap-1">
                    {item.isFollowup && (
                      <span className="self-start text-xs font-black px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full">🔁 꼬리 질문</span>
                    )}
                    <p className="font-bold text-zinc-800 dark:text-zinc-100 leading-snug">
                      {item.question.replace(new RegExp('^\\d+\\.\\s*'), '')}
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-white dark:bg-[#111118] rounded-xl p-4 border border-gray-100 dark:border-[rgba(255,255,255,0.05)]">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <span className="text-base">🎙️</span> 지원자 답변
                    </p>
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {item.answer || '(답변을 인식하지 못했습니다.)'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-[rgba(23,37,84,0.3)] rounded-xl p-4 border border-blue-100 dark:border-[rgba(59,130,246,0.1)]">
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">👀 시선 집중도</p>
                      <p className="text-3xl font-black text-blue-900 dark:text-blue-100">
                        {item.focusScore}<span className="text-lg font-bold text-blue-400">%</span>
                      </p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-[rgba(2,44,34,0.3)] rounded-xl p-4 border border-emerald-100 dark:border-[rgba(16,185,129,0.1)]">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">🗣️ 발화 프레임</p>
                      <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100">
                        {item.analysis.mouthOpenFrames}
                        <span className="text-base font-bold text-emerald-400"> / {item.analysis.totalFrames}</span>
                      </p>
                    </div>
                  </div>

                  {item.feedback && (
                    <div className="bg-indigo-50 dark:bg-[rgba(49,46,129,0.2)] rounded-xl border border-indigo-100 dark:border-[rgba(99,102,241,0.15)] overflow-hidden">
                      <div className="px-5 py-3 border-b border-indigo-100 dark:border-[rgba(99,102,241,0.15)] flex items-center justify-between">
                        <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                          <span>💡</span> AI 면접관 피드백
                        </p>
                        <span className="text-xs font-black px-3 py-1 bg-indigo-200 dark:bg-[rgba(99,102,241,0.2)] text-indigo-800 dark:text-indigo-200 rounded-full border border-indigo-300 dark:border-[rgba(99,102,241,0.2)]">
                          {item.answerScore || 0}점
                        </span>
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 text-xs font-black px-2 py-0.5 bg-emerald-100 dark:bg-[rgba(16,185,129,0.2)] text-emerald-700 dark:text-emerald-300 rounded-md mt-0.5">강점</span>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{item.feedback.good}</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 text-xs font-black px-2 py-0.5 bg-rose-100 dark:bg-[rgba(244,63,94,0.2)] text-rose-700 dark:text-rose-300 rounded-md mt-0.5">보완</span>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{item.feedback.bad}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={onDownloadPdf}
            className="flex items-center justify-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-2xl font-bold text-base transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5"
          >
            <span className="text-lg">📄</span> PDF로 다운로드
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2.5 px-8 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold text-base transition-all shadow-lg shadow-zinc-200/50 dark:shadow-black/20 hover:-translate-y-0.5 border border-gray-200 dark:border-zinc-700"
          >
            <span className="text-lg">🔄</span> 새로운 면접 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
