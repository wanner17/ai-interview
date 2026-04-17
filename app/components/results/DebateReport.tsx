interface DebateReportProps {
  debateResults: any;
  mySocketId: string;
  debateTotalRoundsState: number;
}

export function DebateReport({ debateResults, mySocketId, debateTotalRoundsState }: DebateReportProps) {
  const { topic, participants, speeches, evaluations } = debateResults;
  const ranked = [...(participants || [])].sort((a: any, b: any) => {
    const eA = evaluations?.find((e: any) => e.participantId === a.socketId)?.avgScore || 0;
    const eB = evaluations?.find((e: any) => e.participantId === b.socketId)?.avgScore || 0;
    return eB - eA;
  });

  return (
    <div className="min-h-screen bg-[#F0F4FF] dark:bg-[#0A0A0F] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4338CA] rounded-3xl px-8 py-12 text-white text-center">
          <p className="text-violet-200 text-sm font-semibold tracking-widest uppercase mb-2">Discussion Interview</p>
          <h1 className="text-3xl font-black mb-2">토론면접 종합 결과</h1>
          <p className="text-violet-200 text-sm max-w-xl mx-auto leading-relaxed">{topic}</p>
        </div>

        <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
          <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5">
            <h2 className="text-lg font-black text-zinc-800 dark:text-white">🏆 종합 순위</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {ranked.map((p: any, idx: number) => {
              const ev = evaluations?.find((e: any) => e.participantId === p.socketId);
              const score = ev?.avgScore || 0;
              const isMe = p.socketId === mySocketId;
              const medal = ['🥇', '🥈', '🥉'][idx] || `${idx + 1}위`;
              const sideLabel = p.side === 'pro' ? '찬성' : p.side === 'con' ? '반대' : '자유';
              const sideColor = p.side === 'pro' ? 'bg-blue-500' : p.side === 'con' ? 'bg-rose-500' : 'bg-zinc-500';
              const barColor = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : 'bg-amber-500';
              return (
                <div key={p.socketId} className={`px-8 py-5 flex items-center gap-4 ${isMe ? 'bg-violet-50 dark:bg-violet-500/10' : ''}`}>
                  <span className="text-2xl w-8 text-center flex-shrink-0">{medal}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-zinc-800 dark:text-white">{p.name}</p>
                      <span className={`text-xs text-white px-2 py-0.5 rounded-full ${sideColor}`}>{sideLabel}</span>
                      {isMe && <span className="text-xs bg-violet-500 text-white px-2 py-0.5 rounded-full">나</span>}
                    </div>
                    {ev && <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">💪 {ev.strength}</p>}
                    <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                  <span className="font-black text-2xl text-zinc-800 dark:text-white flex-shrink-0">{score}<span className="text-sm font-normal text-zinc-400">점</span></span>
                </div>
              );
            })}
          </div>
        </div>

        {Array.from({ length: debateTotalRoundsState }, (_, ri) => {
          const roundSpeeches = speeches?.filter((s: any) => s.round === ri + 1) || [];
          if (roundSpeeches.length === 0) return null;
          return (
            <div key={ri} className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
              <div className="px-8 py-5 border-b border-gray-100 dark:border-white/5">
                <h2 className="text-base font-black text-zinc-800 dark:text-white">📢 라운드 {ri + 1} 발언</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {roundSpeeches.map((s: any, si: number) => {
                  const isMe = s.participantId === mySocketId;
                  const sideColor = s.side === 'pro' ? 'bg-blue-500' : s.side === 'con' ? 'bg-rose-500' : 'bg-zinc-500';
                  const sideLabel = s.side === 'pro' ? '찬성' : s.side === 'con' ? '반대' : '자유';
                  return (
                    <div key={si} className={`px-8 py-5 space-y-2 ${isMe ? 'bg-violet-50/50 dark:bg-violet-500/5' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs text-white px-2 py-0.5 rounded-full ${sideColor}`}>{sideLabel}</span>
                          <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{s.participantName} {isMe && <span className="text-xs bg-violet-500 text-white px-1.5 py-0.5 rounded-full">나</span>}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span>👀 {s.focusScore}%</span>
                          <span className="font-black text-violet-600 dark:text-violet-400">{s.answerScore}점</span>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 leading-relaxed">{s.speech || '(발언 없음)'}</p>
                      {s.feedback && (
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-500/20">✅ {s.feedback.good}</span>
                          <span className="text-xs px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-500/20">⚡ {s.feedback.bad}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <button onClick={() => window.location.reload()} className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-2xl font-bold border border-gray-200 dark:border-zinc-700 shadow-md hover:-translate-y-0.5 transition-all">
          🔄 새로운 면접 시작하기
        </button>
      </div>
    </div>
  );
}
