interface GroupReportProps {
  groupResults: any;
  mySocketId: string;
  groupRoomCode: string;
}

export function GroupReport({ groupResults, mySocketId, groupRoomCode }: GroupReportProps) {
  const { results, participants } = groupResults;
  const rankMap: Record<string, number> = {};
  participants?.forEach((p: any) => {
    let total = 0, count = 0;
    results?.forEach((q: any) => {
      const ans = q.answers?.find((a: any) => a.participantId === p.socketId);
      if (ans) { total += ans.answerScore || 0; count++; }
    });
    rankMap[p.socketId] = count > 0 ? Math.round(total / count) : 0;
  });
  const ranked = [...(participants || [])].sort((a: any, b: any) => (rankMap[b.socketId] || 0) - (rankMap[a.socketId] || 0));

  return (
    <div className="min-h-screen bg-[#F0F4FF] dark:bg-[#0A0A0F] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#6366F1] rounded-3xl px-8 py-12 text-white text-center">
          <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-2">Group Interview</p>
          <h1 className="text-3xl font-black mb-1">집단면접 종합 결과</h1>
          <p className="text-blue-200 text-sm">방 코드: {groupRoomCode} · 참가자 {ranked.length}명</p>
        </div>

        <div className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
          <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5">
            <h2 className="text-lg font-black text-zinc-800 dark:text-white">🏆 종합 순위</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {ranked.map((p: any, idx: number) => {
              const avg = rankMap[p.socketId] || 0;
              const isMe = p.socketId === mySocketId;
              const medal = ['🥇', '🥈', '🥉'][idx] || `${idx + 1}위`;
              const barColor = avg >= 80 ? 'bg-emerald-500' : avg >= 60 ? 'bg-blue-500' : 'bg-amber-500';
              return (
                <div key={p.socketId} className={`px-8 py-5 flex items-center gap-4 ${isMe ? 'bg-blue-50 dark:bg-blue-500/10' : ''}`}>
                  <span className="text-2xl w-8 text-center flex-shrink-0">{medal}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                      {p.name} {isMe && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">나</span>}
                    </p>
                    <div className="mt-1.5 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${avg}%` }} />
                    </div>
                  </div>
                  <span className="font-black text-2xl text-zinc-800 dark:text-white flex-shrink-0">{avg}<span className="text-sm font-normal text-zinc-400">점</span></span>
                </div>
              );
            })}
          </div>
        </div>

        {results?.map((q: any, qi: number) => (
          <div key={qi} className="bg-white dark:bg-[#111118] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-xl">
            <div className="px-8 py-5 border-b border-gray-100 dark:border-white/5 flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-black">Q{qi + 1}</span>
              <p className="font-bold text-zinc-800 dark:text-white leading-snug">{q.question?.replace(/^\d+\.\s*/, '')}</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {q.answers?.map((ans: any, ai: number) => {
                const isMe = ans.participantId === mySocketId;
                return (
                  <div key={ai} className={`px-8 py-6 space-y-3 ${isMe ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-sm text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                        {ans.participantName} {isMe && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">나</span>}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-zinc-400">👀 {ans.focusScore}%</span>
                        <span className="font-black text-blue-600 dark:text-blue-400">{ans.answerScore}점</span>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 leading-relaxed">
                      {ans.answer || '(답변 없음)'}
                    </p>
                    {ans.feedback && (
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                          ✅ {ans.feedback.good}
                        </span>
                        <span className="text-xs px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-500/20">
                          ⚡ {ans.feedback.bad}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
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
