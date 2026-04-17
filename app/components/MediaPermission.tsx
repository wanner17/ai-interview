interface MediaPermissionProps {
  onRequestMedia: () => void;
  mediaError: string | null;
}

export function MediaPermission({ onRequestMedia, mediaError }: MediaPermissionProps) {
  return (
    <div className="bg-white dark:bg-[#111118] rounded-3xl shadow-xl shadow-blue-900/5 dark:shadow-black/30 border border-gray-100 dark:border-white/5 overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>
      <div className="flex flex-col items-center text-center px-8 py-14">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-2xl scale-150"></div>
          <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-blue-600/30">
            🎙️
          </div>
        </div>

        <h2 className="text-3xl font-black mb-3 text-zinc-900 dark:text-white">면접 준비를 시작할까요?</h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-10 leading-relaxed">
          실전과 같은 AI 면접을 위해 카메라와 마이크 권한이 필요합니다.<br/>
          수집된 영상은 실시간 안면 분석에만 사용됩니다.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-10">
          {[
            { icon: '👁️', title: '실시간 분석', desc: '시선·표정·발화를 AI가 실시간으로 추적' },
            { icon: '🔒', title: '안전한 처리', desc: '영상 데이터는 외부로 저장되지 않음' },
            { icon: '📊', title: '상세 리포트', desc: '면접 종료 후 AI 피드백 리포트 제공' },
          ].map((f) => (
            <div key={f.title} className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 text-left">
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200 mb-1">{f.title}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onRequestMedia}
          className="px-10 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/30 transition-all hover:-translate-y-0.5 text-base"
        >
          권한 허용하기 →
        </button>

        {mediaError && (
          <div className="mt-6 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-3 rounded-xl">
            <span>⚠️</span> {mediaError}
          </div>
        )}
      </div>
    </div>
  );
}
